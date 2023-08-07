export type Score = {
  analytics: number;
  fact: number;
  emotion: number;
};

export type Comment = {
  time: string;
  text: string;
};

export type ScoreComment = {
  comment: Comment;
  score: Score;
};
