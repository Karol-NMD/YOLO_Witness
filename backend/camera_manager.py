from datetime import datetime
import numpy as np
import threading
import asyncio
import sqlite3
import base64
import queue
import json
import time
import cv2
import csv
import io
import os

from multiprocessing import Manager, Process
from ultralytics import YOLO

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRACKER_YAML = os.path.join(BASE_DIR, "Ressources", "bytetrack.yaml")
DB_PATH = os.path.join(BASE_DIR, "detections.db")


def _now_local_strs():
    """Return (date_str, time_str) in the machine's local timezone."""
    t = datetime.now().astimezone()
    return t.strftime("%Y-%m-%d"), t.strftime("%H:%M:%S")


def camera_worker(
    ip_address,
    label,
    frame_store,
    count_store,
    detection_classes,
    colors,
    last_frame_time,
    event_queue,
    zones_store,
    conf_threshold=0.35,
    min_box_area=20 * 20,
    thumbnail_side=128,
    imgsz=640,
    live_flush_grabs=2,     # for RTSP/USB live streams, drop up to N old frames each tick
):
    print(f"[WORKER] Camera '{label}' connecting to {ip_address}")
    cap = cv2.VideoCapture(ip_address)

    # Smaller buffer for live streams helps keep latency low
    try:
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    except Exception:
        pass

    # Model in Ressources/
    model = YOLO(os.path.join("Ressources", "yolov8n.pt"))

    try:
        _ = model.predict(np.zeros((imgsz, imgsz, 3), dtype=np.uint8), imgsz=imgsz, verbose=False)
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
        # For live sources, optionally drop a couple of stale frames quickly to reduce lag
        if not is_file and live_flush_grabs > 0:
            for _ in range(live_flush_grabs):
                cap.grab()

        ok_read, frame = cap.read()
        if not ok_read:
            if is_file:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                continue
            print(f"[WORKER] Camera '{label}': Frame read failed or end of stream.")
            break

        # Downscale the frame to a manageable size immediately to prevent MemoryError
        target_width = 640
        if frame.shape[1] > target_width:
            aspect_ratio = frame.shape[1] / frame.shape[0]
            target_height = int(target_width / aspect_ratio)
            frame = cv2.resize(frame, (target_width, target_height), interpolation=cv2.INTER_AREA)

        # ---- Inference / tracking (use YAML if present) ----
        try:
            if os.path.isfile(TRACKER_YAML):
                results = model.track(
                    source=frame,
                    persist=True,
                    tracker=TRACKER_YAML,
                    imgsz=imgsz,
                    verbose=False,
                    stream=False,
                )[0]
            else:
                results = model.predict(source=frame, imgsz=imgsz, verbose=False, stream=False, tracker=None)[0]
        except Exception as e:
            print(f"[WORKER] '{label}' track() error: {e}")
            try:
                model.predictor.args.tracker = None
            except Exception:
                pass
            results = model.predict(source=frame, imgsz=imgsz, verbose=False, stream=False)[0]

        # ---- Per-frame counts ----
        counts = {k: 0 for k in task_keys}
        active_ids = set()

        zones_for_camera = zones_store.get(label, [])

        boxes = getattr(results, "boxes", None)
        if boxes is not None and len(boxes) > 0:
            xyxy = boxes.xyxy  # Nx4
            cls = boxes.cls   # Nx1
            conf = boxes.conf  # Nx1
            ids = getattr(boxes, "id", None)  # Nx1 or None

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
                x1, y1, x2, y2 = map(int, map(round, xyxy[i].tolist()))
                w, h = max(0, x2 - x1), max(0, y2 - y1)
                if w * h < min_box_area:
                    continue

                # --- ✅ Zone filtering (with fallback) ---
                cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)

                if zones_for_camera:
                    zone_id = None
                    for zone in zones_for_camera:
                        polygon = np.array(zone["points"], np.int32)
                        if cv2.pointPolygonTest(polygon, (cx, cy), False) >= 0:
                            zone_id = zone["id"]
                            break
                    if zone_id is None:
                        continue  # skip detection outside all zones
                else:
                    zone_id = None

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
                date_s, time_s = _now_local_strs()

                base_evt = {
                    "type": cls_name,
                    "label": label,
                    "zone_id": zone_id,
                    "track_id": int(tid),
                    "confidence": c,
                    "bbox": [int(x1), int(y1), int(x2), int(y2)],
                    "date": date_s,
                    "time": time_s,
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
            date_s, time_s = _now_local_strs()
            for tid in lost_ids:
                event_queue.put({
                    "event": "lost",
                    "label": label,
                    "track_id": int(tid),
                    "date": date_s,
                    "time": time_s,
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
        self.zones = manager.dict()

        self.pending_disappears = manager.dict()
        self.event_queue = manager.Queue()  # NEW: Event transport queue

        self.clients = set()  # ✅ NEW: WebSocket clients /ws/events clients
        self.count_clients = set()  # /ws/counts clients
        self.frontend_count_clients = set()  # NEW: /ws/counts-list clients
        self.loop = asyncio.get_event_loop()

        # Event / tracker tuning
        self.disappear_grace_sec = 1.5

        self.processes = {}
        self._running = True
        self._proc_lock = threading.Lock()

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

        # ----- DB Setup -----
        self._db_lock = threading.Lock()
        self._db = sqlite3.connect(DB_PATH, check_same_thread=False)
        self._db.execute("""
        CREATE TABLE IF NOT EXISTS detections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            label TEXT,
            class TEXT,
            track_id INTEGER,
            confidence REAL,
            x1 INTEGER, y1 INTEGER, x2 INTEGER, y2 INTEGER,
            date TEXT, time TEXT,
            event TEXT,      -- 'appear' | 'update' | 'disappear'
            mime TEXT,
            thumbnail_b64 TEXT
            )
        """)

        # Helpful indexes for filtering
        self._db.execute("CREATE INDEX IF NOT EXISTS idx_dt ON detections(date, time)")
        self._db.execute("CREATE INDEX IF NOT EXISTS idx_label ON detections(label)")
        self._db.execute("CREATE INDEX IF NOT EXISTS idx_class ON detections(class)")
        self._db.commit()

        threading.Thread(target=self._event_broadcaster, daemon=True).start()
        threading.Thread(target=self._watchdog_loop, daemon=True).start()
        threading.Thread(target=self._counts_publisher, daemon=True).start()

    def is_running(self, label):
        return label in self.processes and self.processes[label].is_alive()

    def add_client(self, ws):
        self.clients.add(ws)

    def remove_client(self, ws):
        self.clients.discard(ws)

    def add_count_client(self, ws):
        self.count_clients.add(ws)

    def remove_count_client(self, ws):
        self.count_clients.discard(ws)

    def add_frontend_count_client(self, ws):
        self.frontend_count_clients.add(ws)

    def remove_frontend_count_client(self, ws):
        self.frontend_count_clients.discard(ws)

    def broadcast_event(self, event: dict):
        try:
            message = json.dumps(event, ensure_ascii=False)
            asyncio.run_coroutine_threadsafe(
                self._broadcast(message),
                self.loop
            )
        except Exception as e:
            print(f"[ERROR] Broadcasting event: {e}")

    def broadcast_counts(self, payload: dict):
        try:
            message = json.dumps(payload, ensure_ascii=False)
            asyncio.run_coroutine_threadsafe(
                self._broadcast_counts(message),
                self.loop
            )
        except Exception as e:
            print(f"[ERROR] Broadcasting counts: {e}")

    async def _broadcast(self, message: str):
        to_remove = set()
        for ws in self.clients:
            try:
                await ws.send_text(message)
            except Exception:
                to_remove.add(ws)
        for ws in to_remove:
            self.clients.remove(ws)

    async def _broadcast_counts(self, message: str):
        to_remove = set()
        for ws in self.count_clients:
            try:
                await ws.send_text(message)
            except Exception:
                to_remove.add(ws)
        for ws in to_remove:
            self.count_clients.remove(ws)

    async def _broadcast_frontend_counts(self, message: str):
        to_remove = set()
        for ws in self.frontend_count_clients:
            try:
                await ws.send_text(message)
            except Exception:
                to_remove.add(ws)
        for ws in to_remove:
            self.frontend_count_clients.remove(ws)

    def set_zones(self, label: str, zones: list[dict]):
        """Replace all zones for a camera."""
        self.zones[label] = zones

    def get_zones(self, label:str):
        return self.zones.get(label, [])

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
            self.zones,
        ), daemon=True)
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
        with self._proc_lock:
            proc = self.processes.get(label)
            if proc and proc.is_alive():
                print(f"[INFO] Stopping camera '{label}'")
            proc.terminate()
            proc.join(timeout=5)
            if proc.is_alive():
                print(f"[WARN] Camera '{label}' did not exit after terminate(). Forcing kill.")
            proc.kill()
            proc.join(timeout=2)

            self.processes.pop(label, None)
            self.frame_store.pop(label, None)
            self.count_store.pop(label, None)
            self.last_frame_time.pop(label, None)

            for k in list(self.pending_disappears.keys()):
                if k[0] == label:
                    self.pending_disappears.pop(k, None)

            print(f"[INFO] Camera '{label}' stopped (cleanup done).")

    def stop_all(self):
        with self._proc_lock:
            print(f"[INFO] Stopping all camera processes...")
            for label, process in list(self.processes.items()):
                if process.is_alive():
                    print(f"[INFO] Terminating camera '{label}'")
            process.terminate()
            process.join(timeout=5)
            if process.is_alive():
                print(f"[WARN] Camera '{label}' did not exit after terminate(). Forcing kill.")
            process.kill()
            process.join(timeout=2)
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
        try:
            with self._db_lock:
                self._db.close()
        except Exception:
            pass

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

    def _counts_publisher(self, interval=0.5):
        """Push live per-camera counts + totals to /ws/counts clients."""
        while self._running:
            snapshot = {}
            totals = {}
            ts_date, ts_time = _now_local_strs()
            # collect
            for label, counts in list(self.count_store.items()):
                snapshot[label] = dict(counts)
                for k, v in counts.items():
                    totals[k] = totals.get(k, 0) + int(v)
            # 1. API payload
            api_payload = {"ts": {"date": ts_date, "time": ts_time}, "per_camera": snapshot, "totals": totals}
            if self.count_clients:
                try:
                    message = json.dumps(api_payload, ensure_ascii=False)
                    asyncio.run_coroutine_threadsafe(
                        self._broadcast_counts(message), self.loop
                    )
                except Exception as e:
                    print(f"[ERROR] Broadcasting API counts: {e}")

            # 2. Frontend-friendly payload
            per_camera_list = []
            for cam, stats in snapshot.items():
                cam_obj = {
                    "camera": cam,
                    # Use the frontend-friendly class names
                    "box": stats.get("boxes", 0),
                    "vehicle": stats.get("vehicles", 0),
                    "people": stats.get("people", 0)
                }
                per_camera_list.append(cam_obj)

            frontend_payload = {
                "ts": {"date": ts_date, "time": ts_time},
                "total": {
                    "box": totals.get("boxes", 0),
                    "vehicle": totals.get("vehicles", 0),
                    "people": totals.get("people", 0)
                },
                "per_camera": per_camera_list
            }

            if self.frontend_count_clients:
                try:
                    message = json.dumps(frontend_payload, ensure_ascii=False)
                    asyncio.run_coroutine_threadsafe(
                        self._broadcast_frontend_counts(message), self.loop
                    )
                except Exception as e:
                    print(f"[ERROR] Broadcasting frontend counts: {e}")
            time.sleep(interval)

    def _event_broadcaster(self):
        """
                Central event fanout thread.
                - Converts 'lost' → delayed 'disappear' (grace window).
                - Cancels pending disappear on 'appear'/'update'.
                - Broadcasts events to all WS clients.
                - Logs detection instances to SQLite (by default: 'appear' only).
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
                        date_s, time_s = _now_local_strs()
                        self.broadcast_event({
                            "event": "disappear",
                            "label": label,
                            "track_id": int(tid),
                            "date": date_s,
                            "time": time_s,
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

                # ----- DB logging policy -----
                # Default: log only 'appear' rows (1 row per tracked object).
                # Flip include_updates=True to also log every 'update'.
                include_updates = False
                if evt_type == "appear" or (include_updates and evt_type == "update"):
                    self._db_log(event)

            except Exception as e:
                print(f"[ERROR] Broadcasting event: {e}")

    # ---------------- DB helpers & exports -----------------
    def _db_log(self, event: dict):
        """Insert one detection event into SQLite."""
        try:
            label = event.get("label", "")
            cls = event.get("type", "")
            track_id = int(event.get("track_id", -1))
            conf = float(event.get("confidence", 0.0))
            bbox = event.get("bbox") or [None, None, None, None]
            x1, y1, x2, y2 = (int(b) if b is not None else None for b in bbox)
            date = event.get("date", "")
            time_s = event.get("time", "")
            ev = event.get("event", "")
            mime = event.get("mime", None)
            thumb = event.get("thumbnail", None)

            with self._db_lock:
                self._db.execute(
                    """INSERT INTO detections
                                           (label, class, track_id, confidence, x1, y1, x2, y2, date, time,
                                            event, mime, thumbnail_b64)
                                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                    (label, cls, track_id, conf, x1, y1, x2, y2, date, time_s, ev, mime, thumb)
                )
                self._db.commit()
        except Exception as e:
            print(f"[DB] insert failed: {e}")

    def query_detections(self, start=None, end=None, label=None, cls=None):
        """Return list[dict] of detections filtered by date range/label/class."""
        where = []
        args = []
        if start:
            where.append("(date || ' ' || time) >= ?")
            args.append(start)
        if end:
            where.append("(date || ' ' || time) <= ?")
            args.append(end)
        if label:
            where.append("label = ?")
            args.append(label)
        if cls:
            where.append("class = ?")
            args.append(cls)
        sql = ("SELECT id, label, class, track_id, confidence, x1, y1, x2, y2, date,"
               " time, event, mime, thumbnail_b64 FROM detections")
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY date, time"

        with self._db_lock:
            cur = self._db.execute(sql, args)
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, r)) for r in cur.fetchall()]
        return rows

    def export_csv_text(self, **filters):
        rows = self.query_detections(**filters)
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(
            ["id", "label", "class", "track_id", "confidence", "x1", "y1", "x2", "y2", "date", "time", "event"])
        for r in rows:
            writer.writerow([
                r["id"], r["label"], r["class"], r["track_id"], r["confidence"],
                r["x1"], r["y1"], r["x2"], r["y2"], r["date"], r["time"], r["event"]
            ])
        return buf.getvalue()

    def export_pdf_bytes(self, **filters):
        """Create a very simple PDF table using reportlab if installed."""
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
            from reportlab.lib.units import cm
        except Exception as e:
            raise RuntimeError("reportlab not installed") from e

        rows = self.query_detections(**filters)
        packet = io.BytesIO()
        c = canvas.Canvas(packet, pagesize=A4)
        width, height = A4

        title = "Detections Report"
        c.setFont("Helvetica-Bold", 14)
        c.drawString(2 * cm, height - 2 * cm, title)

        c.setFont("Helvetica", 9)
        y = height - 3 * cm
        headers = ["date", "time", "label", "class", "track_id", "confidence"]
        c.drawString(2 * cm, y, " | ".join(h.upper() for h in headers))
        y -= 0.6 * cm

        for r in rows:
            line = f"{r['date']} | {r['time']} | {r['label']} | {r['class']} | {r['track_id']} | {r['confidence']:.2f}"
            c.drawString(2 * cm, y, line[:120])
            y -= 0.55 * cm
            if y < 2 * cm:
                c.showPage()
                y = height - 2.5 * cm

        c.showPage()
        c.save()
        return packet.getvalue()
