# Accuracy brief — Why Prediction Metrics are Dangerous For Causal Models

- Notebook: `Prediction-Metrics-For-Causal-Models.ipynb`
- Cells: 21 (code 11)
- Data files: —
- Image outputs: 1

## Headings

# Why Prediction Metrics are Dangerous For Causal Models
## Simulating Data
## Predictive Metric For Causal Inference

## Code and printed output

### Code cell 1

```python
import pandas as pd
import numpy as np
from matplotlib import pyplot as plt
import statsmodels.formula.api as smf
from toolz import *
```

### Code cell 2

```python
n = 100000
n_features = 20
n_heter = 10

np.random.seed(12321)

X = np.random.normal(1, 10, (n, n_features))
nuisance = np.random.uniform(-1,1, (n_features, 1))

W = np.random.normal(1, 10, (n, n_heter))
heter_y = np.random.uniform(-1,1, (n_heter, 1))

T = np.random.normal(10, 2, (n, 1)) # T is random!
Y = np.random.normal(T + T*W.dot(heter_y) + 20*X.dot(nuisance), 0.1)

df = pd.concat([
    pd.DataFrame(X, columns=[f"f{f}" for f in range(n_features)]),
    pd.DataFrame(W, columns=[f"w{f}" for f in range(n_heter)])
], axis=1).assign(T=T, Y=Y)
```

### Code cell 3

```python
from sklearn.model_selection import train_test_split

train, test = train_test_split(df, test_size=0.5)
train.shape, test.shape
```

```text
((50000, 32), (50000, 32))
```

### Code cell 4

```python
m1 = smf.ols("Y~T*(" + "+".join([f"f{f}" for f in range(n_features)])+")", data=df).fit()
m2 = smf.ols("Y~T*(" + "+".join([f"w{f}" for f in range(n_heter)])+")", data=df).fit()
```

### Code cell 5

```python
from sklearn.metrics import r2_score

print("M1:", r2_score(test["Y"], m1.predict(test)))
print("M2:", r2_score(test["Y"], m2.predict(test)))
```

```text
M1: 0.9160516511287358
M2: 0.08378351037639298
```

### Code cell 6

```python
@curry
def elast(data, y, t):
        return (np.sum((data[t] - data[t].mean())*(data[y] - data[y].mean())) /
                np.sum((data[t] - data[t].mean())**2))
    

def cumulative_gain(dataset, prediction, y, t, min_periods=30, steps=100):
    size = dataset.shape[0]
    ordered_df = dataset.sort_values(prediction, ascending=False).reset_index(drop=True)
    n_rows = list(range(min_periods, size, size // steps)) + [size]
    return np.array([elast(ordered_df.head(rows), y, t) * (rows/size) for rows in n_rows])
```

### Code cell 7

```python
test_pred = test.assign(
    cate_1 = m1.predict(test) - m1.predict(test.assign(T=test["T"]-1)),
    cate_2 = m2.predict(test) - m2.predict(test.assign(T=test["T"]-1))
)
```

### Code cell 8

```python
cumelast_1 = cumulative_gain(test_pred, "cate_1", "Y", "T", steps=100)
cumelast_2 = cumulative_gain(test_pred, "cate_2", "Y", "T", steps=100)
```

### Code cell 9

```python
plt.plot(range(len(cumelast_1)), cumelast_1, label="M1")
plt.plot(range(len(cumelast_2)), cumelast_2, label="M2")
plt.plot([0, 100], [0, elast(test_pred, "Y", "T")], linestyle="--", label="Random Model", color="black")
plt.legend()
plt.ylabel("Cumulative Elasticity");
```

### Code cell 10

```python
denoise_m = smf.ols("Y~"+
                    "+".join([f"w{f}" for f in range(n_heter)])+
                    "+"+
                    "+".join([f"f{f}" for f in range(n_features)]), data=train).fit()

test_res = test.assign(Y_res = test["Y"] - denoise_m.predict(test) + test["Y"].mean())
```

### Code cell 11

```python
print("M1:", r2_score(test_res["Y_res"], m1.predict(test_res)))
print("M2:", r2_score(test_res["Y_res"], m2.predict(test_res)))
```

```text
M1: -281.7950185092476
M2: -24.04912481654577
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
