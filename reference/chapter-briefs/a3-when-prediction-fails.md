# Accuracy brief — When Prediction Fails

- Notebook: `When-Prediction-Fails.ipynb`
- Cells: 48 (code 22)
- Data files: —
- Image outputs: 3

## Headings

# When Prediction Fails
## When all you have is a Hammer...
## instantiate the machine learning model
## Fit the ML model
# Make predictions on unseen data
# Evaluate the quality of predictions
## Who Wants a Coupon?
## Simple Policy
## Policy With Model
## Hammering Your Thumb with Predictions
## When Might Prediction Helps
## A Graphical Explanation
## Key Ideas
## References
## Contribute

## Code and printed output

### Code cell 1

```python
import pandas as pd
import numpy as np
from sklearn import ensemble
from sklearn.model_selection import train_test_split, cross_val_predict
from sklearn.ensemble import gradient_boosting
from sklearn.metrics import r2_score
import seaborn as sns
from matplotlib import pyplot as plt
from matplotlib import style
style.use("ggplot")

# helper functions for this notebook
from nb18 import ltv_with_coupons
```

### Code cell 2

```python
transactions, customer_features = ltv_with_coupons()

print(transactions.shape)
transactions.head()
```

```text
(10000, 32)

customer_id  cacq  day_0  day_1  day_2  day_3  day_4  day_5  day_6  day_7  \
0            0  -110      0      0      0      0      5      0      2      2   
1            1   -61      2      0      5      2      3      4      1      0   
2            2    -8      0      0      0      0      0      0      0      0   
3            3   -30      0      0      0      0      0      0      0      0   
4            4   -41      0      0      0      2      0      4      0      0   

   ...  day_20  day_21  day_22  day_23  day_24  day_25  day_26  day_27  \
0  ...       0       3       0       4       0       0       0       0   
1  ...       5       0       1      35      11       0       5       2   
2  ...       0       0       0       0       0       0       0       0   
3  ...       0       0       0       0       0       0       0       0   
4  ...       0       0       0       0       0       0       0       0   

   day_28  day_29  
0       0       0  
...
```

### Code cell 3

```python
print(customer_features.shape)
customer_features.head()
```

```text
(10000, 5)

customer_id  region  income  coupons  age
0            0      18    1025        5   24
1            1      40    1649        5   26
2            2      35    2034       15   33
3            3      29    1859       15   35
4            4      11    1243        5   26
```

### Code cell 4

```python
def process_data(transactions, customer_data):

    profitable = (transactions[["customer_id"]]
                  .assign(net_value = transactions
                          .drop(columns="customer_id")
                          .sum(axis=1)))

    return (customer_data
            # join net_value and features
            .merge(profitable, on="customer_id")
            # include the coupons cost
            .assign(net_value = lambda d: d["net_value"] - d["coupons"]))

customer_features = process_data(transactions, customer_features)
customer_features.head()
```

```text
customer_id  region  income  coupons  age  net_value
0            0      18    1025        5   24        -44
1            1      40    1649        5   26         74
2            2      35    2034       15   33        -23
3            3      29    1859       15   35        -45
4            4      11    1243        5   26        -26
```

### Code cell 5

```python
customer_features.groupby("coupons")["customer_id"].count()
```

```text
coupons
0      458
5     4749
10    4154
15     639
Name: customer_id, dtype: int64
```

### Code cell 6

```python
customer_features.corr()[["coupons"]]
```

```text
coupons
customer_id  0.002239
region      -0.004073
income       0.001236
coupons      1.000000
age          0.897308
net_value   -0.078369
```

### Code cell 7

```python
sns.barplot(data=customer_features, x="coupons", y="net_value")
plt.title("Net Value by Coupon Value");
```

### Code cell 8

```python
simple_policy = 5 * np.ones(customer_features["coupons"].shape)

transactions_simple_policy, customer_features_simple_policy = ltv_with_coupons(simple_policy)
customer_features_simple_policy = process_data(transactions_simple_policy, customer_features_simple_policy)

customer_features_simple_policy.head()
```

```text
customer_id  region  income  coupons  age  net_value
0            0      18    1025        5   24        -44
1            1      40    1649        5   26         74
2            2      35    2034        5   33         63
3            3      29    1859        5   35         63
4            4      11    1243        5   26        -26
```

### Code cell 9

```python
simple_policy_gain = customer_features_simple_policy["net_value"].mean()
simple_policy_gain
```

```text
252.9268
```

### Code cell 10

```python
def model_bands(train_set, features, target, model_params, n_bands, seed=1):
    
    np.random.seed(seed)
    
    # train the ML model
    reg = ensemble.GradientBoostingRegressor(**model_params)
    reg.fit(train_set[features], train_set[target])
    
    # fit the bands
    bands = pd.qcut(reg.predict(train_set[features]), q=n_bands, retbins=True)[1]
    
    def predict(test_set):
        # make predictions with trained model
        predictions = reg.predict(test_set[features])
        
        # discretize predictions into bands.
        pred_bands = np.digitize(predictions, bands, right=False) 
        return test_set.assign(predictions=predictions,
                               # cliping avoid creating new upper bands
                               pred_bands=np.clip(pred_bands, 1, n_bands))
    
    return predict
```

### Code cell 11

```python
train, test = train_test_split(customer_features, test_size=0.3, random_state=1)
```

### Code cell 12

```python
model_params = {'n_estimators': 150,
                'max_depth': 4,
                'min_samples_split': 10,
                'learning_rate': 0.01,
                'loss': 'ls'}

features = ["region", "income", "age"]
target = "net_value"

np.random.seed(1)
model = model_bands(train, features, target, model_params, n_bands=10)
```

### Code cell 13

```python
model(train).head()
```

```text
customer_id  region  income  coupons  age  net_value  predictions  \
2228         2228      30     567        5   27       -129   -16.296297   
5910         5910      32     647        5   25        -55   -16.296297   
1950         1950      31    2953       15   33       -142   102.237797   
2119         2119       1    2860        5   27        -23    94.291197   
5947         5947      49     589        5   26        -91    -3.525593   

      pred_bands  
2228           2  
5910           2  
1950           7  
2119           7  
5947           3
```

### Code cell 14

```python
print("Train Score:, ", r2_score(train["net_value"], model(train)["predictions"]))
print("Test Score:, ", r2_score(test["net_value"], model(test)["predictions"]))
```

```text
Train Score:,  0.5382953634651921
Test Score:,  0.504563847410434
```

### Code cell 15

```python
plt.figure(figsize=(12,6))
sns.barplot(data=model(customer_features), x="pred_bands", y="net_value", hue="coupons")
plt.title("Net Value by Coupon Value");
```

### Code cell 16

```python
pred_bands = (model(customer_features)
              .groupby(["pred_bands", "coupons"])
              [["net_value"]].mean()
              .reset_index())

pred_bands.head(7)
```

```text
pred_bands  coupons   net_value
0           1        0 -324.538462
1           1        5 -237.683871
2           1       10 -142.203390
3           1       15 -160.413223
4           2        0 -108.980769
5           2        5  -63.718650
6           2       10  -68.327146
```

### Code cell 17

```python
pred_bands["max_net"] = (pred_bands
                         .groupby(['pred_bands'])
                         [["net_value"]]
                         .rank(ascending=False))


pred_bands.head(7)
```

```text
pred_bands  coupons   net_value  max_net
0           1        0 -324.538462      4.0
1           1        5 -237.683871      3.0
2           1       10 -142.203390      1.0
3           1       15 -160.413223      2.0
4           2        0 -108.980769      4.0
5           2        5  -63.718650      1.0
6           2       10  -68.327146      2.0
```

### Code cell 18

```python
best_coupons_per_band = pred_bands.query("max_net==1")[["pred_bands", "coupons"]]

best_coupons_per_band
```

```text
pred_bands  coupons
2            1       10
5            2        5
9            3        5
14           4       10
17           5        5
22           6       10
26           7       10
30           8       10
35           9       15
37          10        5
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
