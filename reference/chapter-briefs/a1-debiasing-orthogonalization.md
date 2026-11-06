# Accuracy brief — Debiasing with Orthogonalization

- Notebook: `Debiasing-with-Orthogonalization.ipynb`
- Cells: 35 (code 16)
- Data files: data/ice_cream_sales.csv
- Image outputs: 7

## Headings

# Debiasing with Orthogonalization
## Linear Regression Reborn
## The Intuition Behind Orthogonalization
## Orthogonalization with Machine Learning
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
from sklearn.model_selection import train_test_split

import statsmodels.formula.api as smf
import statsmodels.api as sm

from nb21 import cumulative_elast_curve_ci, elast, cumulative_gain_ci
```

### Code cell 2

```python
prices = pd.read_csv("./data/ice_cream_sales.csv")

train, test = train_test_split(prices, test_size=0.5)
train.shape, test.shape
```

```text
((5000, 5), (5000, 5))
```

### Code cell 3

```python
test.corr()
```

```text
temp   weekday      cost     price     sales
temp     1.000000  0.003630  0.006605 -0.011977  0.379108
weekday  0.003630  1.000000  0.011889  0.002610  0.004589
cost     0.006605  0.011889  1.000000  0.388046 -0.009410
price   -0.011977  0.002610  0.388046  1.000000  0.080040
sales    0.379108  0.004589 -0.009410  0.080040  1.000000
```

### Code cell 4

```python
np.random.seed(123)
sns.scatterplot(data=test.sample(1000), x="price", y="sales", hue="weekday");
```

### Code cell 5

```python
m_t = smf.ols("price ~ cost + C(weekday) + temp", data=test).fit()
debiased_test = test.assign(**{"price-Mt(X)":test["price"] - m_t.predict(test)})
```

### Code cell 6

```python
np.random.seed(123)
sns.scatterplot(data=debiased_test.sample(1000), x="price-Mt(X)", y="sales", hue="weekday")
plt.vlines(0, debiased_test["sales"].min(), debiased_test["sales"].max(), linestyles='--', color="black");
```

### Code cell 7

```python
m_y = smf.ols("sales ~ cost + C(weekday) + temp", data=test).fit()

debiased_test = test.assign(**{"price-Mt(X)":test["price"] - m_t.predict(test),
                               "sales-My(X)":test["sales"] - m_y.predict(test)})
```

### Code cell 8

```python
np.random.seed(123)
sns.scatterplot(data=debiased_test.sample(1000), x="price-Mt(X)", y="sales-My(X)", hue="weekday")
plt.vlines(0, debiased_test["sales-My(X)"].min(), debiased_test["sales-My(X)"].max(), linestyles='--', color="black");
```

### Code cell 9

```python
m3 = smf.ols(f"sales ~ price*cost + price*C(weekday) + price*temp", data=train).fit()
```

### Code cell 10

```python
def predict_elast(model, price_df, h=0.01):
    return (model.predict(price_df.assign(price=price_df["price"]+h))
            - model.predict(price_df)) / h

debiased_test_pred = debiased_test.assign(**{
    "m3_pred": predict_elast(m3, debiased_test),
})

debiased_test_pred.head()
```

```text
temp  weekday  cost  price  sales  price-Mt(X)  sales-My(X)   m3_pred
7791  20.8        3   1.5    6.3    187    -0.201769     1.441373 -0.073317
1764  26.6        3   1.5    6.3    201    -0.179506     4.737748 -2.139611
5785  24.0        4   1.0    5.8    186    -0.215107    -5.855171 -0.549798
3542  20.9        3   1.5    5.1    180    -1.401386    -5.743172 -0.108943
9250  26.7        5   1.0    7.0    201     0.978382     4.384885 -1.427230
```

### Code cell 11

```python
plt.figure(figsize=(10,6))

cumm_elast = cumulative_elast_curve_ci(debiased_test_pred, "m3_pred", "sales-My(X)", "price-Mt(X)", min_periods=50, steps=200)
x = np.array(range(len(cumm_elast)))
plt.plot(x/x.max(), cumm_elast, color="C0")

plt.hlines(elast(debiased_test_pred, "sales-My(X)", "price-Mt(X)"), 0, 1, linestyles="--", color="black", label="Avg. Elast.")
plt.xlabel("% of Top Elast. Customers")
plt.ylabel("Elasticity of Top %")
plt.title("Cumulative Elasticity")
plt.legend();
```

### Code cell 12

```python
plt.figure(figsize=(10,6))

cumm_gain = cumulative_gain_ci(debiased_test_pred, "m3_pred", "sales-My(X)", "price-Mt(X)", min_periods=50, steps=200)
x = np.array(range(len(cumm_gain)))
plt.plot(x/x.max(), cumm_gain, color="C1")

plt.plot([0, 1], [0, elast(debiased_test_pred, "sales-My(X)", "price-Mt(X)")], linestyle="--", label="Random Model", color="black")

plt.xlabel("% of Top Elast. Customers")
plt.ylabel("Cumulative Gain")
plt.title("Cumulative Gain on Debiased Sample")
plt.legend();
```

### Code cell 13

```python
plt.figure(figsize=(10,6))

cumm_gain = cumulative_gain_ci(debiased_test_pred, "m3_pred", "sales", "price", min_periods=50, steps=200)
x = np.array(range(len(cumm_gain)))
plt.plot(x/x.max(), cumm_gain, color="C1")

plt.plot([0, 1], [0, elast(debiased_test_pred, "sales", "price")], linestyle="--", label="Random Model", color="black")

plt.xlabel("% of Top Elast. Customers")
plt.title("Cumulative Gains on Biased Sample")
plt.ylabel("Cumulative Gains")
plt.legend();
```

### Code cell 14

```python
from sklearn.model_selection import cross_val_predict
from sklearn.ensemble import RandomForestRegressor

X = ["cost", "weekday", "temp"]
t = "price"
y = "sales"

folds = 5

np.random.seed(123)
m_t = RandomForestRegressor(n_estimators=100)
t_res = test[t] - cross_val_predict(m_t, test[X], test[t], cv=folds)

m_y = RandomForestRegressor(n_estimators=100)
y_res = test[y] - cross_val_predict(m_y, test[X], test[y], cv=folds)
```

### Code cell 15

```python
ml_debiased_test = test.assign(**{
    "sales-ML_y(X)": y_res,
    "price-ML_t(X)": t_res,
})
ml_debiased_test.head()
```

```text
temp  weekday  cost  price  sales  sales-ML_y(X)  price-ML_t(X)
7791  20.8        3   1.5    6.3    187      -3.150833      -0.869267
1764  26.6        3   1.5    6.3    201      -0.418857      -0.192867
5785  24.0        4   1.0    5.8    186      -2.515667       0.790429
3542  20.9        3   1.5    5.1    180     -11.718500      -1.280460
9250  26.7        5   1.0    7.0    201      -1.214167       1.715117
```

### Code cell 16

```python
np.random.seed(123)
sns.scatterplot(data=ml_debiased_test.sample(1000),
                x="price-ML_t(X)", y="sales-ML_y(X)", hue="weekday");
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
