# Accuracy brief — 13 - Difference-in-Differences

- Notebook: `13-Difference-in-Differences.ipynb`
- Cells: 17 (code 8)
- Data files: data/billboard_impact.csv
- Image outputs: 2

## Headings

# 13 - Difference-in-Differences
## Three Billboards in the South of Brazil
## DID Estimator
## Non Parallel Trends
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


%matplotlib inline

style.use("fivethirtyeight")
```

### Code cell 2

```python
data = pd.read_csv("data/billboard_impact.csv")
data.head()
```

```text
deposits  poa  jul
0        42    1    0
1         0    1    0
2        52    1    0
3       119    1    0
4        21    1    0
```

### Code cell 3

```python
poa_before = data.query("poa==1 & jul==0")["deposits"].mean()

poa_after = data.query("poa==1 & jul==1")["deposits"].mean()

poa_after - poa_before
```

```text
41.04775
```

### Code cell 4

```python
fl_after = data.query("poa==0 & jul==1")["deposits"].mean()
poa_after - fl_after
```

```text
-119.10175000000001
```

### Code cell 5

```python
fl_before = data.query("poa==0 & jul==0")["deposits"].mean()

diff_in_diff = (poa_after-poa_before)-(fl_after-fl_before)
diff_in_diff
```

```text
6.524557692307688
```

### Code cell 6

```python
plt.figure(figsize=(10,5))
plt.plot(["May", "Jul"], [fl_before, fl_after], label="FL", lw=2)
plt.plot(["May", "Jul"], [poa_before, poa_after], label="POA", lw=2)

plt.plot(["May", "Jul"], [poa_before, poa_before+(fl_after-fl_before)],
         label="Counterfactual", lw=2, color="C2", ls="-.")

plt.legend();
```

### Code cell 7

```python
smf.ols('deposits ~ poa*jul', data=data).fit().summary().tables[1]
```

### Code cell 8

```python
plt.figure(figsize=(10,5))
x = ["Jan", "Mar", "May", "Jul"]

plt.plot(x, [120, 150, fl_before,  fl_after], label="FL", lw=2)
plt.plot(x, [60, 50, poa_before, poa_after], label="POA", lw=2)

plt.plot(["May", "Jul"], [poa_before, poa_before+(fl_after-fl_before)], label="Counterfactual", lw=2, color="C2", ls="-.")

plt.legend();
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
