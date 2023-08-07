from datetime import datetime
from pydantic import BaseModel


class Comment(BaseModel):
    time: datetime
    text: str


class Score(BaseModel):
    analytics: float
    fact: float
    emotion: float


class ScoreComment(BaseModel):
    score: Score
    comment: Comment
