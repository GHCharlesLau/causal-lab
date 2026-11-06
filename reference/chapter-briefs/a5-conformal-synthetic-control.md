# Accuracy brief — Conformal Inference for Synthetic Controls

- Notebook: `Conformal-Inference-for-Synthetic-Control.ipynb`
- Cells: 46 (code 25)
- Data files: data/smoking.csv
- Image outputs: 8

## Headings

# Conformal Inference for Synthetic Controls
## Synthetic Control Refresher
## Inference for Grown Ups
### Hypothesis Test and P-Values
#### Test Statistic
#### P-Value
### Confidence Intervals
## Reference
## Contribute

## Code and printed output

### Code cell 1

```python
import numpy as np
import pandas as pd
from toolz import curry
import seaborn as sns
from matplotlib import pyplot as plt
import statsmodels.formula.api as smf
import cvxpy as cp

import toolz as f

from sklearn.linear_model import Lasso
import warnings
warnings.filterwarnings('ignore')

from matplotlib import style
style.use("ggplot")
```

### Code cell 2

```python
data = pd.read_csv("data/smoking.csv")

data = data.pivot("year", "state", "cigsale")
data = data.rename(columns={c: f"state_{c}" for c in data.columns}).rename(columns={"state_3": "california"})
data.shape
```

```text
(31, 39)
```

### Code cell 3

```python
plt.figure(figsize=(10,5))
plt.plot(data.drop(columns=["california"]), color="C1", alpha=0.5)
plt.plot(data["california"], color="C0", label="California")
plt.vlines(x=1988, ymin=40, ymax=300, linestyle=":", lw=2, label="Proposition 99", color="black")
plt.legend()
plt.ylabel("Cigarette Sales")
```

```text
Text(0, 0.5, 'Cigarette Sales')
```

### Code cell 4

```python
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.utils.validation import check_X_y, check_array, check_is_fitted
import cvxpy as cp

class SyntheticControl(BaseEstimator, RegressorMixin):

    def __init__(self,):
        pass

    def fit(self, X, y):

        X, y = check_X_y(X, y)
    
        w = cp.Variable(X.shape[1])
        objective = cp.Minimize(cp.sum_squares(X@w - y))
        
        constraints = [cp.sum(w) == 1, w >= 0]
        
        problem = cp.Problem(objective, constraints)
        problem.solve(verbose=False)
        
        self.X_ = X
# ...
```

### Code cell 5

```python
model = SyntheticControl()

train = data[data.index < 1988]

model.fit(train.drop(columns=["california"]), train["california"]);
```

### Code cell 6

```python
plt.plot(data["california"], label="California")
plt.plot(data["california"].index, model.predict(data.drop(columns=["california"])), label="SC")
plt.vlines(x=1988, ymin=40, ymax=120, linestyle=":", lw=2, label="Proposition 99", color="black")

plt.legend();
```

### Code cell 7

```python
pred_data = data.assign(**{"residuals": data["california"] - model.predict(data.drop(columns=["california"]))})

plt.plot(pred_data["california"].index, pred_data["residuals"], label="Estimated Effect")
plt.hlines(y=0, xmin=1970, xmax=2000, lw=2, color="Black")
plt.vlines(x=1988, ymin=5, ymax=-25, linestyle=":", lw=2, label="Proposition 99", color="Black")

plt.legend();
```

### Code cell 8

```python
plt.figure(figsize=(10,5))
for state in data.columns:
    
    model_ier = SyntheticControl()
    train_iter = data[data.index < 1988]
    model_ier.fit(train_iter.drop(columns=[state]), train_iter[state])
    
    effect = data[state] - model_ier.predict(data.drop(columns=[state]))
    
    is_california = state == "california"
    
    plt.plot(effect,
             color="C0" if is_california else "C1",
             alpha=1 if is_california else 0.5,
             label="California" if is_california else None)

plt.hlines(y=0, xmin=1970, xmax=2000, lw=2, color="Black")
plt.vlines(x=1988, ymin=-50, ymax=100, linestyle=":", lw=2, label="Proposition 99", color="Black")
plt.ylabel("Effect Estimate")
plt.legend();
```

### Code cell 9

```python
def with_effect(df, state, null_hypothesis, start_at, window):
    window_mask = (df.index >= start_at) & (df.index < (start_at +window))
    
    y = np.where(window_mask, df[state] - null_hypothesis, df[state])
    
    return df.assign(**{state: y})
```

### Code cell 10

```python
plt.plot(with_effect(data, "california", 0, 1988, 2000-1988+1)["california"], label="H0: 0")
plt.plot(with_effect(data, "california", -4, 1988, 2000-1988+1)["california"], label="H0: -4")

plt.ylabel("Y0 Under the Null")
plt.legend();
```

### Code cell 11

```python
@curry
def residuals(df, state, null, intervention_start, window, model):
    
    null_data = with_effect(df, state, null, intervention_start, window)
            
    model.fit(null_data.drop(columns=[state]), null_data[state])
    
    y0_est = pd.Series(model.predict(null_data.drop(columns=[state])), index=null_data.index)
    
    residuals = null_data[state] - y0_est
    
    test_mask = (null_data.index >= intervention_start) & (null_data.index < (intervention_start + window))
    
    return pd.DataFrame({
        "y0": null_data[state],
        "y0_est": y0_est,
        "residuals": residuals,
        "post_intervention": test_mask
    })[lambda d: d.index < (intervention_start + window)]  # just discard  points after the defined effect window
```

### Code cell 12

```python
model = SyntheticControl()

residuals_df = residuals(data,
                         "california",
                         null=0.0,
                         intervention_start=1988,
                         window=2000-1988+1,
                         model=model)

residuals_df.head()
```

```text
y0      y0_est  residuals  post_intervention
year                                                      
1970  123.000000  112.529475  10.470525              False
1971  121.000000  114.315723   6.684277              False
1972  123.500000  119.302289   4.197711              False
1973  124.400002  121.265554   3.134447              False
1974  126.699997  124.356696   2.343301              False
```

### Code cell 13

```python
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 4))
residuals_df[["y0", "y0_est"]].plot(ax=ax1)
ax1.set_title("Y0 under H0: 0");
residuals_df[["residuals"]].plot(ax=ax2);
ax2.set_title("Residuals under H0: 0");
```

### Code cell 14

```python
def test_statistic(u_hat, q=1, axis=0):
    return (np.abs(u_hat) ** q).mean(axis=axis) ** (1/q)
```

### Code cell 15

```python
print("H0:0 ", test_statistic(residuals_df.query("post_intervention")["residuals"]))
```

```text
H0:0  12.602929955114083
```

### Code cell 16

```python
def p_value(resid_df, q=1):
    
    u = resid_df["residuals"].values
    post_intervention = resid_df["post_intervention"].values
    
    block_permutations = np.stack([np.roll(u, permutation, axis=0)[post_intervention]
                                   for permutation in range(len(u))])
    
    statistics = test_statistic(block_permutations, q=1, axis=1)
    
    p_val = np.mean(statistics >= statistics[0])

    return p_val
```

### Code cell 17

```python
p_value(residuals_df)
```

```text
0.16129032258064516
```

### Code cell 18

```python
def p_val_grid(df, state, nulls, intervention_start, period, model):
    
    df_aug = df[df.index < intervention_start].append(df.loc[period])
    
    p_vals =  {null: p_value(residuals(df_aug,
                                       state,
                                       null=null,
                                       intervention_start=period,
                                       window=1,
                                       model=model)) for null in nulls}        
        
    return pd.DataFrame(p_vals, index=[period]).T
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
