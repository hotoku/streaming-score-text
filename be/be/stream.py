import logging

import pandas as pd
import aiohttp


LOGGER = logging.getLogger(__name__)
API_PORT = 80


def setup(port: int):
    global API_PORT
    API_PORT = port


def read_data() -> pd.DataFrame:
    df = pd.read_csv("data/output.csv")
    return df


async def stream():
    df = read_data()
    n = 0
    async with aiohttp.ClientSession() as session:
        for _, row in df.iterrows():
            LOGGER.info("requesting %s", row["ID"])
            async with session.post(f"http://localhost:{API_PORT}/msg",
                                    json={
                                        "message": row["text"]
                                    }) as resp:
                ret = await resp.json()
                yield ret
            n += 1
        LOGGER.info("sent %s messages", n)
        LOGGER.info("processed all messages")
