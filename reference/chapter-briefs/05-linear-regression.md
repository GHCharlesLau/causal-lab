# Accuracy brief — 05 - The Unreasonable Effectiveness of Linear Regression

- Notebook: `05-The-Unreasonable-Effectiveness-of-Linear-Regression.ipynb`
- Cells: 29 (code 14)
- Data files: data/online_classroom.csv, data/wage.csv
- Image outputs: 1

## Headings

# 05 - The Unreasonable Effectiveness of Linear Regression
## All You Need is Regression
## Regression Theory
## Regression For Non-Random Data
## Omitted Variable or Confounding Bias
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
import statsmodels.formula.api as smf
import graphviz as gr
%matplotlib inline
```

### Code cell 2

```python
data = pd.read_csv("data/online_classroom.csv").query("format_blended==0")

result = smf.ols('falsexam ~ format_ol', data=data).fit()
result.summary().tables[1]
```

### Code cell 3

```python
(data
 .groupby("format_ol")
 ["falsexam"]
 .mean())
```

```text
format_ol
0    78.547485
1    73.635263
Name: falsexam, dtype: float64
```

### Code cell 4

```python
X = data[["format_ol"]].assign(intercep=1)
y = data["falsexam"]

def regress(y, X): 
    return np.linalg.inv(X.T.dot(X)).dot(X.T.dot(y))

beta = regress(y, X)
beta
```

```text
array([-4.9122215 , 78.54748458])
```

### Code cell 5

```python
kappa = data["falsexam"].cov(data["format_ol"]) / data["format_ol"].var()
kappa
```

```text
-4.91222149822695
```

### Code cell 6

```python
e = y - X.dot(beta)
print("Orthogonality imply that the dot product is zero:", np.dot(e, X))
X[["format_ol"]].assign(e=e).corr()
```

```text
Orthogonality imply that the dot product is zero: [7.81597009e-13 4.63984406e-12]

format_ol             e
format_ol  1.000000e+00 -9.419033e-16
e         -9.419033e-16  1.000000e+00
```

### Code cell 7

```python
wage = pd.read_csv("./data/wage.csv").dropna()
model_1 = smf.ols('np.log(hwage) ~ educ', data=wage.assign(hwage=wage["wage"]/wage["hours"])).fit()
model_1.summary().tables[1]
```

### Code cell 8

```python
from matplotlib import pyplot as plt
from matplotlib import style
style.use("fivethirtyeight")

x = np.array(range(5, 20))
plt.plot(x, np.exp(model_1.params["Intercept"] + model_1.params["educ"] * x))
plt.xlabel("Years of Education")
plt.ylabel("Hourly Wage")
plt.title("Impact of Education on Hourly Wage")
plt.show()
```

### Code cell 9

```python
wage.head()
```

```text
wage  hours    lhwage   IQ  educ  exper  tenure  age  married  black  \
0   769     40  2.956212   93    12     11       2   31        1      0   
2   825     40  3.026504  108    14     11       9   33        1      0   
3   650     40  2.788093   96    12     13       7   32        1      0   
4   562     40  2.642622   74    11     14       5   34        1      0   
6   600     40  2.708050   91    10     13       0   30        0      0   

   south  urban  sibs  brthord  meduc  feduc  
0      0      1     1      2.0    8.0    8.0  
2      0      1     1      2.0   14.0   14.0  
3      0      1     4      3.0   12.0   12.0  
4      0      1    10      6.0    6.0   11.0  
6      0      1     1      2.0    8.0    8.0
```

### Code cell 10

```python
controls = ['IQ', 'exper', 'tenure', 'age', 'married', 'black',
            'south', 'urban', 'sibs', 'brthord', 'meduc', 'feduc']

X = wage[controls].assign(intercep=1)
t = wage["educ"]
y = wage["lhwage"]

beta_aux = regress(t, X)
t_tilde = t - X.dot(beta_aux)

kappa = t_tilde.cov(y) / t_tilde.var()
kappa
```

```text
0.041147191010057635
```

### Code cell 11

```python
model_2 = smf.ols('lhwage ~ educ +' + '+'.join(controls), data=wage).fit()
model_2.summary().tables[1]
```

### Code cell 12

```python
g = gr.Digraph()

g.edge("W", "T"), g.edge("W", "Y"), g.edge("T", "Y")

g.edge("IQ", "Educ", color="red"), g.edge("IQ", "Wage", color="red"), g.edge("Educ", "Wage", color="red")

g.edge("Crime", "Police", color="red"), g.edge("Crime", "Violence", color="red"), 
g.edge("Police", "Violence", color="blue")

g
```

### Code cell 13

```python
g = gr.Digraph()

g.edge("W", "Y"), g.edge("T", "Y")

g.edge("IQ", "Wage", color="red"), g.edge("Educ", "Wage", color="red")

g
```

### Code cell 14

```python
g = gr.Digraph()

g.node("W=w"), g.edge("T", "Y")
g.node("IQ=x"), g.edge("Educ", "Wage", color="red")

g
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
