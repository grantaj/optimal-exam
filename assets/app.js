import { calculateExam } from './model.mjs';

const $ = id => document.getElementById(id);
const controls = {
  error: $('error-rate'),
  threshold: $('bad-threshold'),
  tolerance: $('risk-tolerance'),
  selected: $('selected-length'),
};
const pct = (v, digits = 1) => `${(v * 100).toFixed(digits)}%`;
const fmtRisk = v => v > 0 && v < 0.0001 ? `${(v * 100).toExponential(2)}%` : pct(v, 3);
const svgNS = 'http://www.w3.org/2000/svg';

function makeSvg(name, attrs = {}, text) {
  const node = document.createElementNS(svgNS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}

function chart(root, values, field, maxN, selectedN, opts) {
  const width = 710, height = 210, left = 51, right = 18, top = 12, bottom = 31;
  const plotW = width - left - right, plotH = height - top - bottom;
  const yMax = opts.yMax;
  const x = n => left + (n - 1) / Math.max(1, maxN - 1) * plotW;
  const y = prob => top + plotH * (1 - Math.min(prob / yMax, 1));
  root.replaceChildren();
  root.setAttribute('viewBox', `0 0 ${width} ${height}`);
  root.setAttribute('role', 'img');
  root.setAttribute('aria-label', opts.description);

  for (let i = 0; i <= 4; i++) {
    const probability = yMax * i / 4;
    const yy = y(probability);
    root.append(makeSvg('line', { x1: left, y1: yy, x2: width - right, y2: yy, class: 'gridline' }));
    root.append(makeSvg('text', { x: left - 9, y: yy + 4, 'text-anchor': 'end', class: 'tick' }, `${(probability * 100).toFixed(yMax < 0.02 ? 1 : 0)}%`));
  }
  const shown = values.slice(0, maxN);
  if (field === 'bad') {
    // A risk-limit line makes the discrete jumps easy to interpret.
    const target = opts.risk;
    if (target <= yMax) {
      const yy = y(target);
      root.append(makeSvg('line', { x1: left, y1: yy, x2: width-right, y2: yy, class: 'risk-line' }));
    }
  }
  const path = shown.map((p, i) => `${i ? 'L' : 'M'}${x(p.n).toFixed(2)},${y(p[field]).toFixed(2)}`).join(' ');
  root.append(makeSvg('path', { d: path, class: `plot-line ${field}` }));
  if (selectedN >= 1 && selectedN <= maxN) {
    const selected = shown[selectedN - 1];
    const xx = x(selectedN), yy = y(selected[field]);
    root.append(makeSvg('line', { x1: xx, y1: top, x2: xx, y2: top + plotH, class: 'selection-line' }));
    root.append(makeSvg('circle', { cx: xx, cy: yy, r: 5.5, class: `plot-dot ${field}` }));
  }
  for (const n of [1, Math.round((maxN + 1) / 2), maxN]) {
    root.append(makeSvg('text', { x: x(n), y: height - 9, 'text-anchor': n === 1 ? 'start' : n === maxN ? 'end' : 'middle', class: 'tick' }, String(n)));
  }
}

function render() {
  const error = Number(controls.error.value);
  const threshold = Number(controls.threshold.value);
  const tolerance = Number(controls.tolerance.value);
  $('error-value').textContent = `${error}%`;
  $('threshold-value').textContent = `${threshold}%`;
  $('tolerance-value').textContent = `${tolerance}%`;
  const { values, optimum } = calculateExam(error, threshold, tolerance);
  const maxPlot = optimum ? Math.max(28, Math.min(2000, optimum.n + 14)) : 80;
  controls.selected.max = maxPlot;
  const selectedN = Math.min(Math.max(1, Number(controls.selected.value)), maxPlot);
  controls.selected.value = selectedN;
  $('selected-value').textContent = String(selectedN);

  if (optimum) {
    $('optimal-length').textContent = String(optimum.n);
    $('perfect-result').textContent = pct(optimum.perfect, 1);
    $('bad-result').textContent = fmtRisk(optimum.bad);
    $('result-explanation').textContent = `This is the shortest test with less than or equal to ${tolerance}% probability of scoring below ${threshold}%. Any longer test has a lower chance of perfection.`;
    $('optimal-summary').classList.remove('unavailable');
  } else {
    $('optimal-length').textContent = '—';
    $('perfect-result').textContent = '—';
    $('bad-result').textContent = '—';
    $('result-explanation').textContent = 'No test of 2,000 or fewer questions meets this risk limit. Try a lower grade threshold, a larger risk tolerance, or a smaller error rate.';
    $('optimal-summary').classList.add('unavailable');
  }

  const point = values[selectedN - 1];
  $('selected-perfect').textContent = pct(point.perfect, 2);
  $('selected-bad').textContent = fmtRisk(point.bad);
  $('selected-expected').textContent = `${100-error}%`;
  const cutoff = Math.floor((100 - threshold) * selectedN / 100) + 1;
  $('bad-count').textContent = `${cutoff} or more mistake${cutoff === 1 ? '' : 's'}`;
  $('plot-range').textContent = `Charts display 1–${maxPlot} questions.`;
  const visible = values.slice(0, maxPlot);
  const maxBad = Math.max(tolerance / 100 * 1.15, ...visible.map(item => item.bad));
  chart($('perfect-chart'), values, 'perfect', maxPlot, selectedN, {
    yMax: 1, description: 'Chance of a perfect mark decreases as the number of questions increases.',
  });
  chart($('bad-chart'), values, 'bad', maxPlot, selectedN, {
    yMax: Math.max(0.0001, Math.min(1, maxBad * 1.08)), risk: tolerance / 100,
    description: `Chance of scoring below ${threshold}% by test length, with a dashed line for the ${tolerance}% maximum acceptable risk.`,
  });
}

for (const item of Object.values(controls)) item.addEventListener('input', render);
$('use-optimal').addEventListener('click', () => {
  const data = calculateExam(Number(controls.error.value), Number(controls.threshold.value), Number(controls.tolerance.value));
  if (data.optimum) controls.selected.value = String(data.optimum.n);
  render();
});
$('reset').addEventListener('click', () => {
  controls.error.value = 5;
  controls.threshold.value = 70;
  controls.tolerance.value = 1;
  controls.selected.value = 7;
  render();
});
render();
