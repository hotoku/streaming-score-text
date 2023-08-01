#!/usr/bin/env python3

import logging

import uvicorn
import click


from .server import app


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
@click.pass_context
def server(ctx: click.Context):
    LOGGER.info("start server. "
                "debug: %s", ctx.obj["debug"])
    if ctx.obj["debug"]:
        # reloadするときは、文字列でappへの参照を渡す必要がある
        # cf: https://github.com/tiangolo/fastapi/issues/1495#issuecomment-635681976
        uvicorn.run("be.server:app", host="0.0.0.0",
                    port=8000, reload=True)
    else:
        uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
