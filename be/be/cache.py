import pickle
import hashlib
import sqlite3
from typing import Awaitable, Callable, Coroutine, ParamSpec, TypeVar


CACHE_DB = "data/cache.sqlite"


def connect(path: str) -> sqlite3.Connection:
    return sqlite3.connect(path)


def exists(hash: str) -> bool:
    with connect(CACHE_DB) as con:
        con.row_factory = sqlite3.Row
        cur = con.execute("""
        select
          count(1) as cnt
        from
          cache
        where
          hash = ?
        """, [hash])
        row = cur.fetchone()
        return row["cnt"] > 0


def save(hash: str, value: bytes):
    with connect(CACHE_DB) as con:
        con.executemany("""
        insert into cache (
          hash,
          value
        ) values (
          ?,
          ?
        )
        """, [(hash, value)])
        con.commit()


def load(hash: str) -> bytes:
    with connect(CACHE_DB) as con:
        con.row_factory = sqlite3.Row
        cur = con.execute("""
        select
          value
        from
          cache
        where
          hash = ?
        """, [hash])
        row = cur.fetchone()
        return row["value"]


def clear():
    with connect(CACHE_DB) as con:
        con.executescript("""
        drop table if exists cache
        """)
        con.commit()


P = ParamSpec("P")
R = TypeVar("R")


def acache(f: Callable[P, Coroutine[None, None, R]]) -> Callable[P, Coroutine[None, None, R]]:
    async def ret(*args: P.args, **kwargs: P.kwargs) -> R:
        bs = pickle.dumps((args, kwargs))
        hash = hashlib.sha256(bs).hexdigest()
        if exists(hash):
            ret = load(hash)
            return pickle.loads(ret)
        val = await f(*args, **kwargs)
        save(hash, pickle.dumps(val))
        return val
    return ret


def init():
    con = sqlite3.connect(CACHE_DB)
    con.execute("""
    create table if not exists cache (
      hash text not null,
      value blob not null
    );
    """)
    con.commit()


init()
