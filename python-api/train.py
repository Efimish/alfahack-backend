import pandas as pd
from catboost import CatBoostClassifier

data = pd.read_csv(filepath_or_buffer="data.csv")
x, y = data.drop("Risk", axis=1), data.Risk

model = CatBoostClassifier()
model = model.fit(x, y)
model.save_model("classification.cbm", format="cbm")
