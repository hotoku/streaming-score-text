import logging
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from websockets.exceptions import ConnectionClosed

from .stream import stream

LOGGER = logging.getLogger(__name__)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    LOGGER.info("accepts websocket connection")
    try:
        async for data in stream():
            await websocket.send_json(data)
    except ConnectionClosed:
        LOGGER.info("closing")
