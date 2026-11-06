"""Extract an accuracy brief from every book notebook.

The brief is deliberately mechanical: headings, code cells, printed outputs,
images, and the data files mentioned. It is the checklist an interactive page
has to reproduce before it can be called live.

Usage:
    python tools/extract-briefs.py
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BOOK = ROOT.parent / "book-reference" / "causal-inference-for-the-brave-and-true"
OUT = ROOT / "reference" / "chapter-briefs"

# manifest slug -> notebook filename
MAP = {
    "01-introduction": "01-Introduction-To-Causality.ipynb",
    "02-randomised-experiments": "02-Randomised-Experiments.ipynb",
    "03-stats-review": "03-Stats-Review-The-Most-Dangerous-Equation.ipynb",
    "04-graphical-causal-models": "04-Graphical-Causal-Models.ipynb",
    "05-linear-regression": "05-The-Unreasonable-Effectiveness-of-Linear-Regression.ipynb",
    "06-grouped-regression": "06-Grouped-and-Dummy-Regression.ipynb",
    "07-beyond-confounders": "07-Beyond-Confounders.ipynb",
    "08-instrumental-variables": "08-Instrumental-Variables.ipynb",
    "09-non-compliance": "09-Non-Compliance-and-LATE.ipynb",
    "10-matching": "10-Matching.ipynb",
    "11-propensity-score": "11-Propensity-Score.ipynb",
    "12-doubly-robust": "12-Doubly-Robust-Estimation.ipynb",
    "13-difference-in-differences": "13-Difference-in-Differences.ipynb",
    "14-panel-fixed-effects": "14-Panel-Data-and-Fixed-Effects.ipynb",
    "15-synthetic-control": "15-Synthetic-Control.ipynb",
    "16-regression-discontinuity": "16-Regression-Discontinuity-Design.ipynb",
    "17-predictive-models": "17-Predictive-Models-101.ipynb",
    "18-heterogeneous-effects": "18-Heterogeneous-Treatment-Effects-and-Personalization.ipynb",
    "19-evaluating-causal-models": "19-Evaluating-Causal-Models.ipynb",
    "20-plug-and-play": "20-Plug-and-Play-Estimators.ipynb",
    "21-meta-learners": "21-Meta-Learners.ipynb",
    "22-orthogonal-ml": "22-Debiased-Orthogonal-Machine-Learning.ipynb",
    "23-heterogeneity-nonlinearity": "23-Challenges-with-Effect-Heterogeneity-and-Nonlinearity.ipynb",
    "24-did-saga": "24-The-Diff-in-Diff-Saga.ipynb",
    "25-synthetic-did": "25-Synthetic-Diff-in-Diff.ipynb",
    "a1-debiasing-orthogonalization": "Debiasing-with-Orthogonalization.ipynb",
    "a2-debiasing-propensity-score": "Debiasing-with-Propensity-Score.ipynb",
    "a3-when-prediction-fails": "When-Prediction-Fails.ipynb",
    "a4-prediction-metrics": "Prediction-Metrics-For-Causal-Models.ipynb",
    "a5-conformal-synthetic-control": "Conformal-Inference-for-Synthetic-Control.ipynb",
}


def clean(value: str) -> str:
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"<[^>]+>", "", value)
    return value.strip()


def output_text(output: dict) -> str:
    if "text" in output:
        return clean("".join(output["text"]))
    data = output.get("data") or {}
    if "text/plain" in data:
        return clean("".join(data["text/plain"]))
    if "text/markdown" in data:
        return clean("".join(data["text/markdown"]))
    if "image/png" in data:
        return "[image output]"
    return ""


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []

    for slug, filename in MAP.items():
        path = BOOK / filename
        if not path.exists():
            print("missing", filename)
            continue
        nb = json.loads(path.read_text(encoding="utf-8"))
        cells = nb.get("cells", [])
        markdown = []
        code = []
        data_files = set()
        images = 0

        for cell in cells:
            source = "".join(cell.get("source", []))
            if cell.get("cell_type") == "markdown":
                for line in source.splitlines():
                    if line.startswith("#"):
                        markdown.append(line.rstrip())
                for match in re.finditer(r"data/[A-Za-z0-9_./-]+\.csv", source):
                    data_files.add(match.group(0))
            elif cell.get("cell_type") == "code":
                outputs = []
                for output in cell.get("outputs", []):
                    text = output_text(output)
                    if text:
                        outputs.append(text)
                    if "image/png" in (output.get("data") or {}):
                        images += 1
                clean_source = source.strip()
                if clean_source:
                    code.append((clean_source, "\n\n".join(outputs)))
                for match in re.finditer(r"data/[A-Za-z0-9_./-]+\.csv", source):
                    data_files.add(match.group(0))

        title = markdown[0].lstrip("# ").strip() if markdown else filename
        lines = [
            f"# Accuracy brief — {title}",
            "",
            f"- Notebook: `{filename}`",
            f"- Cells: {len(cells)} (code {len(code)})",
            f"- Data files: {', '.join(sorted(data_files)) if data_files else '—'}",
            f"- Image outputs: {images}",
            "",
            "## Headings",
            "",
        ]
        lines.extend(markdown[:40] or ["—"])
        lines.extend(["", "## Code and printed output", ""])

        for i, (source, output) in enumerate(code[:18], 1):
            snippet = source.splitlines()
            if len(snippet) > 22:
                snippet = snippet[:22] + ["# ..."]
            lines.extend(["### Code cell " + str(i), "", "```python", "\n".join(snippet), "```", ""])
            if output:
                out_lines = output.splitlines()
                if len(out_lines) > 18:
                    out_lines = out_lines[:18] + ["..."]
                lines.extend(["```text", "\n".join(out_lines), "```", ""])

        lines.extend(
            [
                "",
                "## Reproduction gate",
                "",
                "- Recompute every numeric claim used on the page from this notebook/data.",
                "- Add a Node test for the arithmetic and a CDP test for the interaction.",
                "- Record any deviation in the page's source note; never round a number silently.",
                "",
            ]
        )
        (OUT / (slug + ".md")).write_text("\n".join(lines), encoding="utf-8")
        rows.append((slug, title, len(code), len(data_files), images))

    index = [
        "# Chapter accuracy briefs",
        "",
        "Generated from the book's notebooks by `tools/extract-briefs.py`. These are not",
        "published pages: they are the source-of-truth checklist for building each chapter.",
        "",
        "| Slug | Notebook title | Code cells | Data files | Images |",
        "|---|---|---:|---:|---:|",
    ]
    for slug, title, code_count, data_count, image_count in rows:
        index.append(f"| `{slug}` | {title} | {code_count} | {data_count} | {image_count} |")
    index.append("")
    (OUT / "README.md").write_text("\n".join(index), encoding="utf-8")
    print(f"wrote {len(rows)} briefs to {OUT}")


if __name__ == "__main__":
    main()
