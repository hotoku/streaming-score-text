import logging

import pandas as pd
import aiohttp


LOGGER = logging.getLogger(__name__)
API_URL = "http://localhost:10080/msg"


def setup(production: bool):
    global API_URL
    if production:
        API_URL = "https://tstr.inctore.com/msg"
    LOGGER.info("stream setup: %s", API_URL)


def read_data() -> pd.DataFrame:
    df = pd.read_csv("data/output.csv")
    return df


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
