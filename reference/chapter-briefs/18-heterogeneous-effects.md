# Accuracy brief — 18 - Heterogeneous Treatment Effects and Personalization

- Notebook: `18-Heterogeneous-Treatment-Effects-and-Personalization.ipynb`
- Cells: 27 (code 12)
- Data files: data/ice_cream_sales_rnd.csv
- Image outputs: 2

## Headings

# 18 - Heterogeneous Treatment Effects and Personalization
## From Predictions to Causal Inference
## From ATE to CATE
## Predicting Sensitivity
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
import statsmodels.formula.api as smf
import statsmodels.api as sm

from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
```

### Code cell 2

```python
prices_rnd = pd.read_csv("./data/ice_cream_sales_rnd.csv")
print(prices_rnd.shape)
prices_rnd.head()
```

```text
(5000, 5)

temp  weekday  cost  price  sales
0  25.8        1   0.3      7    230
1  22.7        3   0.5      4    190
2  33.7        7   1.0      5    237
3  23.0        4   0.5      5    193
4  24.4        1   1.0      3    252
```

### Code cell 3

```python
np.random.seed(123)
train, test = train_test_split(prices_rnd)
```

### Code cell 4

```python
m1 = smf.ols("sales ~ price + temp+C(weekday)+cost", data=train).fit()
m1.summary().tables[1]
```

### Code cell 5

```python
m2 = smf.ols("sales ~ price*temp + C(weekday) + cost", data=train).fit()
m2.summary().tables[1]
```

### Code cell 6

```python
m3 = smf.ols("sales ~ price*cost + price*C(weekday) + price*temp", data=train).fit()
```

### Code cell 7

```python
def pred_sensitivity(m, df, t="price"):
    return df.assign(**{
        "pred_sens": m.predict(df.assign(**{t:df[t]+1})) - m.predict(df)
    })

pred_sensitivity(m1, test).head()
```

```text
temp  weekday  cost  price  sales  pred_sens
2648  18.6        7   0.5     10    185   -2.751463
2456  26.0        3   0.5     10    200   -2.751463
4557  23.7        3   0.3      8    192   -2.751463
4884  28.9        4   1.5      6    213   -2.751463
92    23.7        1   0.5      8    207   -2.751463
```

### Code cell 8

```python
pred_sens3 = pred_sensitivity(m3, test)

np.random.seed(1)
pred_sens3.sample(5)
```

```text
temp  weekday  cost  price  sales  pred_sens
4764  31.1        6   1.0      3    212    1.144309
4324  24.8        7   0.5     10    182   -9.994303
4536  25.0        2   1.5      6    205    0.279273
3466  26.0        3   1.5      3    205    0.308320
115   19.3        3   0.3      9    177   -0.349745
```

### Code cell 9

```python
X = ["temp", "weekday", "cost", "price"]
y = "sales"
ml = GradientBoostingRegressor()
ml.fit(train[X], train[y])

# make sure the model is not overfiting.
ml.score(test[X], test[y])
```

```text
0.9124088322890126
```

### Code cell 10

```python
bands_df = pred_sens3.assign(
    sens_band = pd.qcut(pred_sens3["pred_sens"], 2), # create two groups based on sensitivity predictions 
    pred_sales = ml.predict(pred_sens3[X]),
    pred_band = pd.qcut(ml.predict(pred_sens3[X]), 2), # create two groups based on sales predictions
)

bands_df.head()
```

```text
temp  weekday  cost  price  sales  pred_sens  \
2648  18.6        7   0.5     10    185  -10.301045   
2456  26.0        3   0.5     10    200    0.036165   
4557  23.7        3   0.3      8    192   -0.132057   
4884  28.9        4   1.5      6    213    0.860663   
92    23.7        1   0.5      8    207   -9.953698   

                           sens_band  pred_sales           pred_band  
2648  (-10.597999999999999, -0.00555]  186.878081  (161.089, 198.735]  
2456                (-0.00555, 1.389]  203.188327  (198.735, 257.746]  
4557  (-10.597999999999999, -0.00555]  188.800637  (161.089, 198.735]  
4884                (-0.00555, 1.389]  210.430813  (198.735, 257.746]  
92    (-10.597999999999999, -0.00555]  209.044522  (198.735, 257.746]
```

### Code cell 11

```python
g = sns.FacetGrid(bands_df, col="sens_band")
g.map_dataframe(sns.regplot, x="price", y="sales")
g.set_titles(col_template="Sens. Band {col_name}");
```

### Code cell 12

```python
g = sns.FacetGrid(bands_df, col="pred_band")
g.map_dataframe(sns.regplot, x="price", y="sales")
g.set_titles(col_template="Pred. Band {col_name}");
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
