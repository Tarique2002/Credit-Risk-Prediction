from typing import Dict, Any, List

def calculate_credit_score(
    default_probability: float,
    payment_history_score: float,
    debt_to_income_ratio: float,
    savings_balance: float,
    existing_loans_count: int,
    income: float
) -> Dict[str, Any]:
    """Calculates a simulated FICO-style credit score (300-850) and returns tier & suggestions."""
    # Map probability of default to FICO baseline: 850 (probability 0) to 300 (probability 1)
    base_score = 850 - (default_probability * 550)
    
    # Apply adjustments based on financial health indicators
    adjustments = 0
    
    # 1. Payment history (normally 35% of FICO score)
    if payment_history_score >= 95:
        adjustments += 40
    elif payment_history_score >= 90:
        adjustments += 15
    elif payment_history_score < 70:
        adjustments -= 60
    elif payment_history_score < 80:
        adjustments -= 30
        
    # 2. Debt utilization & DTI (normally 30% of FICO score)
    if debt_to_income_ratio <= 0.15:
        adjustments += 30
    elif debt_to_income_ratio <= 0.35:
        adjustments += 10
    elif debt_to_income_ratio > 0.50:
        adjustments -= 50
    elif debt_to_income_ratio > 0.40:
        adjustments -= 25
        
    # 3. Savings buffer / liquidity
    if savings_balance >= 50000:
        adjustments += 30
    elif savings_balance >= 20000:
        adjustments += 15
    elif savings_balance < 2000:
        adjustments -= 30
        
    # 4. Total Debt burden
    if existing_loans_count >= 3:
        adjustments -= 20
        
    final_score = int(base_score + adjustments)
    # Clamp FICO scores strictly between 300 and 850
    final_score = max(300, min(850, final_score))
    
    # Map credit score range to risk tier
    if final_score >= 780:
        risk_category = "Very Low"
        risk_score = 100 - ((final_score - 780) / 70 * 20 + 80) # 0-20 scale
        recommendation = "Approve"
    elif final_score >= 700:
        risk_category = "Low"
        recommendation = "Approve"
    elif final_score >= 620:
        risk_category = "Medium"
        # Medium risk recommendation depends on DTI and payment score
        if debt_to_income_ratio <= 0.40 and payment_history_score >= 85:
            recommendation = "Approve"
        else:
            recommendation = "Reject"
    elif final_score >= 500:
        risk_category = "High"
        recommendation = "Reject"
    else:
        risk_category = "Very High"
        recommendation = "Reject"
        
    # Formulate suggestions
    suggestions = []
    if payment_history_score < 95:
        suggestions.append("Set up automated calendar alerts or autopay to build a 100% on-time payment track record.")
    if debt_to_income_ratio > 0.35:
        suggestions.append("Focus on paying down high-interest credit card debt or consolidate outstanding balances to reduce your DTI below 35%.")
    if savings_balance < (income * 0.15):
        suggestions.append(f"Aim to deposit surplus income monthly into a high-yield savings account until you reach a 3-to-6 month living expense reserve.")
    if existing_loans_count >= 2:
        suggestions.append("Limit opening new lines of credit or loans to lower your credit inquiries and average credit history age.")
        
    if not suggestions:
        suggestions.append("Maintain your excellent financial behaviors to keep your score optimized.")
        
    return {
        "credit_score": final_score,
        "risk_category": risk_category,
        "recommendation": recommendation,
        "suggestions": suggestions
    }
