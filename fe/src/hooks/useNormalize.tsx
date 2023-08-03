import { useState } from "react";

function useNormalize1(): [
  { mu: number; sigma2: number },
  (x: number) => void
] {
  const [vals, setVals] = useState<{
    mu: number;
    sigma2: number;
    n: number;
  }>({
    mu: 0,
    sigma2: 0,
    n: 0,
  });

  const update = (x: number) => {
    setVals((v) => {
      const { mu, sigma2, n } = v;
      const mu_ = (n * mu + x) / (1 + n);
      return {
        mu: mu_,
        sigma2: (n * (sigma2 + mu * mu) + x * x) / (n + 1) - mu_ * mu_,
        n: n + 1,
      };
    });
  };

  return [{ mu: vals.mu, sigma2: vals.sigma2 }, update];
}

function useNormalize() {
  const [analytics, updateAnalytics] = useNormalize1();
  const [fact, updateFact] = useNormalize1();
  const [emotion, updateEmotion] = useNormalize1();
  return {
    analytics,
    fact,
    emotion,
    updateAnalytics,
    updateFact,
    updateEmotion,
  };
}

export default useNormalize;
