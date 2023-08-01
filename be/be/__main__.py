#!/usr/bin/env python3


import uvicorn
import click
import json

import requests

from .server import app


@click.group()
@click.option("--debug/--no-debug", is_flag=True, default=False)
@click.pass_context
def main(ctx: click.Context, debug: bool):
    ctx.obj = {
        "debug": debug
    }


@main.command
@click.pass_context
def server(ctx: click.Context):
    if ctx.obj["debug"]:
        # reloadするときは、文字列でappへの参照を渡す必要がある
        # cf: https://github.com/tiangolo/fastapi/issues/1495#issuecomment-635681976
        uvicorn.run("be.server:app", host="0.0.0.0",
                    port=8000, reload=True)
    else:
        uvicorn.run(app, host="0.0.0.0", port=8000)


@main.command
def score():
    ret = requests.post(
        "http://localhost:10080/msg",
        data=json.dumps({
            "message": "F1きました！"
        }))
    obj = json.loads(ret.content.decode())
    print(obj)


if __name__ == "__main__":
    main()
