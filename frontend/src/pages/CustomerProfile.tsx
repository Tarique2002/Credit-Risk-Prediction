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
import { GlassCard } from "../components/GlassCard";
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Fetching account profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <GlassCard className="text-center p-8 space-y-4 max-w-lg mx-auto border border-white/[0.04]">
        <p className="text-red-400 font-mono text-xs">{error || "Customer profile could not be found."}</p>
        <Magnetic strength={0.3} scale={1.03}>
          <Link to="/customers" className="text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2 text-xs font-mono uppercase">
            <ArrowLeft className="w-4 h-4" data-magnetic-inner /> <span data-magnetic-inner>Return to Directory</span>
          </Link>
        </Magnetic>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header breadcrumb */}
      <div>
        <Magnetic strength={0.3} scale={1.03}>
          <Link to="/customers" className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1.5 font-mono uppercase tracking-wider transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" data-magnetic-inner /> <span data-magnetic-inner>Back to Customer Directory</span>
          </Link>
        </Magnetic>
        <h1 className="text-2xl font-bold text-white mt-3">
          {profile.first_name} {profile.last_name}
        </h1>
        <p className="text-[10px] text-slate-500 font-mono uppercase mt-1 tracking-widest">
          Customer Record ID: {profile.id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: General Profile Metrics */}
        <div className="space-y-6 lg:col-span-1">
          <GlassCard glowColor="cyan" className="border border-white/[0.04]">
            <h2 className="text-sm font-semibold text-white mb-6 border-b border-white/[0.04] pb-3 flex items-center gap-2">
              <User className="w-4.5 h-4.5 text-cyan-400" /> Profile Information
            </h2>
            
            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3.5">
                <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Corporate Email</p>
                  <p className="text-slate-200 font-medium break-all mt-0.5">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <Phone className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Phone Number</p>
                  <p className="text-slate-200 font-medium mt-0.5">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <Briefcase className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Employment Capacity</p>
                  <p className="text-slate-200 font-medium capitalize mt-0.5">
                    {profile.employment_status.replace("_", " ")} ({profile.employment_duration_months} mo)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <DollarSign className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Annual Income</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">
                    ${profile.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <Percent className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Debt-to-Income (DTI)</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">{(profile.debt_to_income_ratio * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Payment Score</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">{profile.payment_history_score}%</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">Savings Balance</p>
                  <p className="text-slate-200 font-mono font-semibold mt-0.5">
                    ${profile.savings_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            
            <Magnetic className="w-full mt-8" strength={0.3} scale={1.03}>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleDownloadPDF}
                className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl py-3 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" data-magnetic-inner /> <span data-magnetic-inner>Download Report (PDF)</span>
              </motion.button>
            </Magnetic>
          </GlassCard>
        </div>

        {/* Right Side: Loans & Decisions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Loans */}
          <GlassCard className="border border-white/[0.04]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-cyan-400" /> Loan Applications History
              </h2>
              <Magnetic strength={0.25} scale={1.03}>
                <button
                  onClick={() => setShowAddLoan(!showAddLoan)}
                  className="bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.04] text-slate-300 font-mono text-[10px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" data-magnetic-inner /> <span data-magnetic-inner>File New Application</span>
                </button>
              </Magnetic>
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
                  <form onSubmit={handleSubmit(onSubmitLoan)} className="bg-[#070913]/60 border border-white/[0.06] p-5 rounded-2xl mb-6 space-y-4">
                    <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">New Application Entry</h3>
                    {loanError && (
                      <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-3 py-2 rounded text-xs font-mono">
                        {loanError}
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Loan Amount ($)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("loan_amount", { valueAsNumber: true })}
                          className="w-full bg-[#0b0f19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          placeholder="e.g. 50000"
                        />
                        {errors.loan_amount && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.loan_amount.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Loan Purpose</label>
                        <select
                          {...register("loan_purpose")}
                          className="w-full bg-[#0b0f19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="debt_consolidation">Debt Consolidation</option>
                          <option value="home_improvement">Home Improvement</option>
                          <option value="education">Education</option>
                          <option value="medical">Medical</option>
                          <option value="business">Business</option>
                          <option value="other">Other Purpose</option>
                        </select>
                        {errors.loan_purpose && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.loan_purpose.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Term (Months)</label>
                        <input
                          type="number"
                          {...register("term_months", { valueAsNumber: true })}
                          className="w-full bg-[#0b0f19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          placeholder="e.g. 36"
                        />
                        {errors.term_months && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.term_months.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("interest_rate", { valueAsNumber: true })}
                          className="w-full bg-[#0b0f19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          placeholder="e.g. 6.5"
                        />
                        {errors.interest_rate && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.interest_rate.message}</p>}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2.5 pt-3 border-t border-white/[0.04]">
                      <Magnetic strength={0.2} scale={1.02}>
                        <button
                          type="button"
                          onClick={() => setShowAddLoan(false)}
                          className="bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 border border-white/[0.04] rounded-xl px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors"
                        >
                          <span data-magnetic-inner>Cancel</span>
                        </button>
                      </Magnetic>
                      
                      <Magnetic strength={0.3} scale={1.04}>
                        <button
                          type="submit"
                          disabled={submittingLoan}
                          className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-5 py-2 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {submittingLoan ? "Filing..." : <span data-magnetic-inner>File Application</span>}
                        </button>
                      </Magnetic>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {loans.length === 0 ? (
              <p className="text-slate-500 text-xs font-mono text-center py-8">No historical loans cataloged for this customer.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[10px] font-mono uppercase text-slate-500">
                      <th className="py-2.5 px-3">Purpose</th>
                      <th className="py-2.5 px-3">Principal</th>
                      <th className="py-2.5 px-3 text-center">Term</th>
                      <th className="py-2.5 px-3 text-center">Interest</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Filed Date</th>
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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            loan.status === "approved" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : loan.status === "pending"
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
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
          </GlassCard>

          {/* Predictions History */}
          <GlassCard className="border border-white/[0.04]">
            <h2 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" /> ML Risk Calculations Log
            </h2>

            {predictions.length === 0 ? (
              <p className="text-slate-500 text-xs font-mono text-center py-8">No credit predictions calculated for this profile.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[10px] font-mono uppercase text-slate-500">
                      <th className="py-2.5 px-3">Classifier</th>
                      <th className="py-2.5 px-3 text-center">FICO Score</th>
                      <th className="py-2.5 px-3 text-center">Risk Tier</th>
                      <th className="py-2.5 px-3 text-center">Probability</th>
                      <th className="py-2.5 px-3 text-center">Decision</th>
                      <th className="py-2.5 px-3 text-right">Run Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {predictions.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-200">{p.model_name}</td>
                        <td className="py-3 px-3 text-center font-mono text-slate-200">{p.credit_score}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                            p.risk_category === "Very Low" || p.risk_category === "Low" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : p.risk_category === "Medium"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {p.risk_category}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">{(p.default_probability * 100).toFixed(1)}%</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`font-mono font-bold ${p.recommendation === "Approve" ? "text-cyan-400" : "text-red-400"}`}>
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
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
