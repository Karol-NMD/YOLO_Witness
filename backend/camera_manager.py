import numpy as np
import threading
import asyncio
import base64
import queue
import json
import time
import cv2
import os

from multiprocessing import Manager, Process
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRACKER_YAML = os.path.join(BASE_DIR, "Ressources", "bytetrack.yaml")


def camera_worker(
    ip_address,
    label,
    frame_store,
    count_store,
    detection_classes,
    colors,
    last_frame_time,
    event_queue,
    conf_threshold=0.25,
    min_box_area=20 * 20,
    thumbnail_side=128,
):
    print(f"[WORKER] Camera '{label}' connecting to {ip_address}")
    cap = cv2.VideoCapture(ip_address)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    # Model in Ressources/
    model = YOLO(os.path.join("Ressources", "yolov8n.pt"))

    try:
        _ = model.predict(np.zeros((640, 640, 3), dtype=np.uint8), imgsz=640, verbose=False)
    except Exception:
        pass

    # Stable dashboard keys
    task_keys = tuple(detection_classes.keys())
    count_store[label] = {k: 0 for k in task_keys}

    # Track state
    seen_ids = set()
    prev_active_ids = set()

    is_file = isinstance(ip_address, str) and os.path.isfile(ip_address)

    while cap.isOpened():
        ok_read, frame = cap.read()
        if not ok_read:
            if is_file:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            print(f"[WORKER] Camera '{label}': Frame read failed or end of stream.")
            break

        # ---- Inference / tracking (use YAML if present) ----
        try:
            if os.path.isfile(TRACKER_YAML):
                results = model.track(
                    source=frame,
                    persist=True,
                    tracker=TRACKER_YAML,
                    verbose=False,
                    stream=False,
                )[0]
            else:
                results = model.predict(source=frame, verbose=False, stream=False, tracker=None)[0]
        except Exception as e:
            print(f"[WORKER] '{label}' track() error: {e}")
            try:
                model.predictor.args.tracker = None
            except Exception:
                pass
            results = model.predict(source=frame, verbose=False, stream=False)[0]

        # ---- Per-frame counts ----
        counts = {k: 0 for k in task_keys}
        active_ids = set()

        boxes = getattr(results, "boxes", None)
        if boxes is not None and len(boxes) > 0:
            xyxy = boxes.xyxy  # Nx4
            cls  = boxes.cls   # Nx1
            conf = boxes.conf  # Nx1
            ids  = getattr(boxes, "id", None)  # Nx1 or None

            n = len(boxes)
            for i in range(n):
                # class & confidence
                try:
                    cls_id = int(cls[i].item())
                except Exception:
                    cls_id = int(cls[i]) if hasattr(cls, "__getitem__") else -1
                cls_name = model.names.get(cls_id, str(cls_id))

                try:
                    c = float(conf[i].item())
                except Exception:
                    c = float(conf[i]) if hasattr(conf, "__getitem__") else 0.0

                # quality gates
                if c < conf_threshold:
                    continue

                # bbox
                x1, y1, x2, y2 = xyxy[i].tolist()
                x1, y1, x2, y2 = map(int, map(round, (x1, y1, x2, y2)))
                w = max(0, x2 - x1)
                h = max(0, y2 - y1)
                area = w * h
                if area < min_box_area:
                    continue

                # bucket counts (first matching bucket wins)
                for task, class_list in detection_classes.items():
                    if cls_name in class_list:
                        counts[task] += 1
                        break

                # draw overlay for MJPEG stream
                color = colors.get(cls_name, (0, 255, 255))
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(
                    frame,
                    f"{cls_name} {c:.2f}",
                    (x1, max(10, y1 - 8)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.5,
                    color,
                    1,
                    cv2.LINE_AA,
                )

                # track id (present only when using tracker)
                tid = None
                if ids is not None:
                    try:
                        tid = int(ids[i].item())
                    except Exception:
                        try:
                            tid = int(ids[i])
                        except Exception:
                            tid = None

                if tid is None:
                    # no id -> we still draw & count but don't emit events
                    continue

                active_ids.add(tid)

                # base event
                utc_now = time.gmtime()
                base_evt = {
                    "type": cls_name,
                    "label": label,
                    "track_id": int(tid),
                    "confidence": c,
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "date": time.strftime("%Y-%m-%d", utc_now),
                    "time": time.strftime("%H:%M:%S", utc_now),
                }

                # appear once with thumbnail; then update w/o thumbnail
                if tid not in seen_ids:
                    seen_ids.add(tid)

                    thumb_b64 = None
                    if w > 0 and h > 0:
                        crop = frame[max(0, y1):y1 + h, max(0, x1):x1 + w]
                        if crop.size > 0:
                            try:
                                crop = cv2.resize(crop, (thumbnail_side, thumbnail_side))
                                ok_enc, buf = cv2.imencode(".webp", crop, [cv2.IMWRITE_WEBP_QUALITY, 70])
                                if ok_enc:
                                    thumb_b64 = base64.b64encode(buf).decode("utf-8")
                            except Exception as enc_err:
                                print(f"[WARNING] '{label}' thumbnail encode failed: {enc_err}")

                    evt = {"event": "appear", **base_evt}
                    if thumb_b64:
                        evt["thumbnail"] = thumb_b64
                        evt["mime"] = "image/webp"
                    event_queue.put(evt)
                else:
                    event_queue.put({"event": "update", **base_evt})

        # schedule 'lost' for ids that vanished this frame (broadcaster grace-delays to 'disappear')
        lost_ids = prev_active_ids - active_ids
        if lost_ids:
            utc_now = time.gmtime()
            for tid in lost_ids:
                event_queue.put({
                    "event": "lost",
                    "label": label,
                    "track_id": int(tid),
                    "date": time.strftime("%Y-%m-%d", utc_now),
                    "time": time.strftime("%H:%M:%S", utc_now),
                })

        prev_active_ids = active_ids

        # encode annotated frame for MJPEG
        ok_jpg, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
        if ok_jpg:
            frame_store[label] = buffer.tobytes()
            count_store[label] = counts
            last_frame_time[label] = time.time()

    cap.release()
    print(f"[WORKER] Camera '{label}' stopped.")



class CameraManager:
    def __init__(self):
        manager = Manager()
        self.frame_store = manager.dict()
        self.last_frame_time = manager.dict()
        self.count_store = manager.dict()

        self.pending_disappears = manager.dict()
        self.event_queue = manager.Queue()  # NEW: Event transport queue

        self.clients = set()  # ✅ NEW: WebSocket clients
        self.loop = asyncio.get_event_loop()

        # Event / tracker tuning
        self.disappear_grace_sec = 1.5

        self.processes = {}
        self._running = True

        self.detection_classes = {
            'people': ['person'],
            'vehicles': ['car', 'bus', 'truck', 'motorbike', 'bicycle'],
            'boxes': ['box', 'cardboard', 'carton']
        }

        self.colors = {
            'person': (0, 255, 0),
            'car': (255, 0, 0),
            'bus': (255, 0, 0),
            'truck': (255, 0, 0),
            'motorbike': (255, 0, 0),
            'bicycle': (255, 0, 0),
            'box': (255, 165, 0),
            'cardboard': (255, 165, 0),
            'carton': (255, 165, 0)
        }

        threading.Thread(target=self._event_broadcaster, daemon=True).start()
        threading.Thread(target=self._watchdog_loop, daemon=True).start()

    def is_running(self, label):
        return label in self.processes and self.processes[label].is_alive()

    def add_client(self, ws):
        self.clients.add(ws)

    def remove_client(self, ws):
        self.clients.discard(ws)

    def broadcast_event(self, event: dict):
        try:
            message = json.dumps(event, ensure_ascii=False)
            asyncio.run_coroutine_threadsafe(
                self._broadcast(message),
                self.loop
            )
        except Exception as e:
            print(f"[ERROR] Broadcasting event: {e}")

    async def _broadcast(self, message: str):
        to_remove = set()
        for ws in self.clients:
            try:
                await ws.send_text(message)
            except Exception:
                to_remove.add(ws)
        for ws in to_remove:
            self.clients.remove(ws)

    def start_camera(self, ip_address, label):
        if self.is_running(label):
            print(f"[INFO] Camera '{label}' is already running.")
            return

        print(f"[INFO] Starting camera process for '{label}' at {ip_address}")
        p = Process(target=camera_worker, args=(
            ip_address,
            label,
            self.frame_store,
            self.count_store,
            self.detection_classes,
            self.colors,
            self.last_frame_time,
            self.event_queue,
        ),)
        p.start()
        self.processes[label] = p

    def generate_frames(self, label):
        """
        Safe MJPEG generator: tolerates camera stop/removal without throwing KeyError.
        """
        boundary = b"--frame\r\nContent-Type: image/jpeg\r\n\r\n"
        while True:
            # If the process died or label was removed, end the generator
            if label not in self.processes or not self.is_running(label):
                # allow any remaining reader to exit cleanly
                time.sleep(0.05)
                break
            try:
                frame_bytes = self.frame_store[label]
            except KeyError:
                time.sleep(0.05)
                continue

            yield boundary + frame_bytes + b"\r\n"

    def stop_camera(self, label):
        # kill process
        if label in self.processes:
            proc = self.processes[label]
            if proc.is_alive():
                print(f"[INFO] Stopping camera '{label}'")
                proc.terminate()
                proc.join()
            del self.processes[label]

        # clear shared state
        self.frame_store.pop(label, None)
        self.count_store.pop(label, None)
        self.last_frame_time.pop(label, None)

        # remove pending disappear timers for this label
        for k in list(self.pending_disappears.keys()):
            if k[0] == label:
                try:
                    del self.pending_disappears[k]
                except KeyError:
                    pass

        print(f"[INFO] Camera '{label}' stopped (cleanup done).")

    def stop_all(self):
        print(f"[INFO] Stopping all camera processes...")
        for label, process in list(self.processes.items()):
            print(f"[INFO] Terminating camera '{label}'")
            if process.is_alive():
                process.terminate()
                process.join()
        self.processes.clear()
        self.frame_store.clear()
        self.count_store.clear()
        self.last_frame_time.clear()
        self.pending_disappears.clear()
        print("[INFO] All cameras stopped.")

    def shutdown(self):
        print(f"[INFO] Shutting down CameraManager...")
        self._running = False
        self.stop_all()

    def _watchdog_loop(self, timeout_sec=30):
        print(f"[WATCHDOG] Started. Timeout set to {timeout_sec} seconds.")
        while self._running:
            now = time.time()
            for label in list(self.processes.keys()):
                if not self.is_running(label):
                    continue
                last_seen = self.last_frame_time.get(label, now)
                if now - last_seen > timeout_sec:
                    print(f"[WATCHDOG] Camera '{label}' timed out. Stopping...")
                    self.stop_camera(label)
            time.sleep(5)

    def _event_broadcaster(self):
        """
                Central event fanout thread.
                - Converts 'lost' → delayed 'disappear' (grace window).
                - Cancels pending disappear on 'appear'/'update'.
                - Broadcasts events to all WS clients.
                """
        print("[EVENT LOOP] Broadcaster started.")
        grace = float(self.disappear_grace_sec)

        while self._running:
            now = time.time()

            # 1) Flush due disappears
            try:
                for key, deadline in list(self.pending_disappears.items()):
                    if now >= deadline:
                        (label, tid) = key
                        utc = time.gmtime(now)
                        self.broadcast_event({
                            "event": "disappear",
                            "label": label,
                            "track_id": int(tid),
                            "date": time.strftime("%Y-%m-%d", utc),
                            "time": time.strftime("%H:%M:%S", utc),
                        })
                        try:
                            del self.pending_disappears[key]
                        except Exception:
                            pass
            except RuntimeError:
                # dict size changed during iteration; retry next tick
                pass

            # 2) Drain queue (schedule/cancel/broadcast)
            try:
                event = self.event_queue.get(timeout=0.2)
            except queue.Empty:
                continue
            except Exception as e:
                print(f"[ERROR] Event queue get(): {e}")
                continue

            try:
                evt_type = event.get("event")
                if evt_type == "lost":
                    lbl = event.get("label")
                    tid = int(event.get("track_id"))
                    self.pending_disappears[(lbl, tid)] = now + grace
                    # Do NOT broadcast 'lost' itself
                    continue

                if evt_type in ("appear", "update"):
                    # Cancel pending disappear if any
                    lbl = event.get("label")
                    tid = int(event.get("track_id"))
                    self.pending_disappears.pop((lbl, tid), None)

                # Forward all other events (appear/update/explicit disappear)
                self.broadcast_event(event)

            except Exception as e:
                print(f"[ERROR] Broadcasting event: {e}")
