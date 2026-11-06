# Accuracy brief — 22 - Debiased/Orthogonal Machine Learning

- Notebook: `22-Debiased-Orthogonal-Machine-Learning.ipynb`
- Cells: 62 (code 31)
- Data files: data/ice_cream_sales.csv, data/ice_cream_sales_rnd.csv
- Image outputs: 10

## Headings

# 22 - Debiased/Orthogonal Machine Learning
## ML for Nuisance Parameters
### Frisch-Waugh-Lovell
### Frisch-Waugh-Lovell on Steroids
### CATE Estimation with Double-ML
## Non Parametric Double/Debiased ML
### What is Non-Parametric About?
## Non-Scientific Double/Debiased ML
### More Econometrics May be Needed!
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
import statsmodels.formula.api as smf
from matplotlib import style
style.use("ggplot")
```

### Code cell 2

```python
test = pd.read_csv("./data/ice_cream_sales_rnd.csv")
train = pd.read_csv("./data/ice_cream_sales.csv")
train.head()
```

```text
temp  weekday  cost  price  sales
0  17.3        6   1.5    5.6    173
1  25.4        3   0.3    4.9    196
2  23.3        5   1.5    7.6    207
3  26.9        1   0.3    5.3    241
4  20.2        1   1.0    7.2    227
```

### Code cell 3

```python
np.random.seed(123)
sns.scatterplot(data=train.sample(1000), x="price", y="sales", hue="weekday")
```

### Code cell 4

```python
my = smf.ols("sales~temp+C(weekday)+cost", data=train).fit()
mt = smf.ols("price~temp+C(weekday)+cost", data=train).fit()
```

### Code cell 5

```python
smf.ols("sales_res~price_res", 
        data=train.assign(sales_res=my.resid, # sales residuals
                          price_res=mt.resid) # price residuals
       ).fit().summary().tables[1]
```

### Code cell 6

```python
smf.ols("sales~price+temp+C(weekday)+cost", data=train).fit().params["price"]
```

```text
-4.000429145475454
```

### Code cell 7

```python
from lightgbm import LGBMRegressor
from sklearn.model_selection import cross_val_predict

y = "sales"
T = "price"
X = ["temp", "weekday", "cost"]

debias_m = LGBMRegressor(max_depth=3)

train_pred = train.assign(price_res =  train[T] -
                          cross_val_predict(debias_m, train[X], train[T], cv=5)
                          + train[T].mean()) # add mu_t for visualization.
```

### Code cell 8

```python
np.random.seed(123)
sns.scatterplot(data=train_pred.sample(1000), x="price_res", y="sales", hue="weekday");
```

### Code cell 9

```python
denoise_m = LGBMRegressor(max_depth=3)

train_pred = train_pred.assign(sales_res =  train[y] -
                               cross_val_predict(denoise_m, train[X], train[y], cv=5)
                               + train[y].mean())
```

### Code cell 10

```python
np.random.seed(123)
sns.scatterplot(data=train_pred.sample(1000), x="price_res", y="sales_res", hue="weekday");
```

### Code cell 11

```python
final_model = smf.ols(formula='sales_res ~ price_res', data=train_pred).fit()
final_model.summary().tables[1]
```

### Code cell 12

```python
final_model = smf.ols(formula='sales ~ price', data=train_pred).fit()
final_model.summary().tables[1]
```

### Code cell 13

```python
final_model_cate = smf.ols(formula='sales_res ~ price_res * (temp + C(weekday) + cost)', data=train_pred).fit()

cate_test = test.assign(cate=final_model_cate.predict(test.assign(price_res=1))
                        - final_model_cate.predict(test.assign(price_res=0)))
```

### Code cell 14

```python
gain_curve_test = cumulative_gain(cate_test, "cate", y=y, t=T)
plt.plot(gain_curve_test, color="C0", label="Test")
plt.plot([0, 100], [0, elast(test, y, T)], linestyle="--", color="black", label="Baseline")
plt.legend();
plt.title("R-Learner");
```

### Code cell 15

```python
y = "sales"
T = "price"
X = ["temp", "weekday", "cost"]

debias_m = LGBMRegressor(max_depth=3)
denoise_m = LGBMRegressor(max_depth=3)

train_pred = train.assign(price_res =  train[T] - cross_val_predict(debias_m, train[X], train[T], cv=5),
                          sales_res =  train[y] - cross_val_predict(denoise_m, train[X], train[y], cv=5))
```

### Code cell 16

```python
model_final = LGBMRegressor(max_depth=3)
 
# create the weights
w = train_pred["price_res"] ** 2 
 
# create the transformed target
y_star = (train_pred["sales_res"] / train_pred["price_res"])
 
# use a weighted regression ML model to predict the target with the weights.
model_final.fit(X=train[X], y=y_star, sample_weight=w);
```

### Code cell 17

```python
cate_test_non_param = test.assign(cate=model_final.predict(test[X]))
```

### Code cell 18

```python
gain_curve_test_non_param = cumulative_gain(cate_test_non_param, "cate", y=y, t=T)
plt.plot(gain_curve_test_non_param, color="C0", label="Non-Parametric")
plt.plot(gain_curve_test, color="C1", label="Parametric")
plt.plot([0, 100], [0, elast(test, y, T)], linestyle="--", color="black", label="Baseline")
plt.legend();
plt.title("R-Learner");
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
