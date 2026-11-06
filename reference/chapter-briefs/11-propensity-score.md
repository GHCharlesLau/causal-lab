# Accuracy brief — 11 - Propensity Score

- Notebook: `11-Propensity-Score.ipynb`
- Cells: 43 (code 21)
- Data files: data/learning_mindset.csv
- Image outputs: 6

## Headings

# 11 - Propensity Score
## The Psychology of Growth
## Propensity Score
## Propensity Weighting
## Propensity Score Estimation
## Standard Error
## Common Issues with Propensity Score
## Propensity Score Matching
## Key Ideas
## References
## Contribute

## Code and printed output

### Code cell 1

```python
import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import numpy as np
from matplotlib import style
from matplotlib import pyplot as plt
import seaborn as sns
import statsmodels.formula.api as smf
from causalinference import CausalModel

import graphviz as gr

%matplotlib inline

style.use("fivethirtyeight")
pd.set_option("display.max_columns", 6)
```

### Code cell 2

```python
data = pd.read_csv("./data/learning_mindset.csv")
data.sample(5, random_state=5)
```

```text
schoolid  intervention  achievement_score  ...  school_ethnic_minority  \
259         73             1           1.480828  ...               -0.515202   
3435        76             0          -0.987277  ...               -1.310927   
9963         4             0          -0.152340  ...                0.875012   
4488        67             0           0.358336  ...                0.315755   
2637        16             1           1.360920  ...               -0.033161   

      school_poverty  school_size  
259        -0.169849     0.173954  
3435        0.224077    -0.426757  
9963       -0.724801     0.761781  
4488        0.054586     1.862187  
2637       -0.982274     1.591641  

[5 rows x 13 columns]
```

### Code cell 3

```python
data.groupby("success_expect")["intervention"].mean()
```

```text
success_expect
1    0.271739
2    0.265957
3    0.294118
4    0.271617
5    0.311070
6    0.354287
7    0.362319
Name: intervention, dtype: float64
```

### Code cell 4

```python
smf.ols("achievement_score ~ intervention", data=data).fit().summary().tables[1]
```

### Code cell 5

```python
plt.hist(data["achievement_score"], bins=20, alpha=0.3, label="All")
plt.hist(data.query("intervention==0")["achievement_score"], bins=20, alpha=0.3, color="C2")
plt.hist(data.query("intervention==1")["achievement_score"], bins=20, alpha=0.3, color="C3")
plt.vlines(-0.1538, 0, 300, label="Untreated", color="C2")
plt.vlines(-0.1538+0.4723, 0, 300, label="Treated", color="C3")
plt.legend();
```

### Code cell 6

```python
g = gr.Digraph()
g.edge("T", "Y")
g.edge("X", "Y")
g.edge("X", "e(x)")
g.edge("e(x)", "T")
g
```

### Code cell 7

```python
categ = ["ethnicity", "gender", "school_urbanicity"]
cont = ["school_mindset", "school_achievement", "school_ethnic_minority", "school_poverty", "school_size"]

data_with_categ = pd.concat([
    data.drop(columns=categ), # dataset without the categorical features
    pd.get_dummies(data[categ], columns=categ, drop_first=False)# categorical features converted to dummies
], axis=1)

print(data_with_categ.shape)
```

```text
(10391, 32)
```

### Code cell 8

```python
from sklearn.linear_model import LogisticRegression

T = 'intervention'
Y = 'achievement_score'
X = data_with_categ.columns.drop(['schoolid', T, Y])

ps_model = LogisticRegression(C=1e6).fit(data_with_categ[X], data_with_categ[T])

data_ps = data.assign(propensity_score=ps_model.predict_proba(data_with_categ[X])[:, 1])

data_ps[["intervention", "achievement_score", "propensity_score"]].head()
```

```text
intervention  achievement_score  propensity_score
0             1           0.277359          0.315486
1             1          -0.449646          0.263801
2             1           0.769703          0.344024
3             1          -0.121763          0.344024
4             1           1.526147          0.367784
```

### Code cell 9

```python
weight_t = 1/data_ps.query("intervention==1")["propensity_score"]
weight_nt = 1/(1-data_ps.query("intervention==0")["propensity_score"])
print("Original Sample Size", data.shape[0])
print("Treated Population Sample Size", sum(weight_t))
print("Untreated Population Sample Size", sum(weight_nt))
```

```text
Original Sample Size 10391
Treated Population Sample Size 10388.565115367259
Untreated Population Sample Size 10391.440761283782
```

### Code cell 10

```python
sns.boxplot(x="success_expect", y="propensity_score", data=data_ps)
plt.title("Confounding Evidence");
```

### Code cell 11

```python
sns.distplot(data_ps.query("intervention==0")["propensity_score"], kde=False, label="Non Treated")
sns.distplot(data_ps.query("intervention==1")["propensity_score"], kde=False, label="Treated")
plt.title("Positivity Check")
plt.legend();
```

### Code cell 12

```python
weight = ((data_ps["intervention"]-data_ps["propensity_score"]) /
          (data_ps["propensity_score"]*(1-data_ps["propensity_score"])))

y1 = sum(data_ps.query("intervention==1")["achievement_score"]*weight_t) / len(data)
y0 = sum(data_ps.query("intervention==0")["achievement_score"]*weight_nt) / len(data)

ate = np.mean(weight * data_ps["achievement_score"])

print("Y1:", y1)
print("Y0:", y0)
print("ATE", ate)
```

```text
Y1: 0.2595823130696891
Y0: -0.1289241686986528
ATE 0.38850648176834174
```

### Code cell 13

```python
from joblib import Parallel, delayed # for parallel processing

# define function that computes the IPTW estimator
def run_ps(df, X, T, y):
    # estimate the propensity score
    ps = LogisticRegression(C=1e6, max_iter=1000).fit(df[X], df[T]).predict_proba(df[X])[:, 1]
    
    weight = (df[T]-ps) / (ps*(1-ps)) # define the weights
    return np.mean(weight * df[y]) # compute the ATE

np.random.seed(88)
# run 1000 bootstrap samples
bootstrap_sample = 1000
ates = Parallel(n_jobs=4)(delayed(run_ps)(data_with_categ.sample(frac=1, replace=True), X, T, Y)
                          for _ in range(bootstrap_sample))
ates = np.array(ates)
```

### Code cell 14

```python
print(f"ATE: {ates.mean()}")
print(f"95% C.I.: {(np.percentile(ates, 2.5), np.percentile(ates, 97.5))}")
```

```text
ATE: 0.3877446247220722
95% C.I.: (0.3545132414290843, 0.41992560836402076)
```

### Code cell 15

```python
sns.distplot(ates, kde=False)
plt.vlines(np.percentile(ates, 2.5), 0, 30, linestyles="dotted")
plt.vlines(np.percentile(ates, 97.5), 0, 30, linestyles="dotted", label="95% CI")
plt.title("ATE Bootstrap Distribution")
plt.legend();
```

### Code cell 16

```python
np.random.seed(42)
school_a = pd.DataFrame(dict(T=np.random.binomial(1, .99, 400), school=0, intercept=1))
school_b = pd.DataFrame(dict(T=np.random.binomial(1, .01, 400), school=1, intercept=1))
ex_data = pd.concat([school_a, school_b]).assign(y = lambda d: np.random.normal(1 + 0.1 * d["T"]))
ex_data.head()
```

```text
T  school  intercept         y
0  1       0          1  0.309526
1  1       0          1  1.571468
2  1       0          1  2.982024
3  1       0          1  2.445420
4  1       0          1  2.693187
```

### Code cell 17

```python
ate_w_f = np.array([run_ps(ex_data.sample(frac=1, replace=True), ["school"], "T", "y") for _ in range(500)])
ate_wo_f = np.array([run_ps(ex_data.sample(frac=1, replace=True), ["intercept"], "T", "y") for _ in range(500)])
```

### Code cell 18

```python
sns.distplot(ate_w_f, kde=False, label="PS W School")
sns.distplot(ate_wo_f, kde=False, label="PS W/O School")
plt.legend();
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
