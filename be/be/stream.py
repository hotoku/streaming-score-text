import logging

import pandas as pd
import aiohttp


LOGGER = logging.getLogger(__name__)


def read_data() -> pd.DataFrame:
    df = pd.read_csv("data/output.csv")
    return df


async def stream():
    df = read_data()
    n = 0
    async with aiohttp.ClientSession() as session:
        for _, row in df.iterrows():
            LOGGER.info("requesting %s", row["ID"])
            async with session.post("http://localhost:10080/msg",
                                    json={
                                        "message": row["text"]
                                    }) as resp:
                ret = await resp.json()
                yield ret
            n += 1
            if n == 3:
                break
        LOGGER.info("sent %s messages", n)
        LOGGER.info("processed all messages")