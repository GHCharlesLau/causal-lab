# Accuracy brief — 10 - Matching

- Notebook: `10-Matching.ipynb`
- Cells: 36 (code 17)
- Data files: data/medicine_impact_recovery.csv, data/trainees.csv
- Image outputs: 0

## Headings

# 10 - Matching
## What is Regression Doing After All?
## The Subclassification Estimator
## Matching Estimator
## Matching Bias
## The Curse of Dimensionality
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

%matplotlib inline

style.use("fivethirtyeight")
```

### Code cell 2

```python
drug_example = pd.DataFrame(dict(
    sex= ["M","M","M","M","M","M", "W","W","W","W"],
    drug=[1,1,1,1,1,0,  1,0,1,0],
    days=[5,5,5,5,5,8,  2,4,2,4]
))
```

### Code cell 3

```python
drug_example.query("drug==1")["days"].mean() - drug_example.query("drug==0")["days"].mean()
```

```text
-1.1904761904761898
```

### Code cell 4

```python
smf.ols('days ~ drug + C(sex)', data=drug_example).fit().summary().tables[1]
```

### Code cell 5

```python
trainee = pd.read_csv("./data/trainees.csv")
trainee.query("trainees==1")
```

```text
unit  trainees  age  earnings
0      1         1   28     17700
1      2         1   34     10200
2      3         1   29     14400
3      4         1   25     20800
4      5         1   29      6100
5      6         1   23     28600
6      7         1   33     21900
7      8         1   27     28800
8      9         1   31     20300
9     10         1   26     28100
10    11         1   25      9400
11    12         1   27     14300
12    13         1   29     12500
13    14         1   24     19700
14    15         1   25     10100
15    16         1   43     10700
16    17         1   28     11500
...
```

### Code cell 6

```python
trainee.query("trainees==0")
```

```text
unit  trainees  age  earnings
19    20         0   43     20900
20    21         0   50     31000
21    22         0   30     21000
22    23         0   27      9300
23    24         0   54     41100
24    25         0   48     29800
25    26         0   39     42000
26    27         0   28      8800
27    28         0   24     25500
28    29         0   33     15500
29    31         0   26       400
30    32         0   31     26600
31    33         0   26     16500
32    34         0   34     24200
33    35         0   25     23300
34    36         0   24      9700
35    37         0   29      6200
...
```

### Code cell 7

```python
trainee.query("trainees==1")["earnings"].mean() - trainee.query("trainees==0")["earnings"].mean()
```

```text
-4297.49373433584
```

### Code cell 8

```python
# make dataset where no one has the same age
unique_on_age = (trainee
                 .query("trainees==0")
                 .drop_duplicates("age"))

matches = (trainee
           .query("trainees==1")
           .merge(unique_on_age, on="age", how="left", suffixes=("_t_1", "_t_0"))
           .assign(t1_minuts_t0 = lambda d: d["earnings_t_1"] - d["earnings_t_0"]))

matches.head(7)
```

```text
unit_t_1  trainees_t_1  age  earnings_t_1  unit_t_0  trainees_t_0  \
0         1             1   28         17700        27             0   
1         2             1   34         10200        34             0   
2         3             1   29         14400        37             0   
3         4             1   25         20800        35             0   
4         5             1   29          6100        37             0   
5         6             1   23         28600        40             0   
6         7             1   33         21900        29             0   

   earnings_t_0  t1_minuts_t0  
0          8800          8900  
1         24200        -14000  
2          6200          8200  
3         23300         -2500  
4          6200          -100  
5          9500         19100  
6         15500          6400
```

### Code cell 9

```python
matches["t1_minuts_t0"].mean()
```

```text
2457.8947368421054
```

### Code cell 10

```python
med = pd.read_csv("./data/medicine_impact_recovery.csv")
med.head()
```

```text
sex        age  severity  medication  recovery
0    0  35.049134  0.887658           1        31
1    1  41.580323  0.899784           1        49
2    1  28.127491  0.486349           0        38
3    1  36.375033  0.323091           0        35
4    0  25.091717  0.209006           0        15
```

### Code cell 11

```python
med.query("medication==1")["recovery"].mean() - med.query("medication==0")["recovery"].mean()
```

```text
16.895799546498726
```

### Code cell 12

```python
# scale features
X = ["severity", "age", "sex"]
y = "recovery"

med = med.assign(**{f: (med[f] - med[f].mean())/med[f].std() for f in X})
med.head()
```

```text
sex       age  severity  medication  recovery
0 -0.996980  0.280787  1.459800           1        31
1  1.002979  0.865375  1.502164           1        49
2  1.002979 -0.338749  0.057796           0        38
3  1.002979  0.399465 -0.512557           0        35
4 -0.996980 -0.610473 -0.911125           0        15
```

### Code cell 13

```python
from sklearn.neighbors import KNeighborsRegressor

treated = med.query("medication==1")
untreated = med.query("medication==0")

mt0 = KNeighborsRegressor(n_neighbors=1).fit(untreated[X], untreated[y])
mt1 = KNeighborsRegressor(n_neighbors=1).fit(treated[X], treated[y])

predicted = pd.concat([
    # find matches for the treated looking at the untreated knn model
    treated.assign(match=mt0.predict(treated[X])),
    
    # find matches for the untreated looking at the treated knn model
    untreated.assign(match=mt1.predict(untreated[X]))
])

predicted.head()
```

```text
sex       age  severity  medication  recovery  match
0  -0.996980  0.280787  1.459800           1        31   39.0
1   1.002979  0.865375  1.502164           1        49   52.0
7  -0.996980  1.495134  1.268540           1        38   46.0
10  1.002979 -0.106534  0.545911           1        34   45.0
16 -0.996980  0.043034  1.428732           1        30   39.0
```

### Code cell 14

```python
np.mean((2*predicted["medication"] - 1)*(predicted["recovery"] - predicted["match"]))
```

```text
-0.9954
```

### Code cell 15

```python
from sklearn.linear_model import LinearRegression

# fit the linear regression model to estimate mu_0(x)
ols0 = LinearRegression().fit(untreated[X], untreated[y])
ols1 = LinearRegression().fit(treated[X], treated[y])

# find the units that match to the treated
treated_match_index = mt0.kneighbors(treated[X], n_neighbors=1)[1].ravel()

# find the units that match to the untreatd
untreated_match_index = mt1.kneighbors(untreated[X], n_neighbors=1)[1].ravel()

predicted = pd.concat([
    (treated
     # find the Y match on the other group
     .assign(match=mt0.predict(treated[X])) 
     
     # build the bias correction term
     .assign(bias_correct=ols0.predict(treated[X]) - ols0.predict(untreated.iloc[treated_match_index][X]))),
    (untreated
     .assign(match=mt1.predict(untreated[X]))
     .assign(bias_correct=ols1.predict(untreated[X]) - ols1.predict(treated.iloc[untreated_match_index][X])))
# ...
```

```text
sex       age  severity  medication  recovery  match  bias_correct
0  -0.996980  0.280787  1.459800           1        31   39.0      4.404034
1   1.002979  0.865375  1.502164           1        49   52.0     12.915348
7  -0.996980  1.495134  1.268540           1        38   46.0      1.871428
10  1.002979 -0.106534  0.545911           1        34   45.0     -0.496970
16 -0.996980  0.043034  1.428732           1        30   39.0      2.610159
```

### Code cell 16

```python
np.mean((2*predicted["medication"] - 1)*((predicted["recovery"] - predicted["match"])-predicted["bias_correct"]))
```

```text
-7.36266090614141
```

### Code cell 17

```python
from causalinference import CausalModel

cm = CausalModel(
    Y=med["recovery"].values, 
    D=med["medication"].values, 
    X=med[["severity", "age", "sex"]].values
)

cm.est_via_matching(matches=1, bias_adj=True)

print(cm.estimates)
```

```text
Treatment Effect Estimates: Matching

                     Est.       S.e.          z      P>|z|      [95% Conf. int.]
--------------------------------------------------------------------------------
           ATE     -7.709      0.609    -12.649      0.000     -8.903     -6.514
           ATC     -6.665      0.246    -27.047      0.000     -7.148     -6.182
           ATT     -9.679      1.693     -5.717      0.000    -12.997     -6.361
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
