#!/usr/bin/env python3
"""Build the embedded data + reference numbers for the Matching Lab.

Reads the two book datasets from ../data, validates them, and emits:
  assets/js/data.js       compact typed-array payload used by the page
  assets/js/reference.js  book numbers + precomputed checkpoints for tests/UI
  data/drug_example.csv   the 10-patient toy table from the chapter

Run from anywhere:  python tools/build-data.py
"""
from __future__ import annotations

import json
import math
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
OUT = ROOT / "assets" / "js"

MED_COLS = ["sex", "age", "severity", "medication", "recovery"]
TRAINEE_COLS = ["unit", "trainees", "age", "earnings"]


def load() -> tuple[pd.DataFrame, pd.DataFrame]:
    med = pd.read_csv(DATA / "medicine_impact_recovery.csv")
    trainee = pd.read_csv(DATA / "trainees.csv")
    if list(med.columns) != MED_COLS:
        raise SystemExit(f"medicine columns changed: {list(med.columns)}")
    if list(trainee.columns) != TRAINEE_COLS:
        raise SystemExit(f"trainee columns changed: {list(trainee.columns)}")
    if len(med) != 20000:
        raise SystemExit(f"expected 20000 medicine rows, got {len(med)}")
    if int(med.medication.sum()) != 6924:
        raise SystemExit("expected 6924 treated medicine rows")
    if len(trainee) != 40:
        raise SystemExit(f"expected 40 trainee rows, got {len(trainee)}")
    return med, trainee


def standardize(x: np.ndarray) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    mu = x.mean(axis=0)
    sd = x.std(axis=0)
    sd = np.where(sd == 0, 1.0, sd)
    return (x - mu) / sd, mu, sd


def ols(x: np.ndarray, y: np.ndarray) -> np.ndarray:
    a = np.column_stack([np.ones(len(x)), x])
    return np.linalg.lstsq(a, y, rcond=None)[0]


def ols_predict(beta: np.ndarray, x: np.ndarray) -> np.ndarray:
    if x.ndim == 3:
        return x @ beta[1:] + beta[0]
    return np.column_stack([np.ones(len(x)), x]) @ beta


def knn_indices(x: np.ndarray, src: np.ndarray, dst: np.ndarray, k: int) -> np.ndarray:
    """Exact brute-force nearest neighbours, chunked to keep memory bounded."""
    out = np.empty((len(src), k), dtype=np.int32)
    np.random.seed(0)  # only used for a stable tie-break jitter, not randomness
    for start in range(0, len(src), 250):
        chunk = src[start : start + 250]
        d2 = ((x[chunk, None, :] - x[dst][None, :, :]) ** 2).sum(axis=2)
        # argpartition gives k smallest; ties break by index order in numpy
        idx = np.argpartition(d2, kth=k - 1, axis=1)[:, :k]
        # sort the k by distance then index for deterministic output
        rows = np.arange(len(chunk))[:, None]
        order = np.lexsort((idx, d2[rows, idx]), axis=1)
        out[start : start + len(chunk)] = idx[rows, order]
    return out


def matching_numbers(med: pd.DataFrame, x_raw: np.ndarray, k_max: int = 10) -> dict:
    y = med.recovery.to_numpy(dtype=float)
    t = med.medication.to_numpy(dtype=int)
    x, _, _ = standardize(x_raw)
    tr = np.flatnonzero(t == 1)
    co = np.flatnonzero(t == 0)

    i_tc = knn_indices(x, tr, co, k_max)  # treated -> controls
    i_ct = knn_indices(x, co, tr, k_max)  # controls -> treated

    b0 = ols(x[co], y[co])
    b1 = ols(x[tr], y[tr])
    mu0_t = ols_predict(b0, x[tr])
    mu1_c = ols_predict(b1, x[co])

    sign = np.concatenate([np.ones(len(tr)), -np.ones(len(co))])
    raw_by_k = {}
    corr_by_k = {}
    for k in range(1, k_max + 1):
        mt = y[co[i_tc[:, :k]]].mean(axis=1)
        mc = y[tr[i_ct[:, :k]]].mean(axis=1)
        diff = np.concatenate([y[tr] - mt, y[co] - mc])

        corr_t = mu0_t - ols_predict(b0, x[co[i_tc[:, :k]]]).mean(axis=1)
        corr_c = mu1_c - ols_predict(b1, x[tr[i_ct[:, :k]]]).mean(axis=1)
        corr = np.concatenate([corr_t, corr_c])

        raw_by_k[str(k)] = float(np.mean(sign * diff))
        corr_by_k[str(k)] = float(np.mean(sign * (diff - corr)))

    dist_t = np.sqrt(((x[tr] - x[co[i_tc[:, 0]]]) ** 2).sum(axis=1))
    dist_c = np.sqrt(((x[co] - x[tr[i_ct[:, 0]]]) ** 2).sum(axis=1))
    all_dist = np.concatenate([dist_t, dist_c])

    return {
        "naive": float(y[t == 1].mean() - y[t == 0].mean()),
        "raw_by_k": raw_by_k,
        "corrected_by_k": corr_by_k,
        "medianDistance": float(np.median(all_dist)),
        "p90Distance": float(np.quantile(all_dist, 0.9)),
        "treated": int(len(tr)),
        "control": int(len(co)),
    }


def oracle_ate(med: pd.DataFrame) -> float:
    sex = med.sex.to_numpy(dtype=float)
    age = med.age.to_numpy(dtype=float)
    sev = med.severity.to_numpy(dtype=float)
    medf = med.medication.to_numpy(dtype=float)
    y = med.recovery.to_numpy(dtype=float)
    x = np.column_stack([sex, age, age**2, sev, np.log(sev), sex * sev, medf])
    return float(ols(x, y)[-1])


def exact_trainee(trainee: pd.DataFrame) -> dict:
    t1 = trainee.query("trainees == 1")
    t0 = trainee.query("trainees == 0").drop_duplicates("age")
    m = t1.merge(t0, on="age", how="left", suffixes=("_t1", "_t0"))
    m["diff"] = m.earnings_t1 - m.earnings_t0
    return {
        "naive": float(t1.earnings.mean() - trainee.query("trainees == 0").earnings.mean()),
        "matched": float(m["diff"].mean()),
        "pairs": int(len(m)),
        "sum": float(m["diff"].sum()),
    }


def severity_bands(med: pd.DataFrame) -> list[dict]:
    sev = med.severity.to_numpy(dtype=float)
    target = float(np.median(sev))
    y = med.recovery.to_numpy(dtype=float)
    t = med.medication.to_numpy(dtype=int)
    out = []
    for band in [0.5, 0.25, 0.1, 0.05, 0.02]:
        mask = np.abs(sev - target) <= band
        yy, tt = y[mask], t[mask]
        out.append(
            {
                "band": band,
                "estimate": float(yy[tt == 1].mean() - yy[tt == 0].mean()),
                "n": int(mask.sum()),
                "treated": int((tt == 1).sum()),
            }
        )
    return out


def drug_numbers(drug: pd.DataFrame) -> dict:
    y = drug.days.to_numpy(dtype=float)
    t = drug.drug.to_numpy(dtype=float)
    female = (drug.sex == "W").to_numpy(dtype=float)
    naive = float(y[t == 1].mean() - y[t == 0].mean())
    cells = []
    for name, mask in [("M", female == 0), ("W", female == 1)]:
        tt, yy = t[mask], y[mask]
        cells.append(
            {
                "name": name,
                "n": int(mask.sum()),
                "treated": int(tt.sum()),
                "effect": float(yy[tt == 1].mean() - yy[tt == 0].mean()),
                "varT": float(tt.var()),
            }
        )
    sub = sum(c["n"] * c["effect"] for c in cells) / len(drug)
    beta = ols(np.column_stack([t, female]), y)
    return {
        "naive": naive,
        "subclassification": float(sub),
        "ols": float(beta[1]),
        "intercept": float(beta[0]),
        "female": float(beta[2]),
        "cells": cells,
        "true": -2.6,
    }


def fmt_num(v: float, decimals: int) -> str:
    if abs(v) < 0.5 * (10 ** -decimals):
        return "0"
    s = f"{v:.{decimals}f}".rstrip("0").rstrip(".")
    return s or "0"


def js_array(name: str, values, ctor: str, decimals: int = 4) -> str:
    if ctor == "Float32Array":
        body = ",".join(fmt_num(float(v), decimals) for v in values)
    else:
        body = ",".join(str(int(v)) for v in values)
    return f"  {name}: new {ctor}([{body}])"


def main() -> None:
    med, trainee = load()
    drug = pd.DataFrame(
        dict(
            sex=["M"] * 6 + ["W"] * 4,
            drug=[1, 1, 1, 1, 1, 0, 1, 0, 1, 0],
            days=[5, 5, 5, 5, 5, 8, 2, 4, 2, 4],
        )
    )
    drug.to_csv(DATA / "drug_example.csv", index=False)

    x_raw = med[["severity", "age", "sex"]].to_numpy(dtype=float)
    med_ref = matching_numbers(med, x_raw)
    oracle = oracle_ate(med)
    exact = exact_trainee(trainee)
    bands = severity_bands(med)
    drug_ref = drug_numbers(drug)

    # omit-sex check
    x_nosex = med[["severity", "age"]].to_numpy(dtype=float)
    nosex = matching_numbers(med, x_nosex, k_max=1)

    ref = {
        "generatedFrom": {
            "medicine": "causal-inference-for-the-brave-and-true/data/medicine_impact_recovery.csv",
            "trainees": "causal-inference-for-the-brave-and-true/data/trainees.csv",
            "bookChapter": "https://matheusfacure.github.io/python-causality-handbook/10-Matching.html",
        },
        "medicine": {
            **med_ref,
            "rows": int(len(med)),
            "trueAte": -10.0,
            "oracleAte": oracle,
            "omitSexRaw1": nosex["raw_by_k"]["1"],
            "severityBands": bands,
        },
        "trainees": exact,
        "drug": drug_ref,
    }

    OUT.mkdir(parents=True, exist_ok=True)

    # data.js
    med_n = len(med)
    lines = [
        "/* Generated by tools/build-data.py. Do not edit by hand. */",
        "(function (global) {",
        "  'use strict';",
        "  var medicine = {",
        f"  n: {med_n},",
        js_array("sex", med.sex.to_numpy(), "Uint8Array") + ",",
        js_array("medication", med.medication.to_numpy(), "Uint8Array") + ",",
        js_array("age", med.age.to_numpy(), "Float32Array", 6) + ",",
        js_array("severity", med.severity.to_numpy(), "Float32Array", 8) + ",",
        js_array("recovery", med.recovery.to_numpy(), "Int16Array"),
        "  };",
        "  var trainees = [",
    ]
    for row in trainee.itertuples(index=False):
        lines.append(
            f"    {{ unit: {int(row.unit)}, treated: {int(row.trainees)}, age: {int(row.age)}, earnings: {int(row.earnings)} }},"
        )
    lines += [
        "  ];",
        "  var drug = [",
    ]
    for row in drug.itertuples(index=False):
        lines.append(
            f"    {{ sex: '{row.sex}', drug: {int(row.drug)}, days: {int(row.days)} }},"
        )
    lines += [
        "  ];",
        "  var payload = {",
        "    version: 1,",
        "    medicine: medicine,",
        "    trainees: trainees,",
        "    drug: drug,",
        "    meta: {",
        "      medicineSource: 'Causal Inference for the Brave and True, ch. 10 data (MIT)',",
        "      medicineNote: 'Simulated with a constant -10 day treatment effect (Simulated-Data.ipynb).',",
        "      traineeSource: 'Causal Inference for the Brave and True, ch. 10 data (MIT)',",
        "      truthAte: -10",
        "    }",
        "  };",
        "  if (typeof module !== 'undefined' && module.exports) module.exports = payload;",
        "  global.MatchLabData = payload;",
        "})(typeof window !== 'undefined' ? window : globalThis);",
        "",
    ]
    (OUT / "data.js").write_text("\n".join(lines), encoding="utf-8")

    ref_js = (
        "/* Generated by tools/build-data.py. Do not edit by hand. */\n"
        "(function (global) {\n"
        "  var ref = "
        + json.dumps(ref, indent=2)
        + ";\n"
        "  if (typeof module !== 'undefined' && module.exports) module.exports = ref;\n"
        "  global.MatchLabReference = ref;\n"
        "})(typeof window !== 'undefined' ? window : globalThis);\n"
    )
    (OUT / "reference.js").write_text(ref_js, encoding="utf-8")

    print("Wrote", OUT / "data.js", f"({(OUT / 'data.js').stat().st_size:,} bytes)")
    print("Wrote", OUT / "reference.js")
    print(json.dumps(ref, indent=2))


if __name__ == "__main__":
    main()
