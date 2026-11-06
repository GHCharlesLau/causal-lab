# Accuracy brief — 01 - Introduction To Causality

- Notebook: `01-Introduction-To-Causality.ipynb`
- Cells: 10 (code 5)
- Data files: —
- Image outputs: 2

## Headings

# 01 - Introduction To Causality
## Why Bother?
## Data Science is Not What it Used to Be (or it Finally Is)
## Answering a Different Kind of Question
## When Association IS Causation
## Bias
## Key Ideas
## References
## Contribute

## Code and printed output

### Code cell 1

```python
import pandas as pd
import numpy as np
from scipy.special import expit
import seaborn as sns
from matplotlib import pyplot as plt
from matplotlib import style

style.use("fivethirtyeight")

np.random.seed(123)
n = 100
tuition = np.random.normal(1000, 300, n).round()
tablet = np.random.binomial(1, expit((tuition - tuition.mean()) / tuition.std())).astype(bool)
enem_score = np.random.normal(200 - 50 * tablet + 0.7 * tuition, 200)
enem_score = (enem_score - enem_score.min()) / enem_score.max()
enem_score *= 1000

data = pd.DataFrame(dict(enem_score=enem_score, Tuition=tuition, Tablet=tablet))
```

### Code cell 2

```python
plt.figure(figsize=(6,8))
sns.boxplot(y="enem_score", x="Tablet", data=data).set_title('ENEM score by Tablet in Class')
plt.show()
```

### Code cell 3

```python
pd.DataFrame(dict(
    i= [1,2,3,4],
    Y0=[500,600,800,700],
    Y1=[450,600,600,750],
    T= [0,0,1,1],
    Y= [500,600,600,750],
    TE=[-50,0,-200,50],
))
```

```text
i   Y0   Y1  T    Y   TE
0  1  500  450  0  500  -50
1  2  600  600  0  600    0
2  3  800  600  1  600 -200
3  4  700  750  1  750   50
```

### Code cell 4

```python
pd.DataFrame(dict(
    i= [1,2,3,4],
    Y0=[500,600,np.nan,np.nan],
    Y1=[np.nan,np.nan,600,750],
    T= [0,0,1,1],
    Y= [500,600,600,750],
    TE=[np.nan,np.nan,np.nan,np.nan],
))
```

```text
i     Y0     Y1  T    Y  TE
0  1  500.0    NaN  0  500 NaN
1  2  600.0    NaN  0  600 NaN
2  3    NaN  600.0  1  600 NaN
3  4    NaN  750.0  1  750 NaN
```

### Code cell 5

```python
plt.figure(figsize=(10,6))
sns.scatterplot(x="Tuition", y="enem_score", hue="Tablet", data=data, s=70).set_title('ENEM score by Tuition Cost')
plt.show()
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
