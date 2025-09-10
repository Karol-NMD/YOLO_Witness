from fastapi.responses import StreamingResponse, Response, PlainTextResponse
from fastapi import FastAPI, WebSocket, Query, HTTPException
from starlette.websockets import WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from camera_manager import CameraManager
from pydantic import BaseModel
from typing import Optional
import multiprocessing
import threading
import asyncio
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


# ---------- WebSockets ----------
@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    cameras.add_client(websocket)
    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        pass
    finally:
        cameras.remove_client(websocket)


@app.websocket("/ws/counts")
async def websocket_counts(websocket: WebSocket):
    """Live per-camera counts + totals publisher"""
    await websocket.accept()
    cameras.add_count_client(websocket)
    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        pass
    finally:
        cameras.remove_count_client(websocket)


@app.websocket("/ws/counts-list")
async def websocket_counts_list(websocket: WebSocket):
    """Live per-camera counts + totals publisher for the front end."""
    await websocket.accept()
    cameras.add_frontend_count_client(websocket)
    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        pass
    finally:
        cameras.remove_frontend_count_client(websocket)


# ---------- MJPEG stream ----------
@app.get("/stream/{label}")
def video_feed(label: str):
    return StreamingResponse(cameras.generate_frames(label), media_type="multipart/x-mixed-replace; boundary=frame")


# ---------- Exports from SQLite ----------
@app.get("/api/export/csv")
def export_csv(
    start: Optional[str] = Query(None, description="Start datetime 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'"),
    end: Optional[str] = Query(None, description="End datetime 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'"),
    label: Optional[str] = None,
    cls: Optional[str] = Query(None, alias="class")
):
    """Download filtered detections as CSV."""
    try:
        csv_text = cameras.export_csv_text(start=start, end=end, label=label, cls=cls)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    headers = {"Content-Disposition": "attachment; filename=detections.csv"}
    return Response(content=csv_text, media_type="text/csv; charset=utf-8", headers=headers)


@app.get("/api/export/pdf")
def export_pdf(
    start: Optional[str] = Query(None, description="Start datetime 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'"),
    end: Optional[str] = Query(None, description="End datetime 'YYYY-MM-DD HH:MM:SS' or 'YYYY-MM-DD'"),
    label: Optional[str] = None,
    cls: Optional[str] = Query(None, alias="class")
):
    try:
        data = cameras.export_pdf_bytes(start=start, end=end, label=label, cls=cls)
    except RuntimeError as e:
        # reportlab missing
        return PlainTextResponse(
            "PDF export requires 'reportlab' (pip install reportlab).", status_code=501
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    headers = {"Content-Disposition": "attachment; filename=detections.pdf"}
    return Response(content=data, media_type="application/pdf", headers=headers)


@app.on_event("shutdown")
def shutdown_event():
    cameras.shutdown()
