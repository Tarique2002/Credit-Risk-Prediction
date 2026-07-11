import os
import numpy as np
import pandas as pd
from typing import Dict, List, Any
from app.config import settings

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_bins: int = 10) -> float:
    """Calculates the Population Stability Index (PSI) between two distributions."""
    # Eliminate nulls
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0
        
    # Get quantiles from expected distribution to define bin boundaries
    percentiles = np.linspace(0, 100, num_bins + 1)
    bins = np.percentile(expected, percentiles)
    
    # Adjust boundaries slightly to avoid bin issues
    bins[0] -= 1e-5
    bins[-1] += 1e-5
    # Ensure bins are strictly increasing (for duplicate percentiles, add tiny noise)
    for i in range(1, len(bins)):
        if bins[i] <= bins[i-1]:
            bins[i] = bins[i-1] + 1e-5
            
    # Calculate count of elements in each bin
    expected_counts, _ = np.histogram(expected, bins=bins)
    actual_counts, _ = np.histogram(actual, bins=bins)
    
    # Convert to fractions
    expected_pct = expected_counts / len(expected)
    actual_pct = actual_counts / len(actual)
    
    # Handle zero probability bins (impute tiny value)
    expected_pct = np.where(expected_pct == 0, 0.0001, expected_pct)
    actual_pct = np.where(actual_pct == 0, 0.0001, actual_pct)
    
    # Calculate PSI
    psi_value = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return float(psi_value)

def calculate_categorical_psi(expected: List[Any], actual: List[Any]) -> float:
    """Calculates PSI for categorical fields by comparing class percentages."""
    exp_series = pd.Series(expected).value_counts(normalize=True)
    act_series = pd.Series(actual).value_counts(normalize=True)
    
    # Get union of categories
    all_categories = list(set(exp_series.index).union(set(act_series.index)))
    
    psi_value = 0.0
    for cat in all_categories:
        e_pct = exp_series.get(cat, 0.0001)
        a_pct = act_series.get(cat, 0.0001)
        
        # Guard against absolute 0
        if e_pct == 0: e_pct = 0.0001
        if a_pct == 0: a_pct = 0.0001
        
        psi_value += (a_pct - e_pct) * np.log(a_pct / e_pct)
        
    return float(psi_value)

def analyze_feature_drift(recent_features: pd.DataFrame) -> Dict[str, Any]:
    """Compares recent request features against baseline training data to detect drift."""
    baseline_path = os.path.join(settings.MODEL_DIR, "baseline_features.csv")
    
    if not os.path.exists(baseline_path) or len(recent_features) < 10:
        # Default report if no baseline or too few recent records to calculate statistics
        return {
            "overall_psi": 0.0,
            "feature_drift": {},
            "drift_detected": False,
            "model_version": "1.0.0",
            "total_predictions_evaluated": len(recent_features),
            "message": "Insufficient data or missing baseline for drift analysis"
        }
        
    baseline_df = pd.read_csv(baseline_path)
    
    feature_drifts = {}
    overall_psi_sum = 0.0
    evaluated_features_count = 0
    
    # Check numerical columns
    num_cols = ["income", "employment_duration_months", "debt_to_income_ratio", "payment_history_score", "existing_loans_count", "total_debt", "savings_balance"]
    for col in num_cols:
        if col in recent_features.columns and col in baseline_df.columns:
            psi_val = calculate_psi(baseline_df[col].values, recent_features[col].values)
            
            if psi_val < 0.1:
                status = "No Drift"
            elif psi_val < 0.25:
                status = "Moderate Drift"
            else:
                status = "High Drift"
                
            feature_drifts[col] = {
                "psi": round(psi_val, 4),
                "drift_status": status
            }
            overall_psi_sum += psi_val
            evaluated_features_count += 1
            
    # Check categorical column
    cat_col = "employment_status"
    if cat_col in recent_features.columns and cat_col in baseline_df.columns:
        psi_val = calculate_categorical_psi(baseline_df[cat_col].tolist(), recent_features[cat_col].tolist())
        
        if psi_val < 0.1:
            status = "No Drift"
        elif psi_val < 0.25:
            status = "Moderate Drift"
        else:
            status = "High Drift"
            
        feature_drifts[cat_col] = {
            "psi": round(psi_val, 4),
            "drift_status": status
        }
        overall_psi_sum += psi_val
        evaluated_features_count += 1
        
    avg_psi = overall_psi_sum / evaluated_features_count if evaluated_features_count > 0 else 0.0
    
    # Check if any feature has high drift, or if the average is moderate/high
    high_drift_features = [f for f, metrics in feature_drifts.items() if metrics["drift_status"] == "High Drift"]
    drift_detected = len(high_drift_features) > 0 or avg_psi >= 0.25
    
    return {
        "overall_psi": round(avg_psi, 4),
        "feature_drift": feature_drifts,
        "drift_detected": drift_detected,
        "model_version": "1.0.0",
        "total_predictions_evaluated": len(recent_features)
    }
