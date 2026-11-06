# Accuracy brief — Debiasing with Propensity Score

- Notebook: `Debiasing-with-Propensity-Score.ipynb`
- Cells: 51 (code 27)
- Data files: data/invest_email.csv
- Image outputs: 9

## Headings

# Debiasing with Propensity Score
## Inverse Probability of Treatment Weighting
### Stored Propensity Score
### Estimated Propensity Score
## The Weakness of Propensity Score
## Positivity or Common Support
### Positivity In Practice
## Key Ideas
## References
## Contribute

## Code and printed output

### Code cell 1

```python
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
import seaborn as sns
```

### Code cell 2

```python
email = pd.read_csv("./data/invest_email.csv")
email.head()
```

```text
age    income  insurance  invested    em1_ps    em2_ps    em3_ps  em1  \
0  44.1   4214.66   14036.41   7988.66  0.118507  0.045174  0.921281    0   
1  39.8   1151.27   66622.15   1000.74  0.431123  0.005659  0.000000    1   
2  49.0   8047.26   14119.53  29480.22  0.062137  0.166706  0.840049    0   
3  39.7  10558.37   14798.26  36373.09  0.047372  0.205684  0.000000    0   
4  35.3    802.15     780.84   1643.16  0.616450  0.009292  0.000000    1   

   em2  em3  converted  
0    0    1          1  
1    0    0          0  
2    0    1          0  
3    0    0          0  
4    0    0          0
```

### Code cell 3

```python
email.query("em1 == 0").query("em1_ps>0.9")
```

```text
age  income  insurance  invested    em1_ps    em2_ps    em3_ps  em1  \
2438  48.0  538.02   26276.38   1582.82  0.913562  0.008951  0.999208    0   
2692  44.2  545.62    2377.01    743.40  0.901065  0.004204  0.999047    0   
3152  44.6  541.42   13272.96   1455.92  0.907929  0.008233  0.999136    0   
4175  38.0  543.20   16787.28   1302.20  0.905007  0.007364  0.000000    0   

      em2  em3  converted  
2438    0    1          1  
2692    0    1          0  
3152    0    1          1  
4175    0    0          1
```

### Code cell 4

```python
confounders = ["age", "income", "insurance", "invested"]
```

### Code cell 5

```python
email[confounders + ["em1", "converted"]].corr()[["em1", "converted"]]
```

```text
em1  converted
age       -0.058796   0.401759
income    -0.305610  -0.054009
insurance -0.023948  -0.076234
invested  -0.242374  -0.030250
em1        1.000000   0.046598
converted  0.046598   1.000000
```

### Code cell 6

```python
plt_df = pd.melt(email[confounders + ["em1"]], ["em1"], confounders)

g = sns.FacetGrid(plt_df, col="variable", hue="em1", col_wrap=4, sharey=False, sharex=False)

for i, ax in enumerate(g.axes):
    iter_df = plt_df.loc[lambda df: df["variable"] == confounders[i]]
    sns.kdeplot(x="value", hue="em1", data=iter_df, ax=ax, fill=True)
    ax.set_xlabel(confounders[i])

plt.show()
```

### Code cell 7

```python
np.random.seed(123)
em1_rnd = email.assign(
    em1_w = email["em1"]/email["em1_ps"] + (1-email["em1"])/(1-email["em1_ps"])
).sample(10000, replace=True, weights="em1_w")
```

### Code cell 8

```python
np.random.seed(5)
em1_rnd.sample(5)
```

```text
age   income  insurance  invested    em1_ps    em2_ps    em3_ps  em1  \
2252  44.0  5102.43   42300.28   2294.60  0.097928  0.012976  0.902465    0   
4364  44.0  8503.72     751.08  33314.37  0.058805  0.188387  0.830375    1   
752   44.4  1778.21   24615.45   3054.08  0.279973  0.017270  0.972922    1   
3656  39.8  1752.18     487.22   1893.95  0.284108  0.010710  0.000000    0   
4613  43.1  1023.04   64695.01   2220.32  0.484638  0.012556  0.988928    0   

      em2  em3  converted      em1_w  
2252    0    1          0   1.108559  
4364    0    0          1  17.005333  
752     0    1          1   3.571777  
3656    0    0          0   1.396859  
4613    0    1          1   1.940382
```

### Code cell 9

```python
em1_rnd[confounders + ["em1", "converted"]].corr()[["em1", "converted"]]
```

```text
em1  converted
age       -0.021004   0.404736
income    -0.026685  -0.037946
insurance -0.037656  -0.071385
invested  -0.012073  -0.047987
em1        1.000000   0.076342
converted  0.076342   1.000000
```

### Code cell 10

```python
plt_df = pd.melt(em1_rnd[confounders + ["em1"]], ["em1"], confounders)

g = sns.FacetGrid(plt_df, col="variable", hue="em1", col_wrap=4, sharey=False, sharex=False)

for i, ax in enumerate(g.axes):
    iter_df = plt_df.loc[lambda df: df["variable"] == confounders[i]]
    sns.kdeplot(x="value", hue="em1", data=iter_df, ax=ax, fill=True)
    ax.set_xlabel(confounders[i])

plt.show()
```

### Code cell 11

```python
from sklearn.model_selection import cross_val_predict
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV

t = "em1"

folds = 5

np.random.seed(123)

# makes calibrated Random Forest. 
m_t = CalibratedClassifierCV(
    RandomForestClassifier(n_estimators=100, min_samples_leaf=40, max_depth=3),
    cv=3
)

# estimate PS with cross prediction. 
ps_score_m1 = cross_val_predict(m_t, email[confounders], email[t],
                                cv=folds, method="predict_proba")[:, 1]
```

### Code cell 12

```python
email.assign(ps_score_m1_est = ps_score_m1).head()
```

```text
age    income  insurance  invested    em1_ps    em2_ps    em3_ps  em1  \
0  44.1   4214.66   14036.41   7988.66  0.118507  0.045174  0.921281    0   
1  39.8   1151.27   66622.15   1000.74  0.431123  0.005659  0.000000    1   
2  49.0   8047.26   14119.53  29480.22  0.062137  0.166706  0.840049    0   
3  39.7  10558.37   14798.26  36373.09  0.047372  0.205684  0.000000    0   
4  35.3    802.15     780.84   1643.16  0.616450  0.009292  0.000000    1   

   em2  em3  converted  ps_score_m1_est  
0    0    1          1         0.104727  
1    0    0          0         0.389991  
2    0    1          0         0.083805  
3    0    0          0         0.086290  
4    0    0          0         0.737111
```

### Code cell 13

```python
from sklearn.calibration import calibration_curve

prob_true, prob_pred = calibration_curve(email["em1"], ps_score_m1, n_bins=3)
plt.plot(prob_pred, prob_true, label="Calibrated RF")
plt.plot([.1,.8], [.1, .8], color="grey", linestyle="dashed", label="Perfectly Calibrated")
plt.ylabel("Fraction of Positives")
plt.xlabel("Average Prediction")
plt.legend();
```

### Code cell 14

```python
np.random.seed(123)
em1_rnd_est = email.assign(
    em1_w = email["em1"]/ps_score_m1 + (1-email["em1"])/(1-ps_score_m1)
).sample(10000, replace=True, weights="em1_w")
```

### Code cell 15

```python
em1_rnd_est[confounders + ["em1"]].corr()["em1"]
```

```text
age         -0.030409
income      -0.150937
insurance   -0.037893
invested    -0.111138
em1          1.000000
Name: em1, dtype: float64
```

### Code cell 16

```python
plt_df = pd.melt(em1_rnd_est[confounders + ["em1"]], ["em1"], confounders)

g = sns.FacetGrid(plt_df, col="variable", hue="em1", col_wrap=4, sharey=False, sharex=False)

for i, ax in enumerate(g.axes):
    iter_df = plt_df.loc[lambda df: df["variable"] == confounders[i]]
    sns.kdeplot(x="value", hue="em1", data=iter_df, ax=ax, fill=True)
    ax.set_xlabel(confounders[i])

plt.show()
```

### Code cell 17

```python
email.loc[[1014]]
```

```text
age    income  insurance  invested    em1_ps    em2_ps    em3_ps  em1  \
1014  43.2  18628.09   30356.68  28335.68  0.026862  0.160233  0.615788    1   

      em2  em3  converted  
1014    0    0          1
```

### Code cell 18

```python
em1_rnd.loc[[1014]].shape
```

```text
(38, 12)
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
