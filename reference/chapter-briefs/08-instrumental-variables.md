# Accuracy brief — 08 - Instrumental Variables

- Notebook: `08-Instrumental-Variables.ipynb`
- Cells: 40 (code 21)
- Data files: data/ak91.csv
- Image outputs: 4

## Headings

# 08 - Instrumental Variables
## Going Around Omitted Variable Bias
## Quarter of Birth and the Effect of Education on Wage
## The 1st Stage
## The Reduced Form
## Instrumental Variables by Hand
## Multiple Instruments
## Weakness of Instruments
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
from scipy import stats
from matplotlib import style
import seaborn as sns
from matplotlib import pyplot as plt
import statsmodels.formula.api as smf
import graphviz as gr
from linearmodels.iv import IV2SLS

%matplotlib inline

pd.set_option("display.max_columns", 5)
style.use("fivethirtyeight")
```

### Code cell 2

```python
g = gr.Digraph()

g.edge("ability", "educ")
g.edge("ability", "wage")
g.edge("educ", "wage")
g
```

### Code cell 3

```python
g = gr.Digraph()

g.edge("ability", "educ")
g.edge("ability", "wage")
g.edge("educ", "wage")
g.edge("instrument", "educ")
g
```

### Code cell 4

```python
g = gr.Digraph()

g.edge("ability", "educ")
g.edge("ability", "wage")
g.edge("educ", "wage")
g.edge("qob", "educ")
g
```

### Code cell 5

```python
data = pd.read_csv("./data/ak91.csv")
data.head()
```

```text
log_wage  years_of_schooling  year_of_birth  quarter_of_birth  \
0  5.790019                12.0           30.0               1.0   
1  5.952494                11.0           30.0               1.0   
2  5.315949                12.0           30.0               1.0   
3  5.595926                12.0           30.0               1.0   
4  6.068915                12.0           30.0               1.0   

   state_of_birth  
0            45.0  
1            45.0  
2            45.0  
3            45.0  
4            37.0
```

### Code cell 6

```python
group_data = (data
              .groupby(["year_of_birth", "quarter_of_birth"])
              [["log_wage", "years_of_schooling"]]
              .mean()
              .reset_index()
              .assign(time_of_birth = lambda d: d["year_of_birth"] + (d["quarter_of_birth"])/4))
```

### Code cell 7

```python
plt.figure(figsize=(15,6))
plt.plot(group_data["time_of_birth"], group_data["years_of_schooling"], zorder=-1)
for q in range(1, 5):
    x = group_data.query(f"quarter_of_birth=={q}")["time_of_birth"]
    y = group_data.query(f"quarter_of_birth=={q}")["years_of_schooling"]
    plt.scatter(x, y, marker="s", s=200, c=f"C{q}")
    plt.scatter(x, y, marker=f"${q}$", s=100, c=f"white")

plt.title("Years of Education by Quarter of Birth (first stage)")
plt.xlabel("Year of Birth")
plt.ylabel("Years of Schooling");
```

### Code cell 8

```python
factor_data = data.assign(**{f"q{int(q)}": (data["quarter_of_birth"] == q).astype(int)
                             for q in data["quarter_of_birth"].unique()})

factor_data.head()
```

```text
log_wage  years_of_schooling  ...  q3  q4
0  5.790019                12.0  ...   0   0
1  5.952494                11.0  ...   0   0
2  5.315949                12.0  ...   0   0
3  5.595926                12.0  ...   0   0
4  6.068915                12.0  ...   0   0

[5 rows x 9 columns]
```

### Code cell 9

```python
first_stage = smf.ols("years_of_schooling ~ C(year_of_birth) + C(state_of_birth) + q4", data=factor_data).fit()

print("q4 parameter estimate:, ", first_stage.params["q4"])
print("q4 p-value:, ", first_stage.pvalues["q4"])
```

```text
q4 parameter estimate:,  0.10085809272786578
q4 p-value:,  5.4648294166163044e-15
```

### Code cell 10

```python
plt.figure(figsize=(15,6))
plt.plot(group_data["time_of_birth"], group_data["log_wage"], zorder=-1)
for q in range(1, 5):
    x = group_data.query(f"quarter_of_birth=={q}")["time_of_birth"]
    y = group_data.query(f"quarter_of_birth=={q}")["log_wage"]
    plt.scatter(x, y, marker="s", s=200, c=f"C{q}")
    plt.scatter(x, y, marker=f"${q}$", s=100, c=f"white")

plt.title("Average Weekly Wage by Quarter of Birth (reduced form)")
plt.xlabel("Year of Birth")
plt.ylabel("Log Weekly Earnings");
```

### Code cell 11

```python
reduced_form = smf.ols("log_wage ~ C(year_of_birth) + C(state_of_birth) + q4", data=factor_data).fit()

print("q4 parameter estimate:, ", reduced_form.params["q4"])
print("q4 p-value:, ", reduced_form.pvalues["q4"])
```

```text
q4 parameter estimate:,  0.008603484260140015
q4 p-value:,  0.0014949127183659584
```

### Code cell 12

```python
reduced_form.params["q4"] / first_stage.params["q4"]
```

```text
0.08530286492085315
```

### Code cell 13

```python
iv_by_hand = smf.ols("log_wage ~ C(year_of_birth) + C(state_of_birth) + years_of_schooling_fitted",
                     data=factor_data.assign(years_of_schooling_fitted=first_stage.fittedvalues)).fit()

iv_by_hand.params["years_of_schooling_fitted"]
```

```text
0.0853028649208674
```

### Code cell 14

```python
def parse(model, exog="years_of_schooling"):
    param = model.params[exog]
    se = model.std_errors[exog]
    p_val = model.pvalues[exog]
    print(f"Parameter: {param}")
    print(f"SE: {se}")
    print(f"95 CI: {(-1.96*se,1.96*se) + param}")
    print(f"P-value: {p_val}")
    
formula = 'log_wage ~ 1 + C(year_of_birth) + C(state_of_birth) + [years_of_schooling ~ q4]'
iv2sls = IV2SLS.from_formula(formula, factor_data).fit()
parse(iv2sls)
```

```text
Parameter: 0.0853028649580665
SE: 0.02554081280759766
95 CI: [0.03524287 0.13536286]
P-value: 0.0008381914592261452
```

### Code cell 15

```python
formula = 'log_wage ~ 1 + C(year_of_birth) + C(state_of_birth) + [years_of_schooling ~ q1+q2+q3]'
iv_many_zs = IV2SLS.from_formula(formula, factor_data).fit()
parse(iv_many_zs)
```

```text
Parameter: 0.10769370488924324
SE: 0.0195571490089523
95 CI: [0.06936169 0.14602572]
P-value: 3.657974678716869e-08
```

### Code cell 16

```python
formula = "log_wage ~ years_of_schooling + C(state_of_birth) + C(year_of_birth) + C(quarter_of_birth)"
ols = IV2SLS.from_formula(formula, data=data).fit()
parse(ols)
```

```text
Parameter: 0.067325728176578
SE: 0.00038839984390487046
95 CI: [0.06656446 0.06808699]
P-value: 0.0
```

### Code cell 17

```python
np.random.seed(12)
n = 10000
X = np.random.normal(0, 2, n) # observable variable
U = np.random.normal(0, 2, n) # unobservable (omitted) variable
T = np.random.normal(1 + 0.5*U, 5, n) # treatment
Y = np.random.normal(2 + X - 0.5*U + 2*T, 5, n) # outcome

stddevs = np.linspace(0.1, 100, 50)
Zs = {f"Z_{z}": np.random.normal(T, s, n) for z, s in enumerate(stddevs)} # instruments with decreasing \mathrm{Cov}(Z, T)

sim_data = pd.DataFrame(dict(U=U, T=T, Y=Y)).assign(**Zs)

sim_data.head()
```

```text
U         T  ...        Z_48        Z_49
0  2.696148  8.056988  ... -117.798705  -13.485292
1  2.570240  0.245067  ... -209.727577  -70.792948
2  0.664741  5.597510  ...   60.562232   47.619414
3  1.037725  0.493532  ...   78.136513 -108.322304
4 -2.590591 -6.263014  ...   78.776566  -80.547214

[5 rows x 53 columns]
```

### Code cell 18

```python
corr = (sim_data.corr()["T"]
        [lambda d: d.index.str.startswith("Z")])

corr.head()
```

```text
Z_0    0.999807
Z_1    0.919713
Z_2    0.773434
Z_3    0.634614
Z_4    0.523719
Name: T, dtype: float64
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
