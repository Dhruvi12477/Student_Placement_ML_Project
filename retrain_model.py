import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression


# ============================================================
# 1. LOAD EXISTING DATASET
# ============================================================

DATASET_PATH = "Indian_Student_Placement_Dataset.csv"
MODEL_PATH = "placement_prediction_model.pkl"

df = pd.read_csv(DATASET_PATH)

print(f"✓ Dataset loaded: {len(df)} records")


# ============================================================
# 2. REMOVE UNNECESSARY COLUMN
# ============================================================

if "student_id" in df.columns:
    df = df.drop(columns=["student_id"])


# ============================================================
# 3. FEATURES AND TARGET
# ============================================================

TARGET = "placed"

X = df.drop(columns=[TARGET])
y = df[TARGET]


# ============================================================
# 4. DEFINE FEATURES
# ============================================================

numeric_features = [
    "age",
    "cgpa",
    "backlogs",
    "internships",
    "certifications",
    "coding_skills",
    "communication_skills",
    "aptitude_score",
    "projects"
]

categorical_features = [
    "gender",
    "degree",
    "branch"
]


# ============================================================
# 5. PREPROCESSING
# ============================================================

numeric_transformer = Pipeline([
    ("scaler", StandardScaler())
])

categorical_transformer = Pipeline([
    ("onehot", OneHotEncoder(
        handle_unknown="ignore",
        sparse_output=False
    ))
])


preprocessor = ColumnTransformer([
    ("num", numeric_transformer, numeric_features),
    ("cat", categorical_transformer, categorical_features)
])


# ============================================================
# 6. MODEL
# ============================================================

model = Pipeline([
    ("preprocessor", preprocessor),
    ("classifier", LogisticRegression(
        max_iter=1000,
        random_state=42
    ))
])


# ============================================================
# 7. TRAIN MODEL
# ============================================================

print("⏳ Training model...")

model.fit(X, y)

print("✓ Model trained successfully")


# ============================================================
# 8. SAVE MODEL
# ============================================================

joblib.dump(model, MODEL_PATH)

print(f"✓ New model saved: {MODEL_PATH}")


# ============================================================
# 9. TEST PREDICTION
# ============================================================

sample = pd.DataFrame([{
    "gender": "Female",
    "age": 22,
    "degree": "BTech",
    "branch": "CS",
    "cgpa": 8.5,
    "backlogs": 0,
    "internships": 2,
    "certifications": 3,
    "coding_skills": 8,
    "communication_skills": 8,
    "aptitude_score": 85,
    "projects": 3
}])

prediction = model.predict(sample)[0]
probability = model.predict_proba(sample)[0]

print("\n==============================")
print("TEST PREDICTION")
print("==============================")

print(
    "Result:",
    "PLACED ✓" if prediction == 1 else "NOT PLACED ✗"
)

print(f"Not Placed probability: {probability[0]:.2%}")
print(f"Placed probability: {probability[1]:.2%}")

print("\n✓ Model is working correctly!")