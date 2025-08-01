from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from camera_manager import CameraManager
import multiprocessing
import threading
import sys

multiprocessing.set_executable(sys.executable)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:3000"] for Next.js
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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


@app.post("/api/stop_camera")
def stop_camera(label: str = Query(...)):
    cameras.stop_camera(label)
    return {"status": f"Camera '{label}' stopped."}


@app.post("/api/stop_all")
def stop_all():
    cameras.stop_all()
    return {"status": "All cameras stopped."}


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


@app.on_event("shutdown")
def shutdown_event():
    cameras.shutdown()