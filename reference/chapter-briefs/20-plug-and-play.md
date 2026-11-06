# Accuracy brief — 20 - Plug-and-Play Estimators

- Notebook: `20-Plug-and-Play-Estimators.ipynb`
- Cells: 28 (code 12)
- Data files: data/ice_cream_sales_rnd.csv, data/invest_email_rnd.csv
- Image outputs: 2

## Headings

# 20 - Plug-and-Play Estimators
## Problem Setup
## Target Transformation
## The Continuous Treatment Case
### Non Linear Treatment Effects
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
from nb21 import cumulative_gain, elast
```

### Code cell 2

```python
email = pd.read_csv("./data/invest_email_rnd.csv")
email.head()
```

```text
age   income  insurance  invested  em1  em2  em3  converted
0  44.1  5483.80    6155.29  14294.81    0    1    1          0
1  39.8  2737.92   50069.40   7468.15    1    0    0          0
2  49.0  2712.51    5707.08   5095.65    1    0    1          1
3  39.7  2326.37   15657.97   6345.20    1    1    1          0
4  35.3  2787.26   27074.44  14114.86    1    1    1          0
```

### Code cell 3

```python
from sklearn.model_selection import train_test_split

np.random.seed(123)
train, test = train_test_split(email, test_size=0.4)
print(train.shape, test.shape)
```

```text
(9000, 8) (6000, 8)
```

### Code cell 4

```python
y = "converted"
T = "em1"
X = ["age", "income", "insurance", "invested"]

ps = train[T].mean()

y_star_train = train[y] * (train[T] - ps)/(ps*(1-ps))
```

### Code cell 5

```python
from lightgbm import LGBMRegressor

np.random.seed(123)
cate_learner = LGBMRegressor(max_depth=3, min_child_samples=300, num_leaves=5)
cate_learner.fit(train[X], y_star_train);
```

### Code cell 6

```python
test_pred = test.assign(cate=cate_learner.predict(test[X]))
test_pred.head()
```

```text
age   income  insurance  invested  em1  em2  em3  converted      cate
6958  40.9  4486.14   37320.33  12559.25    0    0    1          0  0.105665
7534  42.6  6386.19   13270.47  29114.42    0    0    1          0  0.121922
2975  47.6  1900.26   25588.72   2420.39    0    0    1          0  0.034161
3903  41.0  5802.19   57087.37  20182.20    1    0    1          1  0.046805
8437  49.1  2202.96    5050.81   9245.88    1    0    1          0 -0.009099
```

### Code cell 7

```python
gain_curve_test = cumulative_gain(test_pred, "cate", y="converted", t="em1")
gain_curve_train = cumulative_gain(train.assign(cate=cate_learner.predict(train[X])), "cate", y="converted", t="em1")
plt.plot(gain_curve_test, color="C0", label="Test")
plt.plot(gain_curve_train, color="C1", label="Train")
plt.plot([0, 100], [0, elast(test, "converted", "em1")], linestyle="--", color="black", label="Baseline")
plt.legend();
```

### Code cell 8

```python
prices_rnd = pd.read_csv("./data/ice_cream_sales_rnd.csv")
prices_rnd.head()
```

```text
temp  weekday  cost  price  sales
0  25.8        1   0.3      7    230
1  22.7        3   0.5      4    190
2  33.7        7   1.0      5    237
3  23.0        4   0.5      5    193
4  24.4        1   1.0      3    252
```

### Code cell 9

```python
np.random.seed(123)
train, test = train_test_split(prices_rnd, test_size=0.3)
train.shape, test.shape
```

```text
((3500, 5), (1500, 5))
```

### Code cell 10

```python
y_star_cont = (train["price"] - train["price"].mean()) * (train["sales"] - train["sales"].mean())
```

### Code cell 11

```python
cate_learner = LGBMRegressor(max_depth=3, min_child_samples=300, num_leaves=5)

np.random.seed(123)
cate_learner.fit(train[["temp", "weekday", "cost"]], y_star_cont)

cate_test_transf_y = cate_learner.predict(test[["temp", "weekday", "cost"]])

test_pred = test.assign(cate=cate_test_transf_y)
test_pred.sample(5)
```

```text
temp  weekday  cost  price  sales         cate
2815  15.7        4   1.5      3    187 -1395.956278
257   29.4        3   1.0      3    209 -1607.400415
2585  24.6        6   1.0     10    197 -1497.197402
3260  20.2        1   0.5      4    246 -1629.798111
1999  10.0        4   0.5     10    139 -1333.690544
```

### Code cell 12

```python
gain_curve_test = cumulative_gain(test.assign(cate=cate_test_transf_y),
                                "cate", y="sales", t="price")

gain_curve_train = cumulative_gain(train.assign(cate=cate_learner.predict(train[["temp", "weekday", "cost"]])),
                                   "cate", y="sales", t="price")


plt.plot(gain_curve_test, label="Test")
plt.plot(gain_curve_train, label="Train")
plt.plot([0, 100], [0, elast(test, "sales", "price")], linestyle="--", color="black", label="Baseline")
plt.legend();
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
