from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from typing import Dict, Any, List

def generate_risk_pdf(
    customer: Dict[str, Any],
    prediction: Dict[str, Any],
    suggestions: List[str],
    fraud_flags: List[str]
) -> BytesIO:
    """Generates a professional enterprise-grade PDF risk report."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=45,
        bottomMargin=40
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Palette - "Bloomberg meets Apple Glass" style
    COLOR_PRIMARY = colors.HexColor("#1A1F2C")  # Dark Slate
    COLOR_SECONDARY = colors.HexColor("#319795")  # Teal
    COLOR_DARK = colors.HexColor("#2D3748")  # Charcoal
    COLOR_LIGHT = colors.HexColor("#EDF2F7")  # Warm Light Gray
    COLOR_BORDER = colors.HexColor("#E2E8F0")
    
    # Colors for risk categories
    risk_colors = {
        "Very Low": colors.HexColor("#319795"),  # Teal
        "Low": colors.HexColor("#38A169"),  # Green
        "Medium": colors.HexColor("#D69E2E"),  # Amber
        "High": colors.HexColor("#DD6B20"),  # Orange
        "Very High": colors.HexColor("#E53E3E")  # Red
    }
    
    risk_cat = prediction.get("risk_category", "Medium")
    risk_color = risk_colors.get(risk_cat, COLOR_SECONDARY)
    
    # Custom Paragraph Styles
    title_style = ParagraphStyle(
        name="DocTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        textColor=COLOR_PRIMARY,
        alignment=0,
        spaceAfter=15
    )
    
    subtitle_style = ParagraphStyle(
        name="DocSubTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        textColor=COLOR_SECONDARY,
        spaceAfter=20
    )
    
    h1_style = ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=14,
        textColor=COLOR_PRIMARY,
        spaceBefore=12,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        name="TableBody",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        textColor=COLOR_DARK,
        leading=14
    )
    
    body_bold = ParagraphStyle(
        name="TableBodyBold",
        parent=body_style,
        fontName="Helvetica-Bold"
    )
    
    alert_style = ParagraphStyle(
        name="AlertText",
        parent=body_style,
        textColor=colors.HexColor("#C53030")
    )
    
    elements = []
    
    # Title & Header Banner
    elements.append(Paragraph("CREDIT RISK ASSESSMENT REPORT", title_style))
    elements.append(Paragraph(f"CONFIDENTIAL  |  GENERATED ON: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} UTC", subtitle_style))
    elements.append(Spacer(1, 10))
    
    # 1. Summary Block Table (Risk recommendations & Credit score)
    summary_data = [
        [
            Paragraph("System Recommendation", body_bold),
            Paragraph(prediction.get("recommendation", "N/A").upper(), ParagraphStyle(
                "RecStyle", parent=body_bold, fontSize=12, textColor=colors.HexColor("#38A169") if prediction.get("recommendation") == "Approve" else colors.HexColor("#E53E3E")
            ))
        ],
        [
            Paragraph("Default Probability", body_bold),
            Paragraph(f"{prediction.get('default_probability', 0) * 100:.2f}%", body_style)
        ],
        [
            Paragraph("FICO-Simulated Credit Score", body_bold),
            Paragraph(f"{prediction.get('credit_score', 300)} / 850", body_bold)
        ],
        [
            Paragraph("Risk Evaluation Tier", body_bold),
            Paragraph(risk_cat, ParagraphStyle("RiskStyle", parent=body_bold, textColor=risk_color))
        ]
    ]
    
    t_summary = Table(summary_data, colWidths=[200, 300])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_LIGHT),
        ('GRID', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('PADDING', (0,0), (-1,-1), 8),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    elements.append(Paragraph("1. Executive Summary", h1_style))
    elements.append(t_summary)
    elements.append(Spacer(1, 15))
    
    # 2. Customer Personal & Financial Information
    cust_data = [
        [
            Paragraph("Applicant Name", body_bold),
            Paragraph(f"{customer.get('first_name')} {customer.get('last_name')}", body_style),
            Paragraph("Email Address", body_bold),
            Paragraph(customer.get("email"), body_style),
        ],
        [
            Paragraph("Phone Number", body_bold),
            Paragraph(customer.get("phone"), body_style),
            Paragraph("Employment Status", body_bold),
            Paragraph(customer.get("employment_status", "").title(), body_style),
        ],
        [
            Paragraph("Annual Income", body_bold),
            Paragraph(f"${customer.get('income', 0):,.2f}", body_style),
            Paragraph("Debt-to-Income (DTI)", body_bold),
            Paragraph(f"{customer.get('debt_to_income_ratio', 0):.2f}", body_style),
        ],
        [
            Paragraph("Total Active Debt", body_bold),
            Paragraph(f"${customer.get('total_debt', 0):,.2f}", body_style),
            Paragraph("Savings Balance", body_bold),
            Paragraph(f"${customer.get('savings_balance', 0):,.2f}", body_style),
        ],
        [
            Paragraph("On-Time Payment Score", body_bold),
            Paragraph(f"{customer.get('payment_history_score', 100):.1f}%", body_style),
            Paragraph("Active Credit Lines", body_bold),
            Paragraph(str(customer.get("existing_loans_count", 0)), body_style),
        ]
    ]
    
    t_cust = Table(cust_data, colWidths=[110, 140, 110, 140])
    t_cust.setStyle(TableStyle([
        ('GRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('BACKGROUND', (0,0), (0,-1), COLOR_LIGHT),
        ('BACKGROUND', (2,0), (2,-1), COLOR_LIGHT),
        ('PADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    
    elements.append(Paragraph("2. Applicant Financial Details", h1_style))
    elements.append(t_cust)
    elements.append(Spacer(1, 15))
    
    # 3. Fraud Detection Summary
    elements.append(Paragraph("3. Fraud Risk Audit Log", h1_style))
    if fraud_flags:
        fraud_data = []
        for flag in fraud_flags:
            fraud_data.append([Paragraph("🚨 FLAGGED WARNING", alert_style), Paragraph(flag, alert_style)])
        t_fraud = Table(fraud_data, colWidths=[120, 380])
        t_fraud.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor("#FEB2B2")),
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#FFF5F5")),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_fraud)
    else:
        elements.append(Paragraph("✅ No active duplicate identity, synthetic pattern, or leverage warnings flagged.", body_style))
    elements.append(Spacer(1, 15))
    
    # 4. Credit Improvement Action Plan
    elements.append(Paragraph("4. Strategic Credit Improvement suggestions", h1_style))
    if suggestions:
        sug_data = []
        for i, sug in enumerate(suggestions, 1):
            sug_data.append([Paragraph(f"Step {i}", body_bold), Paragraph(sug, body_style)])
        t_sug = Table(sug_data, colWidths=[60, 440])
        t_sug.setStyle(TableStyle([
            ('GRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
            ('BACKGROUND', (0,0), (0,-1), COLOR_LIGHT),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_sug)
    else:
        elements.append(Paragraph("Customer holds optimized scores; no immediate adjustment plan is recommended.", body_style))
        
    # Build Document
    doc.build(elements)
    buffer.seek(0)
    return buffer
