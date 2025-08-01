import threading
import asyncio
import base64
import queue
import json
import time
import cv2

from multiprocessing import Manager, Process
from ultralytics import YOLO


def camera_worker(ip_address, label, frame_store, count_store, detection_classes, colors,
                  detection_ids, last_frame_time, event_queue):
    print(f"[WORKER] Camera '{label}' connecting to {ip_address}")
    cap = cv2.VideoCapture(ip_address)
    model = YOLO("yolov8n.pt")

    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print(f"[WORKER] Camera '{label}': Frame read failed or end of stream.")
            break

        results = model(frame, verbose=False)[0]

        counts = {task: 0 for task in detection_classes}  # people, vehicles, boxes

        for box in results.boxes:
            cls_id = int(box.cls)
            cls_name = model.names[cls_id]
            conf = float(box.conf)

            # Check if class belongs to any task group
            for task, class_list in detection_classes.items():
                if cls_name in class_list:
                    counts[task] += 1

                    # Draw bounding box
                    x1, y1, x2, y2 = map(int, box.xyxy[0])
                    color = colors.get(cls_name, (0, 255, 255))  # fallback to yellow
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{cls_name} {conf:.2f}", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

                    if y2 > y1 and x2 > x1:
                        cropped = frame[y1:y2, x1:x2]
                        try:
                            cropped = cv2.resize(cropped, (64, 64))
                            _, buffer = cv2.imencode(".jpg", cropped)
                            thumbnail_b64 = base64.b64encode(buffer).decode("utf-8")
                        except Exception as e:
                            print(f"[WARNING] Thumbnail encoding failed: {e}")
                            thumbnail_b64 = None
                    else:
                        thumbnail_b64 = None

                    # UTC timestamp
                    utc_now = time.gmtime()

                    counter = detection_ids.get(label, 0)
                    detection_ids[label] = counter + 1

                    # Send event
                    event_queue.put({
                        "type": task,
                        "class": cls_name,
                        "label": label,
                        "confidence": conf,
                        "date": time.strftime("%Y-%m-%d", utc_now),
                        "time": time.strftime("%H:%M:%S", utc_now),
                        "thumbnail": thumbnail_b64,
                        "object_id": f"{label}_{counter}"
                    })

        # Encode frame
        ret, buffer = cv2.imencode(".jpg", frame)
        if not ret:
            continue

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
        self.detection_ids = manager.dict()  # ✅ NEW: Per-label ID counters
        self.event_queue = manager.Queue()  # NEW: Event transport queue

        self.loop = asyncio.get_event_loop()

        self.processes = {}
        self.clients = set()  # ✅ NEW: WebSocket clients

        self._running = True

        self.detection_classes = {
            'people': ['person'],
            'vehicles': ['car', 'bus', 'truck'],
            'boxes': ['box', 'cardboard', 'carton']
        }

        self.colors = {
            'person': (0, 255, 0),
            'car': (255, 0, 0),
            'bus': (255, 0, 0),
            'truck': (255, 0, 0),
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
            message = json.dumps(event)
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
            except:
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
            self.detection_ids,
            self.last_frame_time,
            self.event_queue
        ))
        p.start()
        self.processes[label] = p

    def generate_frames(self, label):
        while True:
            if label not in self.frame_store:
                time.sleep(0.1)
                continue

            frame_bytes = self.frame_store[label]

            yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )

    def stop_camera(self, label):
        if label in self.processes:
            proc = self.processes[label]
            if proc.is_alive():
                print(f"[INFO] Stopping camera '{label}'")
                proc.terminate()
                proc.join()
            del self.processes[label]
            self.frame_store.pop(label, None)
            self.count_store.pop(label, None)
            self.detection_ids.pop(label, None)
            self.last_frame_time.pop(label, None)
        else:
            print(f"[INFO] Camera '{label}' already stopped.")

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
        self.detection_ids.clear()
        self.last_frame_time.clear()
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
        print("[EVENT LOOP] Broadcaster started.")
        while self._running:
            try:
                event = self.event_queue.get(timeout=1)
                self.broadcast_event(event)
            except queue.Empty:
                continue
            except Exception as e:
                print(f"[ERROR] Broadcasting event: {e}")

