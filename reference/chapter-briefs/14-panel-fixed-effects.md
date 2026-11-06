# Accuracy brief — 14 - Panel Data and Fixed Effects

- Notebook: `14-Panel-Data-and-Fixed-Effects.ipynb`
- Cells: 30 (code 13)
- Data files: —
- Image outputs: 2

## Headings

# 14 - Panel Data and Fixed Effects
## Parallel Trends
## Controlling What you Cannot See
## Fixed Effects
## Visualizing Fixed Effects
## Time Effects
## When Panel Data Won't Help You
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
import statsmodels.formula.api as smf
import graphviz as gr
from linearmodels.datasets import wage_panel

%matplotlib inline
pd.set_option("display.max_columns", 6)
style.use("fivethirtyeight")
```

### Code cell 2

```python
data = wage_panel.load()
data.head()
```

```text
nr  year  black  ...     lwage  expersq  occupation
0  13  1980      0  ...  1.197540        1           9
1  13  1981      0  ...  1.853060        4           9
2  13  1982      0  ...  1.344462        9           9
3  13  1983      0  ...  1.433213       16           9
4  13  1984      0  ...  1.568125       25           5

[5 rows x 12 columns]
```

### Code cell 3

```python
mod = smf.ols("lwage ~ C(year)", data=data).fit()
mod.summary().tables[1]
```

### Code cell 4

```python
data.groupby("year")["lwage"].mean()
```

```text
year
1980    1.393477
1981    1.512867
1982    1.571667
1983    1.619263
1984    1.690295
1985    1.739410
1986    1.799719
1987    1.866479
Name: lwage, dtype: float64
```

### Code cell 5

```python
data.groupby("nr").std().sum()
```

```text
year            1334.971910
black              0.000000
exper           1334.971910
hisp               0.000000
hours         203098.215649
married          140.372801
educ               0.000000
union            106.512445
lwage            173.929670
expersq        17608.242825
occupation       739.222281
dtype: float64
```

### Code cell 6

```python
Y = "lwage"
T = "married"
X = [T, "expersq", "union", "hours"]

mean_data = data.groupby("nr")[X+[Y]].mean()
mean_data.head()
```

```text
married  expersq  union     hours     lwage
nr                                              
13     0.000     25.5  0.125  2807.625  1.255652
17     0.000     61.5  0.000  2504.125  1.637786
18     1.000     61.5  0.000  2350.500  2.034387
45     0.125     35.5  0.250  2225.875  1.773664
110    0.500     77.5  0.125  2108.000  2.055129
```

### Code cell 7

```python
demeaned_data = (data
               .set_index("nr") # set the index as the person indicator
               [X+[Y]]
               - mean_data) # subtract the mean data

demeaned_data.head()
```

```text
married  expersq  union    hours     lwage
nr                                            
13      0.0    -24.5 -0.125 -135.625 -0.058112
13      0.0    -21.5  0.875 -487.625  0.597408
13      0.0    -16.5 -0.125  132.375  0.088810
13      0.0     -9.5 -0.125  152.375  0.177561
13      0.0     -0.5 -0.125  263.375  0.312473
```

### Code cell 8

```python
mod = smf.ols(f"{Y} ~ {'+'.join(X)}", data=demeaned_data).fit()
mod.summary().tables[1]
```

### Code cell 9

```python
from linearmodels.panel import PanelOLS
mod = PanelOLS.from_formula("lwage ~ expersq+union+married+hours+EntityEffects",
                            data=data.set_index(["nr", "year"]))

result = mod.fit(cov_type='clustered', cluster_entity=True)
result.summary.tables[1]
```

### Code cell 10

```python
mod = smf.ols("lwage ~ expersq+union+married+hours+black+hisp+educ", data=data).fit()
mod.summary().tables[1]
```

### Code cell 11

```python
toy_panel = pd.DataFrame({
    "mkt_costs":[5,4,3.5,3, 10,9.5,9,8, 4,3,2,1, 8,7,6,4],
    "purchase":[12,9,7.5,7, 9,7,6.5,5, 15,14.5,14,13, 11,9.5,8,5],
    "city":["C0","C0","C0","C0", "C2","C2","C2","C2", "C1","C1","C1","C1", "C3","C3","C3","C3"]
})

m = smf.ols("purchase ~ mkt_costs", data=toy_panel).fit()

plt.scatter(toy_panel.mkt_costs, toy_panel.purchase)
plt.plot(toy_panel.mkt_costs, m.fittedvalues, c="C5", label="Regression Line")
plt.xlabel("Marketing Costs (in 1000)")
plt.ylabel("In-app Purchase (in 1000)")
plt.title("Simple OLS Model")
plt.legend();
```

### Code cell 12

```python
fe = smf.ols("purchase ~ mkt_costs + C(city)", data=toy_panel).fit()

fe_toy = toy_panel.assign(y_hat = fe.fittedvalues)

plt.scatter(toy_panel.mkt_costs, toy_panel.purchase, c=toy_panel.city)
for city in fe_toy["city"].unique():
    plot_df = fe_toy.query(f"city=='{city}'")
    plt.plot(plot_df.mkt_costs, plot_df.y_hat, c="C5")

plt.title("Fixed Effect Model")
plt.xlabel("Marketing Costs (in 1000)")
plt.ylabel("In-app Purchase (in 1000)");
```

### Code cell 13

```python
mod = PanelOLS.from_formula("lwage ~ expersq+union+married+hours+EntityEffects+TimeEffects",
                            data=data.set_index(["nr", "year"]))

result = mod.fit(cov_type='clustered', cluster_entity=True, cluster_time=True)
result.summary.tables[1]
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
