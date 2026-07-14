import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  User, Mail, Phone, DollarSign, Briefcase, FileText, 
  Percent, Clock, ShieldCheck, Download, Plus, ArrowLeft, RefreshCw 
} from "lucide-react";
import { apiFetch } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "../components/Magnetic";

const loanSchema = z.object({
  loan_amount: z.number().gt(0, "Amount must be greater than 0"),
  loan_purpose: z.enum(["debt_consolidation", "home_improvement", "education", "medical", "business", "other"]),
  term_months: z.number().int().gt(0, "Term must be at least 1 month"),
  interest_rate: z.number().min(0).max(100, "Interest must be between 0% and 100%"),
});

type LoanFormData = z.infer<typeof loanSchema>;

export const CustomerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [showAddLoan, setShowAddLoan] = useState(false);
  const [submittingLoan, setSubmittingLoan] = useState(false);
  const [loanError, setLoanError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoanFormData>({
    resolver: zodResolver(loanSchema),
  });

  const fetchProfileData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/customers/${id}`);
      setProfile(data.profile);
      setLoans(data.loans || []);
      setPredictions(data.predictions || []);
    } catch (err: any) {
      setError(err.message || "Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [id]);

  const handleDownloadPDF = async () => {
    try {
      const response = await apiFetch(`/reports/pdf/${id}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `credit_report_customer_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      alert("Failed to download PDF report: " + err.message);
    }
  };

  const onSubmitLoan = async (data: LoanFormData) => {
    setSubmittingLoan(true);
    setLoanError(null);
    try {
      await apiFetch(`/customers/${id}/loans`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      setShowAddLoan(false);
      reset();
      fetchProfileData();
    } catch (err: any) {
      setLoanError(err.message || "Failed to add loan application");
    } finally {
      setSubmittingLoan(false);
    }
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case "Very Low": return "text-emerald-400 bg-emerald-500/5 border-emerald-500/10";
      case "Low": return "text-green-400 bg-green-500/5 border-green-500/10";
      case "Medium": return "text-amber-400 bg-amber-500/5 border-amber-500/10";
      case "High": return "text-orange-400 bg-orange-500/5 border-orange-500/10";
      case "Very High": return "text-red-400 bg-red-500/5 border-red-500/10";
      default: return "text-slate-400 bg-slate-900/40 border-slate-800";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Fetching account dossier...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 rounded-3xl glass-panel border border-white/[0.04]">
        <p className="text-red-400 font-mono text-xs">{error || "Customer profile could not be found."}</p>
        <Link to="/customers" className="text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2 text-xs font-mono uppercase">
          <ArrowLeft className="w-4 h-4" /> Return to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* Header breadcrumb */}
      <div>
        <Link to="/customers" className="text-cyan-400 hover:text-cyan-300 text-[10px] flex items-center gap-1.5 font-mono uppercase tracking-wider transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Directory
        </Link>
        <h1 className="text-xl font-bold text-white mt-3 flex items-center gap-2">
          <User className="w-5 h-5 text-slate-400" /> {profile.first_name} {profile.last_name}
        </h1>
        <p className="text-[9px] text-slate-500 font-mono uppercase mt-1 tracking-widest">
          Borrower ID: {profile.id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Profile Metrics */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-6 rounded-3xl glass-panel border border-white/[0.04]">
            <h2 className="text-sm font-semibold text-white mb-6 border-b border-white/[0.04] pb-3 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-cyan-400" /> Profile Information
            </h2>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Email Address</p>
                  <p className="text-slate-200 font-medium break-all mt-0.5">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Phone Number</p>
                  <p className="text-slate-200 font-medium mt-0.5">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Employment Capacity</p>
                  <p className="text-slate-200 font-medium capitalize mt-0.5">
                    {profile.employment_status.replace("_", " ")} ({profile.employment_duration_months} mo)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Annual Income</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">
                    ${profile.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Percent className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Debt-to-Income (DTI)</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">{(profile.debt_to_income_ratio * 100).toFixed(0)}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Payment Score</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">{profile.payment_history_score}/100</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider font-mono">Savings Balance</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">
                    ${profile.savings_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleDownloadPDF}
              className="w-full mt-6 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl py-3 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-4 h-4" /> Download Report (PDF)
            </button>
          </div>
        </div>

        {/* Right Side: Loans & Decisions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Loans */}
          <div className="p-6 rounded-3xl glass-panel border border-white/[0.04]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-cyan-400" /> Active Loan Portfolio
              </h2>
              <button
                onClick={() => setShowAddLoan(!showAddLoan)}
                className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300 font-mono text-[9px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all animate-pulse-glow"
              >
                <Plus className="w-3.5 h-3.5" /> File Loan Request
              </button>
            </div>

            <AnimatePresence>
              {showAddLoan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handleSubmit(onSubmitLoan)} className="bg-[#030712] border border-white/[0.06] p-5 rounded-2xl mb-6 space-y-4">
                    <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">File Request Matrix</h3>
                    {loanError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-3 py-2 rounded text-xs font-mono">
                        {loanError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Loan Amount ($)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("loan_amount", { valueAsNumber: true })}
                          className="w-full bg-[#080d19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          placeholder="e.g. 50000"
                        />
                        {errors.loan_amount && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.loan_amount.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Loan Purpose</label>
                        <select
                          {...register("loan_purpose")}
                          className="w-full bg-[#080d19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="debt_consolidation">Debt Consolidation</option>
                          <option value="home_improvement">Home Improvement</option>
                          <option value="education">Education</option>
                          <option value="medical">Medical</option>
                          <option value="business">Business</option>
                          <option value="other">Other Purpose</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Term (Months)</label>
                        <input
                          type="number"
                          {...register("term_months", { valueAsNumber: true })}
                          className="w-full bg-[#080d19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          placeholder="e.g. 36"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("interest_rate", { valueAsNumber: true })}
                          className="w-full bg-[#080d19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                          placeholder="e.g. 6.5"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.04]">
                      <button
                        type="button"
                        onClick={() => setShowAddLoan(false)}
                        className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] text-slate-400 rounded-xl px-4 py-2 text-xs font-mono uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingLoan}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-5 py-2 transition-all cursor-pointer"
                      >
                        {submittingLoan ? "Filing..." : "Register Request"}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {loans.length === 0 ? (
              <p className="text-slate-500 text-[10px] font-mono text-center py-8 uppercase">No historical requests cataloged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[9px] font-mono uppercase text-slate-500">
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Principal</th>
                      <th className="py-2.5 px-3 text-center">Term</th>
                      <th className="py-2.5 px-3 text-center">Interest</th>
                      <th className="py-2.5 px-3 text-center">Disposition</th>
                      <th className="py-2.5 px-3 text-right">Filing Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {loans.map((loan) => (
                      <tr key={loan.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-200 capitalize">{loan.loan_purpose.replace("_", " ")}</td>
                        <td className="py-3 px-3 font-mono text-slate-200">${loan.loan_amount.toLocaleString()}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{loan.term_months} mo</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{loan.interest_rate}%</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${
                            loan.status === "approved" 
                              ? "bg-emerald-500/5 text-emerald-400 border-emerald-500/10" 
                              : loan.status === "pending"
                              ? "bg-cyan-500/5 text-cyan-400 border-cyan-500/10"
                              : "bg-red-500/5 text-red-400 border-red-500/10"
                          }`}>
                            {loan.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 font-mono">
                          {new Date(loan.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Predictions History */}
          <div className="p-6 rounded-3xl glass-panel border border-white/[0.04]">
            <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" /> Bureau Neural Assessments
            </h2>

            {predictions.length === 0 ? (
              <p className="text-slate-500 text-[10px] font-mono text-center py-8 uppercase">No neural evaluations logged.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[9px] font-mono uppercase text-slate-500">
                      <th className="py-2.5 px-3">Classifier</th>
                      <th className="py-2.5 px-3 text-center">FICO Score</th>
                      <th className="py-2.5 px-3 text-center">Risk Tier</th>
                      <th className="py-2.5 px-3 text-center">Probability</th>
                      <th className="py-2.5 px-3 text-center">Decision</th>
                      <th className="py-2.5 px-3 text-right">Assessment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {predictions.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-200">{p.model_name}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-200">{p.credit_score}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono border ${getRiskColor(p.risk_category)}`}>
                            {p.risk_category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{(p.default_probability * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          <span className={p.recommendation === "Approve" ? "text-emerald-400" : "text-red-400"}>
                            {p.recommendation.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-slate-500 font-mono">
                          {new Date(p.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default CustomerProfile;
