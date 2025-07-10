# import cv2
# from typing import Generator
# import time

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from camera_manager import CameraManager
import threading


app = FastAPI()
cameras = CameraManager()


class CameraInput(BaseModel):
    ip_address: str
    label: str


@app.post("/api/add_camera")
def add_camera(camera: CameraInput):
    if not cameras.is_running(camera.label):
        thread = threading.Thread(target=cameras.start_camera, args=(camera.ip_address, camera.label))
        thread.start()
        return {"status": "Started"}
    return {"status": "Already running"}


@app.websocket("ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    cameras.add_client(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        cameras.remove_client(websocket)


@app.get("/stream/{label}")
def video_feed(label: str):
    return StreamingResponse(cameras.generate_frames(label), media_type="multipart/x-mixed-replace; boundary=frame")

    # def generate() -> Generator[bytes, None, None]:
    #     cap = cameras.get_capture(label)
    #     if not cap:
    #         return
    #     while True:
    #         success, frame = cap.read()
    #         if not success:
    #             break
    #         _, buffer = cv2.imencode(".jpg", frame)
    #         frame_bytes = buffer.tobytes()
    #         yield (b"--frame\r\n"
    #                b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
    #         time.sleep(0.1)  # ~10FPS
    # return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")
