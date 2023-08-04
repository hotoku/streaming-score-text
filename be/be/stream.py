import hashlib
import asyncio
import logging
import pickle
from typing import Awaitable, Callable, ParamSpec, TypeVar

import pandas as pd
import aiohttp

from .types import Comment


LOGGER = logging.getLogger(__name__)
API_URL = "http://localhost:10080/msg"


def setup(production: bool):
    global API_URL
    if production:
        API_URL = "https://text-score-hvi4fczdoa-an.a.run.app/msg"
    LOGGER.info("stream setup: %s", API_URL)


def read_data0() -> pd.DataFrame:
    df = pd.read_csv("data/output.csv")
    return df


async def read_data(text_queue: asyncio.Queue[Comment]):
    df = pd.read_csv("data/output.csv")
    for _, row in df.iterrows():
        obj = Comment(row["created_at"], row["text"])  # type: ignore
        await text_queue.put(obj)


async def get_score(text_queue: asyncio.Queue[Comment], score_queue: asyncio.Queue[Comment]):
    while True:
        comment = await text_queue.get()


P = ParamSpec("P")
R = TypeVar("R")


def acache(f: Callable[P, Awaitable[R]]) -> Callable[P, Awaitable[R]]:
    async def ret(*args: P.args, **kwargs: P.kwargs) -> R:
        bs = pickle.dumps((args, kwargs))
        hash = hashlib.sha256(bs).hexdigest()
        val = await f(*args, **kwargs)
        return val
    return ret


@acache
async def score(text: str) -> Score:
    pass


async def stream():
    df = read_data()
    n = 0
    async with aiohttp.ClientSession() as session:
        for _, row in df.iterrows():
            LOGGER.info("requesting %s", row["ID"])
            payload = {
                "message": row["text"]
            }
            async with session.post(API_URL, json=payload) as resp:
                ret = await resp.json()
                yield ret
            n += 1
        LOGGER.info("sent %s messages", n)
        LOGGER.info("processed all messages")
