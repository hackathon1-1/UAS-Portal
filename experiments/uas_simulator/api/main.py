from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from uas_builder import uas_builder_websocket_handler

app = FastAPI()

# WebSocket endpoint for the UAS Builder
@app.websocket("/ws/uas_builder")
async def websocket_endpoint_uas(websocket: WebSocket):
    await uas_builder_websocket_handler(websocket)

# Serve the main client page
@app.get("/")
async def get_client():
    return FileResponse('../client/dist/index.html')

# Serve static files from the client's dist directory
app.mount("/", StaticFiles(directory="../client/dist"), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
