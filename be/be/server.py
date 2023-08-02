import asyncio
import logging
from typing import AsyncGenerator
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from websockets.exceptions import ConnectionClosed

from .stream import stream

LOGGER = logging.getLogger(__name__)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


async def send_messages(websocket: WebSocket, stream: AsyncGenerator, event: asyncio.Event):
    n = 0
    async for data in stream:
        LOGGER.info("seinding message %s", n)
        n += 1
        await websocket.send_json(data)
        await event.wait()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    LOGGER.info("accepts websocket connection")
    st = stream()
    event = asyncio.Event()
    event.set()
    send_task = asyncio.create_task(send_messages(websocket, st, event))
    try:
        while True:
            message = await websocket.receive_json()
            if message["type"] == "stop":
                LOGGER.info("received stop signal. stopping")
                event.clear()
            elif message["type"] == "start":
                LOGGER.info("received start signal. starting")
                event.set()

    except ConnectionClosed:
        LOGGER.info("closing")
        send_task.cancel()
