#!/usr/bin/env python3
"""Build practice/matching_practice.ipynb (valid nbformat 4 JSON)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "practice" / "matching_practice.ipynb"


def md(text: str) -> dict:
    return {
        "cell_type": "markdown",
        "metadata": {},
        "source": [line + "\n" for line in text.strip("\n").split("\n")],
    }


def code(text: str) -> dict:
    return {
        "cell_type": "code",
        "execution_count": None,
        "metadata": {},
        "outputs": [],
        "source": [line + "\n" for line in text.strip("\n").split("\n")],
    }


cells = []

cells.append(md(r"""
# Matching — practice notebook

This notebook follows **Chapter 10 · Matching** in the Matching Lab. Work the exercises first; the solutions are at the end.

You will:

1. reproduce the chapter's exact-match flip on the trainee table;
2. build a 1-nearest-neighbour matching estimator on the medicine data;
3. add the regression bias correction;
4. vary `k`, omit a confounder, and impose a caliper;
5. put a confidence interval around the estimate;
6. write the paragraph you would actually report.

The medicine data is simulated with a constant **−10 day** treatment effect. The chapter does not reveal that; this notebook uses it as a benchmark, not as something you would know in a real project.
"""))

cells.append(md(r"""
## Setup

Run this cell first. It looks for the CSVs next to the notebook (`../data`) and downloads them from the book's repository if they are missing.
"""))

cells.append(code(r"""
from pathlib import Path
import urllib.request

import numpy as np
import pandas as pd
from sklearn.neighbors import KNeighborsRegressor
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt

BASE = "https://raw.githubusercontent.com/matheusfacure/python-causality-handbook/master/causal-inference-for-the-brave-and-true/data"
FILES = ["trainees.csv", "medicine_impact_recovery.csv"]

def find_data(name):
    for folder in [Path("data"), Path("../data"), Path(".")]:
        p = folder / name
        if p.exists():
            return p
    p = Path("data") / name
    p.parent.mkdir(exist_ok=True)
    print("downloading", name)
    urllib.request.urlretrieve(f"{BASE}/{name}", p)
    return p

trainee = pd.read_csv(find_data("trainees.csv"))
med = pd.read_csv(find_data("medicine_impact_recovery.csv"))
print("trainees", trainee.shape, "medicine", med.shape)
print(med.head())
"""))

cells.append(md(r"""
## 1. The naive gap and the exact twin

Compute the naive difference in mean earnings (trainees minus controls). Then match each trainee to the **first** control of the same age, as the chapter does, and compute the mean within-pair difference.

Expected: naive about **−4,297**, matched about **+2,458**.
"""))

cells.append(md(r"""
**Your turn.** Fill in the blanks.
"""))

cells.append(code(r"""
# TODO: compute the naive difference
naive = ...

# TODO: build a lookup from age -> first control with that age
# Hint: control = trainee.query("trainees == 0"); use drop_duplicates("age")
first_by_age = ...

# TODO: match each trainee, compute within-pair differences, and average
matched = ...

print("naive", naive)
print("matched", matched)
"""))

cells.append(md(r"""
## 2. One-nearest-neighbour matching on the medicine data

Standardize `severity`, `age`, and `sex`; fit one KNN model on the untreated and one on the treated; predict the opposite-group outcome for every unit; and compute

$$
\widehat{ATE} = \frac{1}{N}\sum_i (2T_i-1)(Y_i - Y_{jm(i)}).
$$

Expected: about **−0.995**.
"""))

cells.append(code(r"""
X = ["severity", "age", "sex"]
y = "recovery"

# TODO: standardize X (z-scores)
med_z = ...

# TODO: split treated / untreated, fit two KNeighborsRegressor(n_neighbors=1)
# and build a `predicted` frame with columns medication, recovery, match
predicted = ...

# TODO: compute the matching ATE
ate = ...
print("matching ATE", ate)
"""))

cells.append(md(r"""
## 3. Bias correction

The match is close, not exact. Fit a linear model for the untreated outcome surface on the untreated group (and one for the treated group), then subtract the estimated μ gap from each pair:

$$
\widehat{ATET} = \frac{1}{N_1}\sum_i\left[(Y_i-Y_{j(i)}) - (\hat\mu_0(X_i)-\hat\mu_0(X_{j(i)}))\right].
$$

Apply the correction in both directions and compute the ATE. Expected: about **−7.36**.
"""))

cells.append(code(r"""
# TODO: find the matched index for each unit (kneighbors(...)[1])
# TODO: fit ols0 on untreated and ols1 on treated
# TODO: build the correction terms and the corrected ATE
ate_bc = ...
print("bias-corrected ATE", ate_bc)
"""))

cells.append(md(r"""
## 4. Vary k

Compute the raw matching estimate for `k = 1, 2, ..., 10` and plot it. The chapter uses `k=1`; what happens as `k` grows?

Then add the bias-corrected curve. Which is more stable? Which is closer to −10?
"""))

cells.append(code(r"""
# TODO: loop over k, fit KNN with n_neighbors=k, compute raw and corrected ATE
# Hint: the correction needs the mean prediction over the k matches.
ks = range(1, 11)
raw_by_k = []
corrected_by_k = []
# ...
plt.plot(list(ks), raw_by_k, marker="o", label="raw")
plt.plot(list(ks), corrected_by_k, marker="o", label="corrected")
plt.axhline(-10, color="black", linestyle="--", label="truth")
plt.xlabel("k")
plt.ylabel("ATE (days)")
plt.legend()
plt.show()
"""))

cells.append(md(r"""
## 5. Omit a confounder

Recompute the 1-NN estimate using only `severity` and `age` (drop `sex`). What happens to the estimate? Why?

Expected direction: the estimate moves **away** from −10, because sex affects both treatment and recovery.
"""))

cells.append(code(r"""
# TODO: repeat the 1-NN estimate with X = ["severity", "age"]
# Compare with the full-covariate result.
ate_no_sex = ...
print("omit sex", ate_no_sex)
"""))

cells.append(md(r"""
## 6. A caliper and common support

A match farther than some threshold is not credible. Use the nearest-match distances from the 1-NN model and keep only units within a caliper of **0.5 standardized units**. Report the estimate, the number kept, and the share dropped.

This is the part most write-ups forget.
"""))

cells.append(code(r"""
# TODO: get nearest-match distances for treated and untreated
# TODO: keep units with distance <= 0.5, recompute the ATE on the retained units
# TODO: print kept counts and dropped share
"""))

cells.append(md(r"""
## 7. A bootstrap interval (with a caveat)

Resample the matched pair differences with replacement, 1,000 times, and report the 2.5–97.5 percentile interval. This is a **pair-level** bootstrap: it captures sampling noise in the pairs, not the uncertainty from re-running the matching itself. Say so when you report it.
"""))

cells.append(code(r"""
# TODO: build the vector of signed pair contributions used in the ATE
# Hint: for treated, Y_i - match; for controls, -(Y_i - match)
# TODO: bootstrap the mean and report the percentile interval
"""))

cells.append(md(r"""
## Write the paragraph

In 3–5 sentences, report:

- the estimand and the data;
- the matching design (covariates, distance, k, caliper, replacement);
- the estimate and interval;
- the share dropped / common-support limitation;
- one sentence on why the estimate is not the truth.

There is no single correct answer; the point is to make every design choice visible.

---

# Solutions

Run the cells below after you have tried the exercises.
"""))

cells.append(md(r"""
### Solution 1 — exact matching
"""))

cells.append(code(r"""
control = trainee.query("trainees == 0")
treated = trainee.query("trainees == 1")

naive = treated.earnings.mean() - control.earnings.mean()
first_by_age = control.drop_duplicates("age").set_index("age")["earnings"]
matched = (treated.earnings - treated.age.map(first_by_age)).mean()

print("naive", round(naive, 2))
print("matched", round(matched, 2))
assert abs(naive + 4297.4937) < 0.01
assert abs(matched - 2457.8947) < 0.01
"""))

cells.append(md(r"""
### Solution 2 — 1-NN matching
"""))

cells.append(code(r"""
X = ["severity", "age", "sex"]
y = "recovery"
med_z = med.copy()
med_z[X] = (med_z[X] - med_z[X].mean()) / med_z[X].std()

treated = med_z.query("medication == 1")
untreated = med_z.query("medication == 0")

mt0 = KNeighborsRegressor(n_neighbors=1).fit(untreated[X], untreated[y])
mt1 = KNeighborsRegressor(n_neighbors=1).fit(treated[X], treated[y])

predicted = pd.concat([
    treated.assign(match=mt0.predict(treated[X])),
    untreated.assign(match=mt1.predict(untreated[X])),
])
ate = np.mean((2 * predicted["medication"] - 1) *
              (predicted["recovery"] - predicted["match"]))
print("matching ATE", ate)
assert abs(ate + 0.9954) < 0.01
"""))

cells.append(md(r"""
### Solution 3 — bias correction
"""))

cells.append(code(r"""
treated_match = mt0.kneighbors(treated[X], n_neighbors=1)[1].ravel()
untreated_match = mt1.kneighbors(untreated[X], n_neighbors=1)[1].ravel()

ols0 = LinearRegression().fit(untreated[X], untreated[y])
ols1 = LinearRegression().fit(treated[X], treated[y])

corr_t = ols0.predict(treated[X]) - ols0.predict(untreated.iloc[treated_match][X])
corr_c = ols1.predict(untreated[X]) - ols1.predict(treated.iloc[untreated_match][X])
correction = np.concatenate([corr_t, corr_c])

ate_bc = np.mean((2 * predicted["medication"] - 1) *
                 ((predicted["recovery"] - predicted["match"]) - correction))
print("bias-corrected ATE", ate_bc)
assert abs(ate_bc + 7.3627) < 0.02
"""))

cells.append(md(r"""
### Solution 4 — the k curve
"""))

cells.append(code(r"""
ks = list(range(1, 11))
raw_by_k, corrected_by_k = [], []

for k in ks:
    m0 = KNeighborsRegressor(n_neighbors=k).fit(untreated[X], untreated[y])
    m1 = KNeighborsRegressor(n_neighbors=k).fit(treated[X], treated[y])
    m_t = m0.kneighbors(treated[X], n_neighbors=k)[1]
    m_c = m1.kneighbors(untreated[X], n_neighbors=k)[1]

    match_t = m0.predict(treated[X])
    match_c = m1.predict(untreated[X])
    pred = pd.concat([
        treated.assign(match=match_t),
        untreated.assign(match=match_c),
    ])
    raw = np.mean((2 * pred["medication"] - 1) *
                  (pred["recovery"] - pred["match"]))

    c_t = ols0.predict(treated[X]) - ols0.predict(untreated.iloc[m_t.ravel()][X]).reshape(len(treated), k).mean(1)
    c_c = ols1.predict(untreated[X]) - ols1.predict(treated.iloc[m_c.ravel()][X]).reshape(len(untreated), k).mean(1)
    corr = np.concatenate([c_t, c_c])
    corrected = np.mean((2 * pred["medication"] - 1) *
                        ((pred["recovery"] - pred["match"]) - corr))

    raw_by_k.append(raw)
    corrected_by_k.append(corrected)

plt.figure(figsize=(7, 4))
plt.plot(ks, raw_by_k, marker="o", label="raw")
plt.plot(ks, corrected_by_k, marker="o", label="bias-corrected")
plt.axhline(-10, color="black", linestyle="--", label="truth")
plt.xlabel("k")
plt.ylabel("ATE (days)")
plt.legend()
plt.tight_layout()
plt.show()
print(pd.DataFrame({"k": ks, "raw": raw_by_k, "corrected": corrected_by_k}))
"""))

cells.append(md(r"""
### Solution 5 — omit sex
"""))

cells.append(code(r"""
X2 = ["severity", "age"]
med_z2 = med.copy()
med_z2[X2] = (med_z2[X2] - med_z2[X2].mean()) / med_z2[X2].std()
t2 = med_z2.query("medication == 1")
c2 = med_z2.query("medication == 0")
m0 = KNeighborsRegressor(n_neighbors=1).fit(c2[X2], c2[y])
m1 = KNeighborsRegressor(n_neighbors=1).fit(t2[X2], t2[y])
pred2 = pd.concat([
    t2.assign(match=m0.predict(t2[X2])),
    c2.assign(match=m1.predict(c2[X2])),
])
ate_no_sex = np.mean((2 * pred2["medication"] - 1) *
                     (pred2["recovery"] - pred2["match"]))
print("omit sex", ate_no_sex)
"""))

cells.append(md(r"""
### Solution 6 — caliper
"""))

cells.append(code(r"""
dist_t = mt0.kneighbors(treated[X], n_neighbors=1)[0].ravel()
dist_c = mt1.kneighbors(untreated[X], n_neighbors=1)[0].ravel()

keep_t = dist_t <= 0.5
keep_c = dist_c <= 0.5

signed = np.concatenate([
    (treated.recovery.to_numpy() - predicted.loc[treated.index, "match"].to_numpy())[keep_t],
    -(untreated.recovery.to_numpy() - predicted.loc[untreated.index, "match"].to_numpy())[keep_c],
])
ate_cal = signed.mean()
kept = int(keep_t.sum() + keep_c.sum())
total = len(keep_t) + len(keep_c)
print("caliper ATE", ate_cal)
print("kept", kept, "of", total, f"({kept / total:.1%})")
"""))

cells.append(md(r"""
### Solution 7 — bootstrap interval
"""))

cells.append(code(r"""
rng = np.random.default_rng(7)
signed = np.concatenate([
    (predicted.loc[treated.index, "recovery"] - predicted.loc[treated.index, "match"]).to_numpy(),
    -(predicted.loc[untreated.index, "recovery"] - predicted.loc[untreated.index, "match"]).to_numpy(),
])
boot = np.array([rng.choice(signed, size=len(signed), replace=True).mean()
                 for _ in range(1000)])
lo, hi = np.percentile(boot, [2.5, 97.5])
print(f"ATE {signed.mean():.2f}, 95% pair-bootstrap CI [{lo:.2f}, {hi:.2f}]")
"""))

cells.append(md(r"""
### A model report

> Using the 20,000-patient simulated medicine table, I estimated the effect of medication on recovery days with 1-nearest-neighbour matching on standardized severity, age, and sex (replacement allowed, no caliper). The naive difference was +16.9 days; matching gave −1.0 days. A linear bias correction using the untreated outcome surface moved the estimate to −7.4 days. The nearest-match distance had median 0.49 and p90 1.54 SD; a 0.5 SD caliper would drop a substantial share of the sample, so the result should be read as sensitive to common support. The simulation truth is −10 days, so the remaining gap is estimator bias, not confounding: matches are close but not exact, and the linear correction only approximates a nonlinear outcome surface.

That is the level of detail the checklist asks for.
"""))

notebook = {
    "cells": cells,
    "metadata": {
        "kernelspec": {
            "display_name": "Python 3",
            "language": "python",
            "name": "python3",
        },
        "language_info": {
            "name": "python",
            "version": "3.10",
            "mimetype": "text/x-python",
            "file_extension": ".py",
            "pygments_lexer": "ipython3",
            "codemirror_mode": {"name": "ipython", "version": 3},
            "nbconvert_exporter": "python",
        },
    },
    "nbformat": 4,
    "nbformat_minor": 5,
}

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(notebook, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print("wrote", OUT, f"({OUT.stat().st_size:,} bytes), {len(cells)} cells")
