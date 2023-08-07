import asyncio
import logging
from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from websockets.exceptions import ConnectionClosed

from .types import Comment, ScoreComment
from .stream import get_score, read_data

LOGGER = logging.getLogger(__name__)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")


async def send_messages(websocket: WebSocket, event: asyncio.Event, score_queue: asyncio.Queue[ScoreComment]):
    n = 0
    while True:
        sc = await score_queue.get()
        LOGGER.info("sending message %s", n)
        n += 1
        await websocket.send_text(sc.model_dump_json())
        await event.wait()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    LOGGER.info("accepts websocket connection")
    text_queue = asyncio.Queue[Comment]()
    score_queue = asyncio.Queue[ScoreComment]()

    event = asyncio.Event()
    event.set()

    rd = asyncio.create_task(read_data(text_queue))
    gs = asyncio.create_task(get_score(text_queue, score_queue))
    sm = asyncio.create_task(send_messages(websocket, event, score_queue))

    try:
        while True:
            message = await websocket.receive_json()
            if message["type"] == "stop":
                LOGGER.info("received stop signal. stopping")
                event.clear()
            elif message["type"] == "start":
                LOGGER.info("received start signal. starting")
                event.set()
            elif message["type"] == "restart":
                LOGGER.info("received restart signal. cancelling old task.")
                # cancelled = send_task.cancel()
                # LOGGER.info("cancelled %s", cancelled)
                # st = stream()
                # send_task = asyncio.create_task(
                #     send_messages(websocket, st, event))
            else:
                LOGGER.warning("unknown message type:", message["type"])

    except ConnectionClosed:
        LOGGER.info("closing")
        rd.cancel()
        gs.cancel()
        sm.cancel()
