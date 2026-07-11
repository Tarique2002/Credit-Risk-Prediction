import os
import joblib
import numpy as np
import pandas as pd
import shap
from typing import List, Dict, Any
from app.config import settings

# Global cache for explainer to optimize performance
_explainer_cache = None

def get_explainer_and_features():
    """Loads the trained model, preprocessor, and initializes a SHAP explainer."""
    global _explainer_cache
    
    model_path = os.path.join(settings.MODEL_DIR, "model.joblib")
    preproc_path = os.path.join(settings.MODEL_DIR, "preprocessor.joblib")
    features_path = os.path.join(settings.MODEL_DIR, "feature_names.joblib")
    
    if not (os.path.exists(model_path) and os.path.exists(preproc_path) and os.path.exists(features_path)):
        return None, None, None
        
    if _explainer_cache is not None:
        return _explainer_cache
        
    model = joblib.load(model_path)
    preprocessor = joblib.load(preproc_path)
    feature_names = joblib.load(features_path)
    
    # Initialize appropriate SHAP explainer based on model class name
    model_type = type(model).__name__
    
    # We use a subset of baseline data to initialize if needed
    baseline_path = os.path.join(settings.MODEL_DIR, "baseline_features.csv")
    if os.path.exists(baseline_path):
        baseline_df = pd.read_csv(baseline_path).iloc[:100]
        baseline_proc = preprocessor.transform(baseline_df)
    else:
        baseline_proc = np.zeros((10, len(feature_names)))
        
    try:
        if "Forest" in model_type or "XGB" in model_type or "CatBoost" in model_type or "LGBM" in model_type:
            # Tree models use TreeExplainer
            explainer = shap.TreeExplainer(model)
        elif "Logistic" in model_type:
            # Linear models
            explainer = shap.LinearExplainer(model, baseline_proc)
        else:
            # General fallback
            explainer = shap.Explainer(model, baseline_proc)
    except Exception as e:
        print(f"Error creating SHAP explainer: {e}. Falling back to general Explainer.")
        explainer = shap.Explainer(model, baseline_proc)
        
    _explainer_cache = (model, preprocessor, feature_names, explainer)
    return _explainer_cache

def explain_prediction(input_data: pd.DataFrame) -> Dict[str, Any]:
    """Computes SHAP feature importance for a single input record.
    
    Args:
        input_data: pd.DataFrame with single row containing raw features
        
    Returns:
        Dict containing expected base value, local prediction probability, and feature contributions.
    """
    model, preprocessor, feature_names, explainer = get_explainer_and_features()
    if explainer is None:
        # Fallback explanation if models aren't trained yet
        return mock_shap_explanation(input_data)
        
    try:
        # Transform the raw input features using the saved preprocessor
        X_proc = preprocessor.transform(input_data)
        
        # Compute default probability
        prob = float(model.predict_proba(X_proc)[0, 1])
        
        # Calculate SHAP values
        # For tree/linear explainers, output can differ based on model/library version.
        # We handle multi-class output (predict_proba has output shape [1, 2], we want class 1)
        shap_out = explainer(X_proc)
        
        # Extract SHAP values and base value
        # handle different SHAP output structures
        if hasattr(shap_out, "values"):
            s_vals = shap_out.values[0]
            base_val = shap_out.base_values[0] if np.isscalar(shap_out.base_values) else shap_out.base_values[0]
        else:
            s_vals = shap_out[0]
            base_val = explainer.expected_value
            
        # If output is multidimensional (class 0, class 1), extract class 1 (default)
        if isinstance(s_vals, np.ndarray) and len(s_vals.shape) > 1 and s_vals.shape[-1] == 2:
            s_vals = s_vals[:, 1]
            if isinstance(base_val, (list, np.ndarray)):
                base_val = base_val[1]
        elif isinstance(base_val, (list, np.ndarray)) and len(base_val) == 2:
            base_val = base_val[1]
            
        # Ensure base_val and s_vals are simple floats
        base_val = float(base_val) if not isinstance(base_val, (list, np.ndarray)) else float(base_val[0])
        
        # Gather preprocessed feature values (what the model actually saw)
        proc_values = X_proc[0]
        
        explanations = []
        for i, feat_name in enumerate(feature_names):
            val = float(proc_values[i])
            s_val = float(s_vals[i])
            
            # Map preprocessed names to friendly names
            friendly_name = feat_name.replace("num__", "").replace("cat__", "").replace("_", " ").title()
            
            # Categorize contribution
            if s_val > 0.01:
                contrib = "Increases Risk"
            elif s_val < -0.01:
                contrib = "Decreases Risk"
            else:
                contrib = "Neutral"
                
            explanations.append({
                "feature": friendly_name,
                "value": round(val, 2),
                "shap_value": round(s_val, 4),
                "contribution": contrib
            })
            
        # Sort explanations by absolute impact to focus on most important features
        explanations = sorted(explanations, key=lambda x: abs(x["shap_value"]), reverse=True)
        
        # Limit to top 8 most influential features for readability
        return {
            "base_value": base_val,
            "prediction_probability": prob,
            "shap_explanations": explanations[:8]
        }
    except Exception as e:
        print(f"Error computing SHAP values: {e}. Falling back to mock values.")
        return mock_shap_explanation(input_data)

def mock_shap_explanation(input_data: pd.DataFrame) -> Dict[str, Any]:
    """Generates mock/fallback SHAP explanations if models are not trained/loaded."""
    row = input_data.iloc[0]
    
    # Calculate dummy probability based on basic rules
    dti = float(row.get("debt_to_income_ratio", 0.3))
    score = float(row.get("payment_history_score", 90))
    savings = float(row.get("savings_balance", 10000))
    emp_status = str(row.get("employment_status", "employed"))
    
    prob = 0.15 + (dti * 0.3) - (score / 1000) - (savings / 200000)
    if emp_status == "unemployed":
        prob += 0.25
    prob = max(0.01, min(0.99, prob))
    
    # Create fake SHAP contributions
    explanations = [
        {"feature": "Payment History Score", "value": float(score), "shap_value": -0.15 if score > 80 else 0.20, "contribution": "Decreases Risk" if score > 80 else "Increases Risk"},
        {"feature": "Debt To Income Ratio", "value": float(dti), "shap_value": 0.18 if dti > 0.40 else -0.08, "contribution": "Increases Risk" if dti > 0.40 else "Decreases Risk"},
        {"feature": "Savings Balance", "value": float(savings), "shap_value": -0.12 if savings > 15000 else 0.05, "contribution": "Decreases Risk" if savings > 15000 else "Increases Risk"},
        {"feature": "Employment Status", "value": 0.0, "shap_value": 0.22 if emp_status == "unemployed" else -0.05, "contribution": "Increases Risk" if emp_status == "unemployed" else "Decreases Risk"},
        {"feature": "Income", "value": float(row.get("income", 50000)), "shap_value": -0.04, "contribution": "Decreases Risk"},
        {"feature": "Existing Loans Count", "value": float(row.get("existing_loans_count", 0)), "shap_value": 0.03, "contribution": "Increases Risk"}
    ]
    
    explanations = sorted(explanations, key=lambda x: abs(x["shap_value"]), reverse=True)
    
    return {
        "base_value": 0.35,
        "prediction_probability": prob,
        "shap_explanations": explanations
    }
