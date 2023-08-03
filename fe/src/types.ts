export type Score = {
  analytics: number;
  fact: number;
  emotion: number;
};

export type ScoreResponse = {
  input: string;
  scores: Score;
  labels: { [P in keyof Score]: 0 | 1 };
};
