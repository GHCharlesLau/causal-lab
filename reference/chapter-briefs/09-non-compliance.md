# Accuracy brief — 09 - Non Compliance and LATE

- Notebook: `09-Non-Compliance-and-LATE.ipynb`
- Cells: 17 (code 8)
- Data files: data/app_engagement_push.csv
- Image outputs: 0

## Headings

# 09 - Non Compliance and LATE
## Dipping our Toes into a Heterogeneous World
## Local Average Treatment Effect: LATE
## Effect on Engagement
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
from linearmodels.iv import IV2SLS
import graphviz as gr

%matplotlib inline

style.use("fivethirtyeight")
```

### Code cell 2

```python
g = gr.Digraph()

g.edge("push assigned", "push delivered")
g.edge("push delivered", "in app purchase")
g.edge("income", "in app purchase")
g.edge("income", "push delivered")
g.node("income", color="blue")
g
```

### Code cell 3

```python
g = gr.Digraph()

g.node("push assigned")
g.edge("push delivered", "in app purchase")
g.edge("income", "in app purchase")
g.edge("income", "push delivered")
g.node("income", color="blue")
g
```

### Code cell 4

```python
data = pd.read_csv("./data/app_engagement_push.csv")
    
data.head()
```

```text
in_app_purchase  push_assigned  push_delivered
0               47              1               1
1               43              1               0
2               51              1               1
3               49              0               0
4               79              0               0
```

### Code cell 5

```python
ols = IV2SLS.from_formula("in_app_purchase ~ 1 + push_assigned + push_delivered", data).fit()
ols.summary.tables[1]
```

### Code cell 6

```python
first_stage = IV2SLS.from_formula("push_delivered ~ 1 + push_assigned", data).fit()
first_stage.summary.tables[1]
```

### Code cell 7

```python
reduced_form = IV2SLS.from_formula("in_app_purchase ~ 1 + push_assigned", data).fit()
reduced_form.summary.tables[1]
```

### Code cell 8

```python
iv = IV2SLS.from_formula("in_app_purchase ~ 1 + [push_delivered ~ push_assigned]", data).fit()
iv.summary.tables[1]
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
