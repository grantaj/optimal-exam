# Optimal Exam

**How long should an exam be?** A mathematical exploration of the trade-off between the chance of a perfect score and the risk of a bad mark.

- **Interactive calculator:** https://grantaj.github.io/optimal-exam/ (after GitHub Pages is enabled)
- **Paper:** [How Long Should an Exam Be? (PDF)](https://grantaj.github.io/optimal-exam/optimal-exam.pdf)
- **LaTeX source:** [`paper/optimal-exam.tex`](paper/optimal-exam.tex)

## What the model does

Each question is independently incorrect with probability `epsilon`. For a test with `n` questions, the number of mistakes is `Binomial(n, epsilon)`. The calculator selects the **smallest** number of questions whose probability of a score *strictly below* the specified mark is no greater than the acceptable risk. This maximises the chance of getting 100% subject to that risk constraint.

At a 5% per-question error rate, a bad mark below 70%, and a maximum risk of 1%, the optimum is **seven questions**. The perfect-score probability is 69.83% and the bad-score probability is 0.376%.

## Run locally

Open `index.html` using a local HTTP server (ES modules generally don't load over `file://`):

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000/. The app has no runtime dependencies or build step.

## Tests and PDF

```sh
npm test
latexmk -pdf -interaction=nonstopmode -halt-on-error -outdir=build paper/optimal-exam.tex
```

GitHub Actions runs the JavaScript tests, builds the PDF, uploads it as a CI artifact, and commits the generated `optimal-exam.pdf` to `main` when it changes. The PDF link on the website therefore works when **Settings → Pages → Deploy from a branch → `main` / `(root)`** is enabled. The first successful workflow run generates the PDF on `main`.

## Assumptions and limits

- Independent questions with a common probability of error.
- Exactly one mark per question, no partial credit.
- Bad means **strictly below** the selected percentage; equality is not bad.
- The calculator searches lengths from 1 through 2,000. An empty result means none was found in that range, not a proof of global impossibility.

See the paper for proofs, exact binomial tail formulas, convex ordering, and large deviations.
