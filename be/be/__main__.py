#!/usr/bin/env python3

import asyncio
import logging
import aiohttp

import uvicorn
import click


from .server import app
from . import stream

LOGGER = logging.getLogger(__name__)


def setup_logging(debug: bool):
    logging.basicConfig(
        level=logging.DEBUG if debug else logging.INFO
    )


@click.group()
@click.option("--debug/--no-debug", is_flag=True, default=False)
@click.pass_context
def main(ctx: click.Context, debug: bool):
    ctx.obj = {
        "debug": debug
    }
    setup_logging(debug)


@main.command
@click.option("--production/--no-production", is_flag=True, default=False)
@click.pass_context
def server(ctx: click.Context, production: bool):
    LOGGER.info("start server. "
                "debug: %s", ctx.obj["debug"])
    stream.setup(production)
    if ctx.obj["debug"]:
        # reloadするときは、文字列でappへの参照を渡す必要がある
        # cf: https://github.com/tiangolo/fastapi/issues/1495#issuecomment-635681976
        uvicorn.run("be.server:app", host="0.0.0.0",
                    port=8000, reload=True)
    else:
        uvicorn.run(app, host="0.0.0.0", port=8000)


@main.command
def api():
    async def call():
        async with aiohttp.ClientSession() as session:
            payload = {
                "message": "F1きました"
            }
            async with session.post(stream.API_URL, json=payload) as resp:
                ret = await resp.json()
                print(ret)

    stream.setup(production=True)
    asyncio.run(call())


if __name__ == "__main__":
    main()
