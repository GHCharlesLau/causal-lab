# Accuracy brief — 02 - Randomised Experiments

- Notebook: `02-Randomised-Experiments.ipynb`
- Cells: 6 (code 2)
- Data files: data/online_classroom.csv
- Image outputs: 0

## Headings

# 02 - Randomised Experiments
## The Gold Standard
## In a School Far, Far Away
## The Ideal Experiment
## The Assignment Mechanism
## Key Ideas
## References
## Contribute

## Code and printed output

### Code cell 1

```python
import pandas as pd
import numpy as np

data = pd.read_csv("./data/online_classroom.csv")
print(data.shape)
data.head()
```

```text
(323, 10)

gender  asian  black  hawaiian  hispanic  unknown  white  format_ol  \
0       0    0.0    0.0       0.0       0.0      0.0    1.0          0   
1       1    0.0    0.0       0.0       0.0      0.0    1.0          0   
2       1    0.0    0.0       0.0       0.0      0.0    1.0          0   
3       1    0.0    0.0       0.0       0.0      0.0    1.0          0   
4       1    0.0    0.0       0.0       0.0      0.0    1.0          1   

   format_blended  falsexam  
0             0.0  63.29997  
1             0.0  79.96000  
2             1.0  83.37000  
3             1.0  90.01994  
4             0.0  83.30000
```

### Code cell 2

```python
(data
 .assign(class_format = np.select(
     [data["format_ol"].astype(bool), data["format_blended"].astype(bool)],
     ["online", "blended"],
     default="face_to_face"
 ))
 .groupby(["class_format"])
 .mean())
```

```text
gender     asian     black  hawaiian  hispanic   unknown  \
class_format                                                               
blended       0.550459  0.217949  0.102564  0.025641  0.012821  0.012821   
face_to_face  0.633333  0.202020  0.070707  0.000000  0.010101  0.000000   
online        0.542553  0.228571  0.028571  0.014286  0.028571  0.000000   

                 white  format_ol  format_blended   falsexam  
class_format                                                  
blended       0.628205        0.0             1.0  77.093731  
face_to_face  0.717172        0.0             0.0  78.547485  
online        0.700000        1.0             0.0  73.635263
```


## Reproduction gate

- Recompute every numeric claim used on the page from this notebook/data.
- Add a Node test for the arithmetic and a CDP test for the interaction.
- Record any deviation in the page's source note; never round a number silently.
