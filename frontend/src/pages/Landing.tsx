import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ShieldAlert, ArrowRight, Zap, Cpu, BarChart3, HelpCircle, 
  ChevronRight, Star, ChevronDown, CheckCircle2, ShieldCheck,
  TrendingUp, Globe, FileClock, Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export const Landing: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Live Credit Simulator State
  const [simScore, setSimScore] = useState(720);
  const [simDTI, setSimDTI] = useState(0.28);
  const [simIncome, setSimIncome] = useState(85000);

  // Simple simulator logic
  const calculateSimRisk = () => {
    let riskProb = 0.5 - (simScore - 300) / 1000 - (1 - simDTI) * 0.1;
    if (simIncome < 40000) riskProb += 0.15;
    riskProb = Math.max(0.01, Math.min(0.99, riskProb));
    
    let category = "Low";
    let color = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (riskProb > 0.45) {
      category = "High";
      color = "text-red-400 border-red-500/20 bg-red-500/5";
    } else if (riskProb > 0.22) {
      category = "Medium";
      color = "text-amber-400 border-amber-500/20 bg-amber-500/5";
    }

    return {
      probability: (riskProb * 100).toFixed(1),
      category,
      color,
      approved: category !== "High"
    };
  };

  const simResult = calculateSimRisk();

  const faqs = [
    {
      q: "How does the AI model evaluate default probability?",
      a: "Our ML engine utilizes a pre-trained ensemble of CatBoost and XGBoost models. It evaluates traditional credit metrics (FICO, DTI) alongside behavioral signals like cash flow stability and history score. It is deployed as an explainable engine leveraging SHAP value estimates."
    },
    {
      q: "Can we integrate this with legacy banking mainframes?",
      a: "Absolutely. Our platform exposes RESTful endpoints with sub-100ms request latencies and comprehensive OpenAPI definitions. Secure webhook integrations are supported out-of-the-box."
    },
    {
      q: "What measures protect sensitive customer information?",
      a: "We adhere strictly to SOC2 and GDPR compliance. All data fields are encrypted at rest with AES-256 and in transit via TLS 1.3, backed by robust RBAC (Role-Based Access Control) policies."
    },
    {
      q: "Is simulated data available for model demonstration?",
      a: "Yes, our platform includes automated DB seeding, customer profiling tools, and simulation options. When you register, a pre-populated suite of customer profiles is instantly loaded for review."
    }
  ];

  return (
    <div className="min-h-screen bg-[#030712] relative overflow-hidden text-slate-100">
      
      {/* Background Decorative Blur Blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[140px] pointer-events-none -z-10 animate-slow-spin" />
      <div className="absolute bottom-[20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[40%] left-[-15%] w-[450px] h-[450px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header / Nav */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-[#030712]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShieldCheck className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-widest bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent uppercase">
                Credit Intelligence
              </span>
              <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-wider">Enterprise Risk Platform</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#simulator" className="hover:text-cyan-400 transition-colors">Risk Simulator</a>
            <a href="#workflow" className="hover:text-cyan-400 transition-colors">Workflow</a>
            <a href="#faq" className="hover:text-cyan-400 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link 
                to="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 text-sm font-semibold transition-all"
              >
                Launch Console
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link 
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white text-sm font-semibold transition-all shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.35)]"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 md:pt-28 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Next-Gen ML Credit Engine v2.4 Live</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-white">
            AI-Powered Credit <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Risk Intelligence
            </span>
          </h1>

          <p className="text-base md:text-lg text-slate-400 max-w-xl leading-relaxed">
            Automate loan risk profiling, default probabilities, and underwriting decisions using explainable machine learning models. Built for high-frequency financial operations.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link 
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm transition-all shadow-lg flex items-center gap-2 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:-translate-y-0.5"
            >
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#simulator"
              className="px-6 py-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-slate-300 font-semibold text-sm transition-all"
            >
              Interactive Simulator
            </a>
          </div>

          {/* Social Proof */}
          <div className="pt-10 space-y-3">
            <p className="text-xs uppercase font-mono tracking-widest text-slate-500">Trusted by modern underwriting teams at</p>
            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 opacity-40 grayscale contrast-200">
              <span className="text-base font-black tracking-tighter text-white">stripe</span>
              <span className="text-base font-extrabold tracking-tight text-white">ramp</span>
              <span className="text-base font-bold text-white">B R E X</span>
              <span className="text-base font-bold tracking-widest text-white">CRED</span>
              <span className="text-base font-semibold text-white">revolut</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Image / Card */}
        <div className="lg:col-span-5 relative w-full flex justify-center">
          <div className="w-full max-w-md p-6 rounded-3xl glass-panel border-white/[0.06] shadow-2xl relative overflow-hidden">
            {/* Top glass bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <span className="text-[10px] font-mono text-slate-500">COGNITIVE COMPUTE CORE</span>
            </div>

            {/* Simulated Live preview UI */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                <span className="text-[10px] font-mono text-slate-400">DECISION METRIC ENGINE</span>
                <div className="flex items-end justify-between mt-2">
                  <div>
                    <p className="text-2xl font-bold text-white">99.82%</p>
                    <p className="text-[9px] font-mono text-slate-500">DECISION ACCURACY RATE</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-400">92ms</p>
                    <p className="text-[9px] font-mono text-slate-500">AVERAGE LATENCY SPEED</p>
                  </div>
                </div>
              </div>

              {/* Mini Interactive graphic */}
              <div className="p-4 rounded-2xl bg-[#090e1a]/60 border border-white/[0.04]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold text-slate-300">Default Probability Map</span>
                  <span className="text-[10px] font-mono text-cyan-400">CATBOOST v2.0</span>
                </div>
                <div className="h-28 flex items-end justify-between gap-1.5 pt-2">
                  <div className="w-full bg-emerald-500/10 border-t border-emerald-500/30 rounded-t-md h-[40%]" />
                  <div className="w-full bg-emerald-500/10 border-t border-emerald-500/30 rounded-t-md h-[55%]" />
                  <div className="w-full bg-amber-500/15 border-t border-amber-500/40 rounded-t-md h-[70%]" />
                  <div className="w-full bg-red-500/20 border-t border-red-500/40 rounded-t-md h-[95%]" />
                  <div className="w-full bg-emerald-500/10 border-t border-emerald-500/30 rounded-t-md h-[30%]" />
                  <div className="w-full bg-emerald-500/10 border-t border-emerald-500/30 rounded-t-md h-[20%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/[0.04] bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-white">$12.4B+</p>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">Capital Scored</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-cyan-400">99.82%</p>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">Classification Accuracy</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-white">4.8M+</p>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">API Requests Handled</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-purple-400">&lt;150ms</p>
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mt-1">Average Response</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">Operational Excellence</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Engineered for Modern Credit Operations</h2>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed">
            Eliminate operational bottlenecking. Seamlessly ingest client data, evaluate model feature matrices, and review explanations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl glass-panel border-white/[0.04] glass-panel-hover flex flex-col items-start gap-4">
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Multi-Model Ensemble</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Consolidates predictions across XGBoost, LightGBM, and CatBoost classifiers to provide extremely resilient default estimates.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl glass-panel border-white/[0.04] glass-panel-hover flex flex-col items-start gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Cognitive SHAP Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Provides granular mathematical breakdowns of features driving credit score movements. Complete clarity for underwriting audits.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl glass-panel border-white/[0.04] glass-panel-hover flex flex-col items-start gap-4">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Automated Risk Auditing</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Continuously runs client compliance audits, evaluating DTI limits, historical performance trends, and red flag warnings.
            </p>
          </div>
        </div>
      </section>

      {/* Live Credit Simulator Widget */}
      <section id="simulator" className="max-w-7xl mx-auto px-6 py-16">
        <div className="p-8 md:p-12 rounded-3xl glass-panel border-white/[0.06] shadow-3xl bg-[#090f1d]/50 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Interactive Credit Simulator</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Evaluate Risk Profiles in Real Time</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Test how credit score modifications, debt ratios, and income profiles skew risk classification boundaries. Slide the handles to see the ML response.
            </p>
            
            <div className="space-y-5 pt-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400">Credit Score</span>
                  <span className="text-cyan-400 font-mono font-bold">{simScore} FICO</span>
                </div>
                <input 
                  type="range" 
                  min="300" 
                  max="850" 
                  value={simScore} 
                  onChange={(e) => setSimScore(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400">Debt-To-Income (DTI)</span>
                  <span className="text-cyan-400 font-mono font-bold">{(simDTI * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0.0" 
                  max="1.5" 
                  step="0.05"
                  value={simDTI} 
                  onChange={(e) => setSimDTI(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-2">
                  <span className="text-slate-400">Annual Income</span>
                  <span className="text-cyan-400 font-mono font-bold">${simIncome.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="15000" 
                  max="250000" 
                  step="5000"
                  value={simIncome} 
                  onChange={(e) => setSimIncome(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Simulator output display */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-sm p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between h-80 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 text-[9px] font-mono text-slate-500 uppercase tracking-widest border-l border-b border-white/[0.04] rounded-bl-xl bg-[#030712]/40">Output</div>
              
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">Risk Forecast Matrix</span>
                <h3 className="text-white text-lg font-bold">Default Risk Score</h3>
              </div>

              <div className="my-6 text-center">
                <p className="text-5xl font-black tracking-tight text-white">{simResult.probability}%</p>
                <p className="text-[10px] font-mono uppercase text-slate-400 mt-1">Model Score probability</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.06] pt-4">
                <div>
                  <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Classification</span>
                  <div className={`mt-0.5 px-3 py-1 rounded-full text-xs font-bold border ${simResult.color}`}>
                    {simResult.category} Risk
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono uppercase text-slate-500 tracking-wider">Recommendation</span>
                  <p className={`text-sm font-bold mt-0.5 ${simResult.approved ? "text-emerald-400" : "text-red-400"}`}>
                    {simResult.approved ? "Approved" : "Rejected"}
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-20 space-y-16">
        <div className="text-center max-w-xl mx-auto space-y-4">
          <span className="text-xs uppercase font-mono tracking-widest text-purple-400">Architecture Flow</span>
          <h2 className="text-3xl font-bold text-white">How Credit Intelligence Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          
          <div className="space-y-3 relative p-6 rounded-2xl bg-white/[0.01] border border-white/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm">1</div>
            <h4 className="font-bold text-white text-base">Client Ingestion</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Upload customer profile data directly through secure REST endpoints or bulk drag-and-drop CSV interfaces.
            </p>
          </div>

          <div className="space-y-3 relative p-6 rounded-2xl bg-white/[0.01] border border-white/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-sm">2</div>
            <h4 className="font-bold text-white text-base">Model Processing</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Our ensemble classifiers analyze debt-to-income limits, historical trends, savings levels, and employment.
            </p>
          </div>

          <div className="space-y-3 relative p-6 rounded-2xl bg-white/[0.01] border border-white/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-sm">3</div>
            <h4 className="font-bold text-white text-base">Decision Explainability</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Generates granular SHAP value scoring vectors detailing positive/negative performance attributes.
            </p>
          </div>

          <div className="space-y-3 relative p-6 rounded-2xl bg-white/[0.01] border border-white/[0.02]">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">4</div>
            <h4 className="font-bold text-white text-base">Underwriting Output</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Delivers standard decision metrics, AI summary breakdowns, audit reports, and dispatch hooks instantly.
            </p>
          </div>

        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/[0.04]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-4 space-y-4">
            <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">Industry Endorsement</span>
            <h3 className="text-3xl font-bold text-white">What Risk Officers Are Saying</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Our machine learning models help underwriters evaluate default risk vectors with complete statistical auditing capabilities.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-4">
              <div className="flex items-center gap-1.5 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "CIP has transformed our operations console. Integrating the dynamic SHAP values into our compliance reporting shaved weeks off audit tasks. Recommended."
              </p>
              <div className="flex items-center gap-3 border-t border-white/[0.04] pt-3">
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">DH</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Devin H.</h5>
                  <p className="text-[10px] text-slate-500">Chief Risk Officer, Apex Bank</p>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.01] border border-white/[0.03] space-y-4">
              <div className="flex items-center gap-1.5 text-amber-400">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
              </div>
              <p className="text-slate-300 text-xs italic leading-relaxed">
                "The API sub-100ms speeds are remarkable. We deployed the model outputs to trigger automated underwriting actions and saw a 32% efficiency boost."
              </p>
              <div className="flex items-center gap-3 border-t border-white/[0.04] pt-3">
                <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-bold text-white">SK</div>
                <div>
                  <h5 className="text-xs font-bold text-white">Sarah K.</h5>
                  <p className="text-[10px] text-slate-500">VP Financial Risk, Sterling Capital</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="max-w-3xl mx-auto px-6 py-20 space-y-12">
        <div className="text-center space-y-4">
          <HelpCircle className="w-8 h-8 text-cyan-400 mx-auto" />
          <h2 className="text-3xl font-bold text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div 
                key={index} 
                className="rounded-2xl bg-white/[0.01] border border-white/[0.03] overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left text-white hover:bg-white/[0.01] transition-colors"
                >
                  <span className="font-semibold text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-5 pt-1 text-slate-400 text-xs leading-relaxed border-t border-white/[0.02]">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="p-8 md:p-12 rounded-3xl glass-panel border-white/[0.04] shadow-3xl bg-gradient-to-br from-[#070c1d] to-[#030712] relative overflow-hidden space-y-6">
          <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
          <h2 className="text-3xl md:text-5xl font-extrabold text-white">Ready to Automate Risk Profiling?</h2>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Gain access to FICO evaluations, automated credit decisions, feature explainability reports, and AI copilots instantly.
          </p>
          <div className="pt-4">
            <Link 
              to={isAuthenticated ? "/dashboard" : "/register"}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5"
            >
              Start Free Trial Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.04] bg-black/20 text-xs text-slate-500 py-12">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-cyan-400" />
              <span className="font-bold tracking-widest text-slate-300 uppercase">Credit Risk Engine</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              High-fidelity explainable machine learning models for risk management and default prediction analytics.
            </p>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-300">Operations</h5>
            <ul className="space-y-2">
              <li><Link to="/dashboard" className="hover:text-cyan-400 transition-colors">Risk Dashboard</Link></li>
              <li><Link to="/predict" className="hover:text-cyan-400 transition-colors">Decision Center</Link></li>
              <li><Link to="/customers" className="hover:text-cyan-400 transition-colors">Client Directory</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-300">Security</h5>
            <ul className="space-y-2 font-mono text-[10px]">
              <li>SOC2 COMPLIANT</li>
              <li>AES-256 ENCRYPTED</li>
              <li>GDPR / CCPA ALIGNED</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-bold text-slate-300">Contact & Support</h5>
            <p className="leading-relaxed">
              Support Core: <br />
              <span className="text-slate-400">ops@creditriskplatform.com</span>
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-white/[0.04] mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-[10px]">
          <p>© 2026 Credit Intelligence Platform Inc. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
