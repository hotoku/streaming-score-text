import asyncio
from collections.abc import AsyncIterable
import logging
from typing import Iterable
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from websockets.exceptions import ConnectionClosed

from .stream import stream

LOGGER = logging.getLogger(__name__)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


async def send_messages(websocket: WebSocket, stream: AsyncIterable):
    n = 0
    async for data in stream:
        LOGGER.info("seinding message %s", n)
        n += 1
        await websocket.send_json(data)


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    LOGGER.info("accepts websocket connection")
    st = stream()
    send_task = asyncio.create_task(send_messages(websocket, st))
    try:
        while True:
            message = await websocket.receive_json()
            print(message)
    except ConnectionClosed:
        LOGGER.info("closing")
