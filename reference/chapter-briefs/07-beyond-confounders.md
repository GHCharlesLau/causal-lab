# Accuracy brief — 07 - Beyond Confounders

- Notebook: `07-Beyond-Confounders.ipynb`
- Cells: 46 (code 24)
- Data files: data/collections_email.csv, data/hospital_treatment.csv
- Image outputs: 3

## Headings

# 07 - Beyond Confounders
## Good Controls
## Mostly Harmful Controls
## Bad Controls - Selection Bias
### Bad COP
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

style.use("fivethirtyeight")
```

### Code cell 2

```python
data = pd.read_csv("./data/collections_email.csv")
data.head()
```

```text
payments  email  opened  agreement  credit_limit  risk_score
0       740      1     1.0        0.0   2348.495260    0.666752
1       580      1     1.0        1.0    334.111969    0.207395
2       600      1     1.0        1.0   1360.660722    0.550479
3       770      0     0.0        0.0   1531.828576    0.560488
4       660      0     0.0        0.0    979.855647    0.455140
```

### Code cell 3

```python
print("Difference in means:",
      data.query("email==1")["payments"].mean() - data.query("email==0")["payments"].mean())

model = smf.ols('payments ~ email', data=data).fit()
model.summary().tables[1]
```

```text
Difference in means: -0.6202804021329484
```

### Code cell 4

```python
sns.scatterplot(x="email", y="payments", 
                alpha=0.8,
                data=data.assign(email=data["email"] + np.random.normal(0, 0.01, size=len(data["email"]))))
plt.plot(np.linspace(-0.2, 1.2), model.params[0] + np.linspace(-1, 2) * model.params[1], c="C1")
plt.xlabel("Email")
plt.ylabel("Payments");
```

### Code cell 5

```python
model_email = smf.ols('email ~ credit_limit + risk_score', data=data).fit()
model_payments = smf.ols('payments ~ credit_limit + risk_score', data=data).fit()

residuals = pd.DataFrame(dict(res_payments=model_payments.resid, res_email=model_email.resid))

model_treatment = smf.ols('res_payments ~ res_email', data=residuals).fit()
```

### Code cell 6

```python
print("Payments Variance", np.var(data["payments"]))
print("Payments Residual Variance", np.var(residuals["res_payments"]))

print("Email Variance", np.var(data["email"]))
print("Email Residual Variance", np.var(residuals["res_email"]))

model_treatment.summary().tables[1]
```

```text
Payments Variance 10807.612416
Payments Residual Variance 5652.453558466207
Email Variance 0.24991536
Email Residual Variance 0.24918421069820032
```

### Code cell 7

```python
sns.scatterplot(x="res_email", y="res_payments", data=residuals)
plt.plot(np.linspace(-0.7, 1), model_treatment.params[0] + np.linspace(-1, 2) * model_treatment.params[1], c="C1")
plt.xlabel("Email Residuals")
plt.ylabel("Payments Residuals");
```

### Code cell 8

```python
model_2 = smf.ols('payments ~ email + credit_limit + risk_score', data=data).fit()
model_2.summary().tables[1]
```

### Code cell 9

```python
g = gr.Digraph()
g.edge("X", "Y"), g.edge("T", "Y")
g.node("T", color="gold")

g.node("email", color="gold")
g.edge("credit_limit", "payments")
g.edge("risk_score", "payments")
g.edge("email", "payments")

g
```

### Code cell 10

```python
hospital = pd.read_csv("./data/hospital_treatment.csv")
hospital.head()
```

```text
hospital  treatment   severity  days
0         1          1  29.686618    82
1         1          1  20.050340    57
2         1          1  20.302399    49
3         0          0  10.603118    44
4         0          0   8.332793    15
```

### Code cell 11

```python
hosp_1 = smf.ols('days ~ treatment', data=hospital).fit()
hosp_1.summary().tables[1]
```

### Code cell 12

```python
hosp_2 = smf.ols('days ~ treatment', data=hospital.query("hospital==0")).fit()
hosp_2.summary().tables[1]
```

### Code cell 13

```python
hosp_3 = smf.ols('days ~ treatment', data=hospital.query("hospital==1")).fit()
hosp_3.summary().tables[1]
```

### Code cell 14

```python
hosp_4 = smf.ols('days ~ treatment + severity', data=hospital).fit()
hosp_4.summary().tables[1]
```

### Code cell 15

```python
hosp_5 = smf.ols('days ~ treatment + severity + hospital', data=hospital).fit()
hosp_5.summary().tables[1]
```

### Code cell 16

```python
model_treatment = smf.ols('treatment ~ severity + hospital', data=hospital).fit()
model_days = smf.ols('days ~ severity + hospital', data=hospital).fit()

residuals = pd.DataFrame(dict(res_days=model_days.resid, res_treatment=model_treatment.resid))

model_treatment = smf.ols('res_days ~ res_treatment', data=residuals).fit()

model_treatment.summary().tables[1]
```

### Code cell 17

```python
print("Treatment Variance", np.var(hospital["treatment"]))
print("Treatment Residual Variance", np.var(residuals["res_treatment"]))
```

```text
Treatment Variance 0.234375
Treatment Residual Variance 0.05752909187211906
```

### Code cell 18

```python
sigma_hat = sum(model_treatment.resid**2)/(len(model_treatment.resid)-2)
var = sigma_hat/sum((residuals["res_treatment"] - residuals["res_treatment"].mean())**2)
print("SE of the Coeficient:", np.sqrt(var))
```

```text
SE of the Coeficient: 3.446973767486901
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
