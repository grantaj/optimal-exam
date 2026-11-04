import test from 'node:test';
import assert from 'node:assert/strict';
import { binomialOutcomes, calculateExam } from '../assets/model.mjs';

const close = (got, expected, tolerance = 1e-12) => assert.ok(Math.abs(got - expected) < tolerance, `${got} != ${expected}`);

test('seven questions maximise perfection under default risk constraint', () => {
  const { optimum, values } = calculateExam(5, 70, 1);
  assert.equal(optimum.n, 7);
  close(optimum.perfect, 0.95 ** 7);
  close(optimum.bad, 0.00375704296875);
  assert.ok(values.slice(0, 6).every(v => v.bad > 0.01));
});

test('strict below threshold: one mistake in three is below 70%, one in four is not', () => {
  close(binomialOutcomes(3, 5, 70).bad, 1 - 0.95 ** 3);
  close(binomialOutcomes(4, 5, 70).bad, 0.01401875);
});

test('equal-to-threshold score is not a bad mark', () => {
  close(binomialOutcomes(10, 5, 70).bad, 0.001028497937890625);
});

test('extreme thresholds and error probabilities behave sensibly', () => {
  close(binomialOutcomes(5, 5, 0).bad, 0);
  close(binomialOutcomes(5, 0, 70).perfect, 1);
  close(binomialOutcomes(5, 100, 70).bad, 1);
  assert.equal(calculateExam(25, 90, 1, 200).optimum, null);
});

test('bad-score probability may rise between adjacent lengths', () => {
  const six = binomialOutcomes(6, 5, 70).bad;
  const seven = binomialOutcomes(7, 5, 70).bad;
  const eight = binomialOutcomes(8, 5, 70).bad;
  assert.ok(six > seven && eight > seven);
});
