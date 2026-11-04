/** Exact binomial probabilities, with percentages passed as integers. */
export function binomialOutcomes(n, errorPercent, badBelowPercent) {
  if (!Number.isInteger(n) || n < 1 || !Number.isInteger(errorPercent) || errorPercent < 0 || errorPercent > 100 || !Number.isInteger(badBelowPercent) || badBelowPercent < 0 || badBelowPercent > 100) {
    throw new RangeError('Invalid exam parameters');
  }
  const p = errorPercent / 100;
  const perfect = Math.pow(1 - p, n);
  if (p === 0) return { n, perfect: 1, bad: badBelowPercent > 100 ? 1 : 0 };
  if (p === 1) return { n, perfect: 0, bad: badBelowPercent > 0 ? 1 : 0 };

  // Start with P(K=0) and update by successive probability ratios.
  // Comparing integer scores avoids rounding errors at 70%, 75%, etc.
  let mass = perfect;
  let bad = 0;
  for (let k = 0; k <= n; k++) {
    if (k > 0) mass *= ((n - k + 1) / k) * (p / (1 - p));
    if (100 * (n - k) < badBelowPercent * n) bad += mass;
  }
  return { n, perfect, bad: Math.min(1, Math.max(0, bad)) };
}

/** First feasible n is globally optimal: P(perfect) strictly decreases in n. */
export function calculateExam(errorPercent, badBelowPercent, riskPercent, maxQuestions = 2000) {
  if (!Number.isInteger(riskPercent) || riskPercent < 0 || riskPercent > 100) throw new RangeError('Invalid risk percentage');
  const values = [];
  let optimum = null;
  for (let n = 1; n <= maxQuestions; n++) {
    const outcome = binomialOutcomes(n, errorPercent, badBelowPercent);
    values.push(outcome);
    if (!optimum && outcome.bad <= riskPercent / 100 + 1e-13) optimum = outcome;
  }
  return { values, optimum };
}
