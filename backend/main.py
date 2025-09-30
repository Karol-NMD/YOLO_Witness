from fastapi.responses import StreamingResponse, Response, PlainTextResponse
from fastapi import FastAPI, WebSocket, Query, HTTPException
from starlette.websockets import WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from camera_manager import CameraManager
from typing import Optional, List
from pydantic import BaseModel
from logger import get_logger
import threading
import asyncio
import os
import sys

logger = get_logger()

def resource_path(relative_path: str) -> str:
    """Get absolute path to resource, works for dev and for PyInstaller"""
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)


frontend_path = resource_path("frontend/out")
if not os.path.exists(frontend_path):
    frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/out"))

cameras: CameraManager = None  # Initialize cameras here

# --- Lifespan context for FastAPI ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    global cameras
    cameras = CameraManager()
    logger.info("CameraManager initialized via lifespan.")
    yield
    logger.info("Shutting down CameraManager...")
    cameras.shutdown()

app = FastAPI(title="Witness", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic models ---
class CameraInput(BaseModel):
    ip_address: str
    label: str

class ZoneInput(BaseModel):
    id: str
    points: List[List[int]]

# --- HTTP routes ---
@app.post("/api/add_camera")
def add_camera(camera: CameraInput):
    if not cameras:
        raise HTTPException(status_code=500, detail="CameraManager not initialized yet.")
    
    logger.info(f"Received POST /api/add_camera: {camera.dict()}")
    ip_input = camera.ip_address
    if ip_input.isdigit():
        ip_or_file = ip_input
    else:
        ip_or_file = resource_path(ip_input)

    if cameras.is_running(camera.label):
        raise HTTPException(status_code=409, detail=f"Camera '{camera.label}' already running.")
    
    threading.Thread(target=cameras.start_camera, args=(ip_or_file, camera.label)).start()
    return {"status": "Started", "label": camera.label}

@app.post("/api/stop_camera")
def stop_camera(label: str = Query(...)):
    if not cameras.is_running(label):
        raise HTTPException(status_code=404, detail=f"Camera '{label}' not running.")
    threading.Thread(target=cameras.stop_camera, args=(label,), daemon=True).start()
    return {"status": f"Stop signal sent to '{label}'"}

@app.post("/api/stop_all")
def stop_all():
    threading.Thread(target=cameras.stop_all, daemon=True).start()
    return {"status": "Stop signal sent to all cameras"}

@app.post("/api/set_zones")
def set_zones(label: str, zones: List[ZoneInput]):
    cameras.set_zones(label, [z.dict() for z in zones])
    return {"status": "Zones updated", "label": label, "count": len(zones)}

# --- WebSocket handlers ---
async def websocket_handler(websocket: WebSocket, client_add, client_remove):
    await websocket.accept()
    client_add(websocket)
    try:
        while True:
            await asyncio.sleep(60)
    except WebSocketDisconnect:
        pass
    finally:
        client_remove(websocket)

@app.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    await websocket_handler(websocket, cameras.add_client, cameras.remove_client)

@app.websocket("/ws/counts")
async def websocket_counts(websocket: WebSocket):
    await websocket_handler(websocket, cameras.add_count_client, cameras.remove_count_client)

@app.websocket("/ws/counts-list")
async def websocket_counts_list(websocket: WebSocket):
    await websocket_handler(websocket, cameras.add_frontend_count_client, cameras.remove_frontend_count_client)

# --- MJPEG stream ---
@app.get("/stream/{label}")
def video_feed(label: str):
    if not cameras.is_running(label):
        raise HTTPException(status_code=404, detail=f"Camera '{label}' not running.")
    return StreamingResponse(cameras.generate_frames(label), media_type="multipart/x-mixed-replace; boundary=frame")

# --- Export routes ---
@app.get("/api/export/csv")
def export_csv(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    label: Optional[str] = None,
    cls: Optional[str] = Query(None, alias="class")
):
    csv_text = cameras.export_csv_text(start=start, end=end, label=label, cls=cls)
    headers = {"Content-Disposition": "attachment; filename=detections.csv"}
    return Response(content=csv_text, media_type="text/csv; charset=utf-8", headers=headers)

@app.get("/api/export/pdf")
def export_pdf(
    start: Optional[str] = Query(None),
    end: Optional[str] = Query(None),
    label: Optional[str] = None,
    cls: Optional[str] = Query(None, alias="class")
):
    try:
        data = cameras.export_pdf_bytes(start=start, end=end, label=label, cls=cls)
    except RuntimeError:
        return PlainTextResponse("PDF export requires 'reportlab'", status_code=501)
    headers = {"Content-Disposition": "attachment; filename=detections.pdf"}
    return Response(content=data, media_type="application/pdf", headers=headers)

@app.get("/api/get_zones")
def get_zones(label: str):
    return {"label": label, "zones": cameras.get_zones(label)}

app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

# -------------------------
if __name__ == "__main__":
    import multiprocessing
    import uvicorn
    import webbrowser
    multiprocessing.freeze_support()  # Safe for PyInstaller + Windows
    logger.info("Starting Witness...")

    # Optional: open browser
    threading.Thread(target=lambda: webbrowser.open("http://localhost:8000/"), daemon=True).start()

    uvicorn.run(app, host="127.0.0.1", port=8000, reload=False)
