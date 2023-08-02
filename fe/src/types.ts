export type ScoreResponse = {
  input: string;
  labels: {
    analytics: number;
    fact: number;
    emotion: number;
  };
  scores: {
    analytics: number;
    fact: number;
    emotion: number;
  };
};
