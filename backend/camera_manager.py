import cv2
import asyncio
import time
import json
import base64
import threading


class CameraManager:
    def __init__(self):
        self.active_cameras = {}
        self.clients = set()
        self.cascade = cv2.CascadeClassifier("haarcascade_fullbody.xml")
        self.detection_ids = {}
        self.latest_frames = {}
        self.locks = {}

    def get_next_id(self, label):
        last_id = self.detection_ids.get(label, 0)
        self.detection_ids[label] = last_id + 1
        return self.detection_ids[label]

    def is_running(self, label):
        return label in self.active_cameras

    def add_client(self, ws):
        self.clients.add(ws)

    def remove_client(self, ws):
        self.clients.discard(ws)

    def broadcast_event(self, event):
        message = json.dumps(event)
        asyncio.run(self._broadcast(message))

    async def _broadcast(self, message):
        to_remove = set()
        for ws in self.clients:
            try:
                await ws.send_text(message)
            except:
                to_remove.add(ws)
        for ws in to_remove:
            self.clients.remove(ws)

    def get_capture(self, label):
        return self.active_cameras.get(label, None)

    def start_camera(self, ip_address, label):
        # cap = cv2.VideoCapture(ip_address)
        cap = cv2.VideoCapture("test_video_2.mp4")

        if not cap.isOpened():
            print(f"[ERROR] Cannot open stream for {label}")
            return

        print(f"[INFO] Starting camera '{label}'...")
        self.active_cameras[label] = cap
        self.locks[label] = threading.Lock()

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # rewind
                continue

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            bodies = self.cascade.detectMultiScale(gray, 1.1, 4)

            detections = []

            for (x, y, w, h) in bodies:
                cropped = frame[y:y+h, x:x+w]
                _, jpeg = cv2.imencode('.jpg', cropped)
                base64_crop = base64.b64encode(jpeg).decode('utf-8')
                detection_id = self.get_next_id(label)

                cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.putText(frame, f"ID {detection_id}", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX,
                            0.6, (0, 255, 0), 2)

                detections.append({
                    "id": detection_id,
                    "bbox": [int(x), int(y), int(w), int(h)],
                    "image": base64_crop
                })

            with self.locks[label]:
                self.latest_frames[label] = frame.copy()

            if len(detections) > 0:
                event = {
                    "label": label,
                    "timestamp": time.time(),
                    "event": "Human Detected",
                    "count": len(detections),
                    "detections": detections
                }
                self.broadcast_event(event)

            time.sleep(0.2)

        cap.release()
        print(f"[INFO] Stopped Camera '{label}'")
        del self.active_cameras[label]
        del self.locks[label]
        if label in self.latest_frames:
            del self.latest_frames[label]

    def generate_frames(self, label):
        while True:
            if label not in self.latest_frames:
                time.sleep(0.1)
                continue

            with self.locks[label]:
                frame = self.latest_frames[label].copy()

            ret, buffer = cv2.imencode('.jpg', frame)
            if not ret:
                continue

            frame_bytes = buffer.tobytes()

            yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n"
            )
            time.sleep(0.1)
