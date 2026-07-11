import google.generativeai as genai
from typing import Dict, Any, Optional
from app.config import settings

# Initialize Gemini Client if key is available
has_gemini = False
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        has_gemini = True
    except Exception as e:
        print(f"Error configuring Gemini client: {e}")

def get_gemini_response(prompt: str) -> str:
    """Invokes the Gemini model to get responses."""
    if not has_gemini:
        return ""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        return ""

def explain_decision(
    first_name: str,
    last_name: str,
    probability: float,
    credit_score: int,
    risk_category: str,
    recommendation: str,
    income: float,
    dti: float,
    history_score: float,
    fraud_flags: list[str],
    question: Optional[str] = None
) -> str:
    """Explains a credit prediction decision or answers user questions using Gemini or local fallback."""
    
    prompt = f"""
You are a Senior Risk Analyst and Executive Credit Officer at an enterprise bank.
You need to analyze the following loan application and provide a clear, professional risk analysis.

Customer Name: {first_name} {last_name}
Default Probability: {probability * 100:.1f}%
Credit Score: {credit_score}
Risk Category: {risk_category}
System Recommendation: {recommendation}
Annual Income: ${income:,.2f}
Debt to Income (DTI) Ratio: {dti:.2f}
Payment History Score: {history_score:.1f}/100
Fraud Indicators Flagged: {', '.join(fraud_flags) if fraud_flags else 'None'}

User Question: {question if question else 'Please provide an executive summary and explain why the system recommended ' + recommendation + '.'}

Provide your analysis in clean Markdown. Start directly with the analysis. Keep it concise, professional, and actionable. Include:
1. Decision Rationale: Clear explanation of why the credit decision was reached.
2. Risk Analysis: Specific risk factors (DTI, income stability, payment scores).
3. Mitigation Plan/Next Steps: Recommendations for what the customer or broker can do.
"""
    
    if has_gemini:
        response_text = get_gemini_response(prompt)
        if response_text:
            return response_text
            
    # Professional Local Fallback generator
    reasons = []
    mitigations = []
    
    if recommendation == "Reject":
        reasons.append(f"The default risk probability is elevated at {probability*100:.1f}% (Risk Category: {risk_category}).")
        if dti > 0.45:
            reasons.append(f"The Debt-To-Income (DTI) ratio is high ({dti:.2f}), suggesting that the applicant may struggle to support additional debt obligations.")
        if history_score < 80:
            reasons.append(f"A history of late payments is present (Score: {history_score:.1f}/100), reflecting increased delinquency risk.")
        if fraud_flags:
            reasons.append(f"Fraud detection alerts were raised: {', '.join(fraud_flags)}.")
            
        mitigations.append("Apply with a co-signer of stronger credit standing.")
        mitigations.append("Reduce total debt load to bring the Debt-To-Income (DTI) ratio below 40%.")
        mitigations.append("Allow a minimum of 6 months of consecutive on-time payments to rebuild credit history.")
    else:
        reasons.append(f"The application exhibits low default probability ({probability*100:.1f}%) and a strong credit score ({credit_score}).")
        if dti < 0.30:
            reasons.append(f"A comfortable Debt-To-Income (DTI) ratio of {dti:.2f} leaves sufficient disposable income.")
        if history_score > 90:
            reasons.append("Excellent historical payment compliance reflects low default risk.")
            
        mitigations.append("Proceed with regular underwriting validation checks.")
        mitigations.append("Offer competitive tier-1 interest pricing to retain customer loyalty.")
        
    reasons_md = "\n".join([f"- {r}" for r in reasons])
    mitigations_md = "\n".join([f"- {m}" for m in mitigations])
    
    fallback_text = f"""### Executive Risk Analysis ({recommendation} Recommended)

**Applicant Profile Summary:**
Applicant **{first_name} {last_name}** reports an annual income of **${income:,.2f}** with an active debt-to-income ratio of **{dti:.2f}** and a payment score of **{history_score:.1f}/100**. The system has calculated a default probability of **{probability*100:.1f}%**, leading to a credit score of **{credit_score}** ({risk_category} Risk).

#### 1. Decision Rationale
The system issued a **{recommendation.upper()}** recommendation based on the following key metrics:
{reasons_md}

#### 2. Risk Evaluation
- **Liquidity Check**: The applicant's debt load is {'highly structured' if dti > 0.4 else 'within comfortable limits'}. 
- **Historical Stability**: Payment performance score of {history_score:.1f}% indicates {'excellent compliance' if history_score > 90 else 'moderate to high volatility'}.
- **Security Check**: {'No immediate duplicate or synthetic identity markers were found.' if not fraud_flags else f'Attention required: {len(fraud_flags)} alerts flagged.'}

#### 3. Mitigation & Recommendations
To improve eligibility or proceed safely:
{mitigations_md}

*Note: This is an automated assessment generating a fallback explanation because the Gemini API key was not configured.*
"""
    return fallback_text
