# Credit Risk Prediction Platform

An AI-powered, enterprise-grade Credit Risk Assessment and Prediction Platform. Capable of predicting customer loan default probability, generating simulated credit scores (300-850), scanning for synthetic identity fraud, explaining predictions via Explainable AI (SHAP), and generating professional risk reports.

Designed with a high-fidelity dark glassmorphic UI layout ("Bloomberg meets Apple Liquid Glass").

---

## Technical Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy ORM (SQL Injection proof), SQLite (Local Fallback) & PostgreSQL, slowapi (Rate Limiting).
- **Machine Learning**: Scikit-Learn, XGBoost, CatBoost, LightGBM, SHAP (Explainable AI values).
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Recharts (Visualizations), React Hook Form, Zod.
- **Orchestration**: Docker & Docker Compose.

---

## Security & Compliance Architecture

- **JWT Auth & Refresh Rotation**: Implements access token expiration (30 mins) and secure refresh token rotation (7 days) to limit session hijacking.
- **Account Lockouts**: Brute force prevention lockouts for 15 minutes after 5 consecutive failed login attempts.
- **slowapi Rate Limiting**: Limit API request spamming to protect endpoints.
- **Strict Validations**: Input sanitization and bounds check via Zod schemas (Frontend) and Pydantic v2 schemas (Backend).
- **Secure Logs**: Action audit logs with client IP and User Agent records (never logs passwords or secrets).

---

## Seed Accounts (Database Autoseeds on boot)

- **Underwriter Analyst Account**:
  - **Email**: `analyst@bank.com`
  - **Password**: `AnalystPass123!`
  - **Permissions**: Run predictions, search profiles, download reports, consult Gemini.
  
- **System Administrator Account**:
  - **Email**: `admin@bank.com`
  - **Password**: `AdminPass123!`
  - **Permissions**: Full analyst scope + view audit logs, toggle user roles, monitor model drift, and trigger ML retraining pipeline.

---

## Setup & Running Instructions

### Method 1: Local Development (Easy Launch)

#### Step 1: Start Backend API Server
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. The python virtual environment `.venv` is already initialized. Activate it:
   - **Windows Powershell**: `.venv\Scripts\Activate.ps1`
   - **Windows CMD**: `.venv\Scripts\activate.bat`
   - **Mac/Linux**: `source .venv/bin/activate`
3. Run the FastAPI development server:
   ```bash
   python app/main.py
   ```
   *Note: On startup, the server automatically initializes database tables, seeds credentials and customer entries, checks for model files, and trains the ML classifier comparison pipeline.*

#### Step 2: Start React Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Run the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser to `http://localhost:5173`.

---

### Method 2: Docker Compose (Full Stack Production)

Run the entire suite (Postgres DB, API Server, Nginx Frontend) in one command from the project root:
```bash
docker-compose up --build
```
- **React Web App**: `http://localhost` (Port 80)
- **FastAPI Documentation**: `http://localhost:8000/swagger`
- **Postgres Database**: `localhost:5432`
