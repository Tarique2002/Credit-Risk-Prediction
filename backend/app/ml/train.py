import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from catboost import CatBoostClassifier
from lightgbm import LGBMClassifier

from app.config import settings

def generate_synthetic_data(num_samples: int = 5000) -> pd.DataFrame:
    """Generates realistic synthetic credit risk data for training."""
    np.random.seed(42)
    
    # Generate numerical features
    income = np.random.exponential(scale=65000, size=num_samples) + 15000
    income = np.clip(income, 15000, 250000)
    
    savings_balance = income * np.random.uniform(0, 0.8, size=num_samples) * np.random.choice([0, 1], p=[0.2, 0.8], size=num_samples)
    savings_balance = np.clip(savings_balance, 0, 150000)
    
    employment_duration_months = np.random.randint(0, 240, size=num_samples)
    
    existing_loans_count = np.random.choice([0, 1, 2, 3, 4], p=[0.4, 0.3, 0.15, 0.1, 0.05], size=num_samples)
    
    total_debt = existing_loans_count * np.random.uniform(5000, 40000, size=num_samples)
    
    debt_to_income_ratio = total_debt / (income + 1.0)
    debt_to_income_ratio = np.clip(debt_to_income_ratio, 0.0, 1.8)
    
    payment_history_score = np.random.beta(a=5, b=1, size=num_samples) * 100
    payment_history_score = np.clip(payment_history_score, 30, 100)
    
    # Categorical features
    employment_status = np.random.choice(
        ["employed", "unemployed", "self_employed", "retired"],
        p=[0.70, 0.08, 0.12, 0.10],
        size=num_samples
    )
    
    # Formulate ground truth credit default probability
    # Base risk score calculation
    emp_risk = np.where(
        employment_status == "unemployed", 
        1.0, 
        np.where(employment_status == "self_employed", 0.05, 0.0)
    )
    risk_score = (
        0.35 * (1.0 - payment_history_score / 100.0) +
        0.25 * (debt_to_income_ratio / 1.5) +
        0.15 * (1.0 - np.minimum(savings_balance / 30000.0, 1.0)) +
        0.10 * (1.0 - np.minimum(employment_duration_months / 60.0, 1.0)) +
        0.15 * emp_risk
    )
    
    # Sigmoid scale mapping to probability of default
    prob_default = 1 / (1 + np.exp(-10 * (risk_score - 0.45)))
    
    # Generate labels (1 for default, 0 for clean loan)
    default = np.random.binomial(1, prob_default)
    
    data = pd.DataFrame({
        "income": income,
        "employment_status": employment_status,
        "employment_duration_months": employment_duration_months,
        "debt_to_income_ratio": debt_to_income_ratio,
        "payment_history_score": payment_history_score,
        "existing_loans_count": existing_loans_count,
        "total_debt": total_debt,
        "savings_balance": savings_balance,
        "default": default
    })
    
    return data

def train_and_select_best_model():
    """Trains 5 classifiers, evaluates metrics, selects the best model, and saves pipelines."""
    # Ensure artifacts directory exists
    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    
    print("Generating training dataset...")
    df = generate_synthetic_data(5000)
    
    # Split into features & target
    X = df.drop(columns=["default"])
    y = df["default"]
    
    # Strict Featurization Ordering: Split before fitting transformer
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    # Define preprocessing pipeline
    numerical_features = ["income", "employment_duration_months", "debt_to_income_ratio", "payment_history_score", "existing_loans_count", "total_debt", "savings_balance"]
    categorical_features = ["employment_status"]
    
    numerical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])
    
    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numerical_transformer, numerical_features),
            ("cat", categorical_transformer, categorical_features)
        ]
    )
    
    print("Pre-processing training features...")
    # Fit & Transform X_train, only transform X_test
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Get the feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_["cat"].named_steps["onehot"]
    encoded_cat_features = cat_encoder.get_feature_names_out(categorical_features).tolist()
    feature_names = numerical_features + encoded_cat_features
    
    # Initialize classifiers
    models_dict = {
        "Logistic_Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Random_Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "XGBoost": XGBClassifier(use_label_encoder=False, eval_metric="logloss", random_state=42),
        "CatBoost": CatBoostClassifier(verbose=0, random_state=42),
        "LightGBM": LGBMClassifier(random_state=42, verbose=-1)
    }
    
    metrics_summary = {}
    best_roc_auc = 0.0
    best_model_name = None
    best_model_instance = None
    
    print("Training models...")
    for name, clf in models_dict.items():
        # Fit on transformed features
        clf.fit(X_train_proc, y_train)
        
        # Predict test labels & probabilities
        y_pred = clf.predict(X_test_proc)
        y_prob = clf.predict_proba(X_test_proc)[:, 1]
        
        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc = roc_auc_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()
        
        metrics_summary[name] = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "roc_auc": float(auc),
            "confusion_matrix": cm
        }
        
        print(f"Model: {name} | ROC-AUC: {auc:.4f} | F1-Score: {f1:.4f}")
        
        # Selection of best model
        if auc > best_roc_auc:
            best_roc_auc = auc
            best_model_name = name
            best_model_instance = clf
            
    print(f"\nBest Model Selected: {best_model_name} with ROC-AUC {best_roc_auc:.4f}")
    
    # Save the files
    joblib.dump(preprocessor, os.path.join(settings.MODEL_DIR, "preprocessor.joblib"))
    joblib.dump(best_model_instance, os.path.join(settings.MODEL_DIR, f"model.joblib"))
    
    # Keep historical record of feature names
    joblib.dump(feature_names, os.path.join(settings.MODEL_DIR, "feature_names.joblib"))
    
    # Save training dataset to monitor drift later
    X_train.to_csv(os.path.join(settings.MODEL_DIR, "baseline_features.csv"), index=False)
    
    # Write model performance JSON
    performance_metadata = {
        "best_model": best_model_name,
        "metrics": metrics_summary,
        "trained_at": pd.Timestamp.now().isoformat(),
        "model_version": "1.0.0"
    }
    
    with open(os.path.join(settings.MODEL_DIR, "metrics.json"), "w") as f:
        json.dump(performance_metadata, f, indent=4)
        
    print("Training pipeline run completed successfully. Artifacts saved.")
    return performance_metadata

if __name__ == "__main__":
    train_and_select_best_model()
