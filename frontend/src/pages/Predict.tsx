import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Calculator, Upload, FileText, AlertTriangle, ShieldCheck, 
  RefreshCw, BarChart2, Users 
} from "lucide-react";
import { apiFetch, apiUploadFetch } from "../utils/api";
import { GlassCard } from "../components/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "../components/Magnetic";

const predictSchema = z.object({
  customer_id: z.string().optional(),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Invalid phone number"),
  income: z.number().nonnegative("Income must be positive"),
  employment_status: z.enum(["employed", "unemployed", "self_employed", "retired"]),
  employment_duration_months: z.number().int().nonnegative("Duration must be positive"),
  debt_to_income_ratio: z.number().min(0).max(2, "Ratio must be between 0.0 and 2.0"),
  payment_history_score: z.number().min(0).max(100, "Score must be between 0 and 100"),
  existing_loans_count: z.number().int().nonnegative("Count must be positive"),
  total_debt: z.number().nonnegative("Debt must be positive"),
  savings_balance: z.number().nonnegative("Savings must be positive"),
});

type PredictFormData = z.infer<typeof predictSchema>;

export const Predict: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const [customers, setCustomers] = useState<any[]>([]);
  const [loadingCusts, setLoadingCusts] = useState(false);
  
  // Results
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Bulk Upload
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<any>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PredictFormData>({
    resolver: zodResolver(predictSchema),
    defaultValues: {
      income: 60000,
      employment_status: "employed",
      employment_duration_months: 24,
      debt_to_income_ratio: 0.25,
      payment_history_score: 92,
      existing_loans_count: 1,
      total_debt: 8000,
      savings_balance: 15000,
    }
  });

  const loadCustomers = async () => {
    setLoadingCusts(true);
    try {
      const res = await apiFetch("/customers/?limit=100");
      setCustomers(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCusts(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const custId = e.target.value;
    if (!custId) return;
    
    const selected = customers.find((c) => c.id.toString() === custId);
    if (selected) {
      setValue("customer_id", selected.id.toString());
      setValue("first_name", selected.first_name);
      setValue("last_name", selected.last_name);
      setValue("email", selected.email);
      setValue("phone", selected.phone);
      setValue("income", selected.income);
      setValue("employment_status", selected.employment_status);
      setValue("employment_duration_months", selected.employment_duration_months);
      setValue("debt_to_income_ratio", selected.debt_to_income_ratio);
      setValue("payment_history_score", selected.payment_history_score);
      setValue("existing_loans_count", selected.existing_loans_count);
      setValue("total_debt", selected.total_debt);
      setValue("savings_balance", selected.savings_balance);
    }
  };

  const onSubmitSingle = async (data: PredictFormData) => {
    setCalculating(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        ...data,
        customer_id: data.customer_id ? parseInt(data.customer_id) : undefined,
      };
      const res = await apiFetch("/predictions/predict", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed running default prediction.");
    } finally {
      setCalculating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setBulkError(null);
      setBulkResult(null);
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvFile) {
      setBulkError("Please select a valid CSV template first.");
      return;
    }
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await apiUploadFetch("/predictions/bulk", csvFile);
      setBulkResult(res);
    } catch (err: any) {
      setBulkError(err.message || "Bulk prediction run failed.");
    } finally {
      setBulkUploading(false);
    }
  };

  const getRiskColor = (tier: string) => {
    switch (tier) {
      case "Very Low": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Low": return "text-green-400 bg-green-500/10 border-green-500/20";
      case "Medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "High": return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "Very High": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-slate-400 bg-slate-900/40 border-slate-800";
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.04] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Calculator className="text-cyan-400 w-6 h-6" /> Credit Decisioning
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Perform predictive default calculations, audit synthetic fraud indicators, and explain model coefficients
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/[0.04] pb-3">
        <button
          onClick={() => setActiveTab("single")}
          className={`px-4 py-2 text-xs font-mono font-bold tracking-widest transition-all cursor-pointer ${
            activeTab === "single"
              ? "text-cyan-400 border-b-2 border-cyan-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          [SINGLE CALCULATOR]
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`px-4 py-2 text-xs font-mono font-bold tracking-widest transition-all cursor-pointer ${
            activeTab === "bulk"
              ? "text-cyan-400 border-b-2 border-cyan-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          [BATCH CSV UPLOAD]
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "single" ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Form */}
            <div className="lg:col-span-2">
              <GlassCard className="border border-white/[0.04]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/[0.04] pb-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Calculator className="w-4.5 h-4.5 text-cyan-400" /> Assessment Inputs
                  </h2>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Users className="w-4 h-4 text-slate-500 shrink-0" />
                    <select
                      onChange={handleCustomerSelect}
                      className="bg-[#0b0f19] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-cyan-400 focus:outline-none w-full sm:w-auto"
                      defaultValue=""
                    >
                      <option value="" disabled>Pre-fill from profile...</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id.toString()}>
                          {c.first_name} {c.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <form onSubmit={handleSubmit(onSubmitSingle)} className="space-y-6">
                  <input type="hidden" {...register("customer_id")} />
                  
                  {/* Personal Section */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-cyan-400 font-mono uppercase tracking-widest border-l-2 border-cyan-500 pl-2">Personal File Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">First Name</label>
                        <input
                          type="text"
                          {...register("first_name")}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.first_name && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.first_name.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Last Name</label>
                        <input
                          type="text"
                          {...register("last_name")}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.last_name && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.last_name.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Email Address</label>
                        <input
                          type="email"
                          {...register("email")}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.email && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Phone Number</label>
                        <input
                          type="text"
                          {...register("phone")}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          placeholder="+14155552671"
                        />
                        {errors.phone && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.phone.message}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                    <h3 className="text-[11px] font-bold text-cyan-400 font-mono uppercase tracking-widest border-l-2 border-cyan-500 pl-2">Financial Matrix</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Annual Income ($)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("income", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.income && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.income.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Employment Status</label>
                        <select
                          {...register("employment_status")}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                        >
                          <option value="employed">Employed</option>
                          <option value="unemployed">Unemployed</option>
                          <option value="self_employed">Self Employed</option>
                          <option value="retired">Retired</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Job Duration (Months)</label>
                        <input
                          type="number"
                          {...register("employment_duration_months", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.employment_duration_months && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.employment_duration_months.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">DTI Ratio</label>
                        <input
                          type="number"
                          step="any"
                          {...register("debt_to_income_ratio", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.debt_to_income_ratio && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.debt_to_income_ratio.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Payment Score (%)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("payment_history_score", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.payment_history_score && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.payment_history_score.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Savings Balance ($)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("savings_balance", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.savings_balance && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.savings_balance.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Existing Loans Count</label>
                        <input
                          type="number"
                          {...register("existing_loans_count", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.existing_loans_count && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.existing_loans_count.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Total Outstanding Debt ($)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("total_debt", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.total_debt && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.total_debt.message}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-white/[0.04] items-center">
                    <Magnetic strength={0.25} scale={1.03}>
                      <button
                        type="button"
                        onClick={() => {
                          reset();
                          setResult(null);
                        }}
                        className="bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 border border-white/[0.04] rounded-xl px-4 py-2.5 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <span data-magnetic-inner>Reset Form</span>
                      </button>
                    </Magnetic>
                    
                    <Magnetic strength={0.35} scale={1.04}>
                      <button
                        type="submit"
                        disabled={calculating}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md animate-pulse-glow"
                      >
                        {calculating ? (
                          <RefreshCw className="w-4 h-4 animate-spin" data-magnetic-inner />
                        ) : (
                          <span data-magnetic-inner>Run Risk Calculation</span>
                        )}
                      </button>
                    </Magnetic>
                  </div>
                </form>
              </GlassCard>
            </div>

            {/* Results Side */}
            <div className="lg:col-span-1 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-xs font-mono text-center">
                  {error}
                </div>
              )}

              {!result && !calculating && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01]">
                  <Calculator className="w-10 h-10 text-slate-600 mb-4" />
                  <h3 className="text-slate-400 text-xs font-bold font-mono uppercase tracking-wider">Calculator Idle</h3>
                  <p className="text-[11px] text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                    Fill out the assessment form and trigger calculations to see default probability scores.
                  </p>
                </div>
              )}

              {calculating && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01] space-y-4">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs font-mono text-slate-500 animate-pulse">PROCESSING DATA STRUCTURES...</p>
                </div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  {/* Score & recommendation */}
                  <GlassCard glowColor={result.recommendation === "Approve" ? "green" : "red"} className="border border-white/[0.04]">
                    <div className="text-center space-y-4">
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest font-bold block">
                        Calculation output ({result.model_name})
                      </span>
                      
                      <div className="flex justify-center items-center py-2">
                        <div className="relative w-36 h-36 flex flex-col items-center justify-center rounded-full border border-white/[0.04] bg-[#020308]/60 shadow-inner">
                          <span className="text-4xl font-extrabold text-white font-mono">{result.credit_score}</span>
                          <span className="text-[9px] text-slate-500 font-mono mt-0.5 tracking-wider">CREDIT SCORE</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className={`mx-auto w-32 border py-1 rounded-full text-[10px] font-mono font-bold text-center uppercase ${getRiskColor(result.risk_category)}`}>
                          {result.risk_category} Risk
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2">
                          Default probability: <span className="font-mono font-semibold text-white">{(result.default_probability * 100).toFixed(2)}%</span>
                        </p>
                      </div>

                      <div className="border-t border-white/[0.04] pt-4 flex flex-col items-center">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Underwriting decision</span>
                        <h4 className={`text-2xl font-black uppercase mt-1 tracking-wider ${
                          result.recommendation === "Approve" ? "text-cyan-400" : "text-red-400"
                        }`}>
                          {result.recommendation}D
                        </h4>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono">
                          Confidence Score: {(result.confidence_score * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Fraud Warnings */}
                  {result.fraud_flags && result.fraud_flags.length > 0 && (
                    <GlassCard glowColor="red" className="border-red-950/40">
                      <h3 className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase font-mono tracking-wider mb-3">
                        <AlertTriangle className="w-4 h-4" /> Security fraud warnings ({result.fraud_flags.length})
                      </h3>
                      <ul className="text-[11px] text-red-200/80 space-y-2 list-disc pl-4 font-sans leading-relaxed">
                        {result.fraud_flags.map((flag: string, i: number) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </GlassCard>
                  )}

                  {/* Suggestions */}
                  <GlassCard className="border border-white/[0.04]">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider mb-3">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" /> Score optimization plan
                    </h3>
                    <ul className="text-[11px] text-slate-300 space-y-3 font-sans leading-normal">
                      {result.suggestions.map((sug: string, i: number) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-cyan-400 font-bold font-mono">[{i+1}]</span>
                          <span>{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </GlassCard>

                  {/* Local SHAP Waterfall */}
                  {result.shap_explanations && result.shap_explanations.length > 0 && (
                    <GlassCard className="border border-white/[0.04]">
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono tracking-wider mb-4">
                        <BarChart2 className="w-4 h-4 text-cyan-400" /> SHAP Feature Impact
                      </h3>
                      
                      <div className="space-y-3">
                        {result.shap_explanations.map((item: any, i: number) => {
                          const isPositive = item.shap_value > 0;
                          const absVal = Math.min(100, Math.abs(item.shap_value) * 300);
                          
                          return (
                            <div key={i} className="space-y-1 text-xs">
                              <div className="flex justify-between font-mono text-[9px] text-slate-400">
                                <span>{item.feature}</span>
                                <span className={isPositive ? "text-red-400" : "text-emerald-400 font-semibold"}>
                                  {isPositive ? "+" : ""}{item.shap_value.toFixed(3)}
                                </span>
                              </div>
                              
                              <div className="w-full h-1.5 bg-[#0b0f19] border border-white/[0.04] rounded-full overflow-hidden flex">
                                {!isPositive ? (
                                  <div className="flex-1 flex justify-end">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-l-full" 
                                      style={{ width: `${absVal}%` }}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-1" />
                                )}
                                
                                <div className="w-0.5 h-full bg-slate-700" />
                                
                                {isPositive ? (
                                  <div className="flex-1 flex justify-start">
                                    <div 
                                      className="h-full bg-red-500 rounded-r-full" 
                                      style={{ width: `${absVal}%` }}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex-1" />
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[8px] text-slate-500 mt-4 font-mono text-center uppercase tracking-wider">
                        Red: Increases default risk  |  Green: Lowers default risk
                      </p>
                    </GlassCard>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Bulk Tab */
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-1">
              <GlassCard className="border border-white/[0.04]">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/[0.04] pb-3">
                  <Upload className="w-4.5 h-4.5 text-cyan-400" /> Batch CSV Upload
                </h2>
                
                <div className="bg-[#070913]/60 border border-white/[0.06] p-4 rounded-2xl mb-6 space-y-2.5 text-[11px] text-slate-300 leading-relaxed font-sans">
                  <h3 className="font-bold text-cyan-400 font-mono uppercase tracking-wider">CSV Template Format</h3>
                  <p>Upload a CSV file containing headers matching exactly these features:</p>
                  <div className="bg-[#0b0f19] p-2.5 rounded-xl border border-white/[0.04] font-mono text-[9px] text-slate-400 leading-normal select-all">
                    income, employment_status, employment_duration_months, debt_to_income_ratio, payment_history_score, existing_loans_count, total_debt, savings_balance
                  </div>
                  <p className="text-slate-500 font-mono text-[10px]">
                    * Maximum file size limit is 5MB.
                  </p>
                </div>

                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="border border-dashed border-white/[0.06] rounded-2xl p-8 flex flex-col items-center justify-center bg-[#070913]/20 hover:bg-[#070913]/40 transition-colors">
                    <Upload className="w-8 h-8 text-cyan-400 mb-3" />
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      id="csv-file-picker"
                    />
                    <label htmlFor="csv-file-picker" className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer font-bold font-mono uppercase tracking-wider">
                      {csvFile ? csvFile.name : "Select CSV Spreadsheet"}
                    </label>
                    {csvFile && (
                      <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                        Size: {(csvFile.size / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>

                  {bulkError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-2xl text-xs text-center font-mono">
                      {bulkError}
                    </div>
                  )}

                  <Magnetic className="w-full" strength={0.35} scale={1.04}>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={bulkUploading || !csvFile}
                      className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {bulkUploading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" data-magnetic-inner />
                      ) : (
                        <span data-magnetic-inner>Process Batch Run</span>
                      )}
                    </motion.button>
                  </Magnetic>
                </form>
              </GlassCard>
            </div>

            <div className="lg:col-span-2">
              {!bulkResult && !bulkUploading && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01]">
                  <FileText className="w-10 h-10 text-slate-600 mb-4" />
                  <h3 className="text-slate-400 text-xs font-bold font-mono uppercase tracking-wider">Batch Processing Idle</h3>
                  <p className="text-[11px] text-slate-500 mt-2 max-w-[250px] leading-relaxed">
                    Select and run a CSV spreadsheet file to perform batch calculations across multiple client parameters.
                  </p>
                </div>
              )}

              {bulkUploading && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01] space-y-4">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                  <p className="text-xs font-mono text-slate-500 animate-pulse">EXTRACTING CSV DATA STRUCTURES...</p>
                </div>
              )}

              {bulkResult && (
                <GlassCard className="space-y-6 border border-white/[0.04]">
                  <h2 className="text-sm font-semibold text-white uppercase font-mono tracking-wider border-b border-white/[0.04] pb-4 flex justify-between items-center">
                    <span>Batch Output Summary</span>
                    <span className="text-xs text-cyan-400">{bulkResult.model_name}</span>
                  </h2>

                  {/* mini statistics */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-[#070913]/60 border border-white/[0.04] p-3 rounded-2xl">
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Total Rows</span>
                      <h4 className="text-xl font-bold text-white mt-1 font-mono">{bulkResult.total_records}</h4>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl text-emerald-400">
                      <span className="text-[10px] text-emerald-500/60 font-mono uppercase">Approvals</span>
                      <h4 className="text-xl font-bold text-emerald-400 mt-1 font-mono">{bulkResult.approvals}</h4>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-2xl text-red-400">
                      <span className="text-[10px] text-red-500/60 font-mono uppercase">Rejections</span>
                      <h4 className="text-xl font-bold text-red-400 mt-1 font-mono">{bulkResult.rejections}</h4>
                    </div>
                  </div>

                  {/* Table details */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-[10px] font-mono uppercase text-slate-500">
                          <th className="py-2.5 px-3 text-center">Row</th>
                          <th className="py-2.5 px-3">Applicant</th>
                          <th className="py-2.5 px-3 text-center">FICO</th>
                          <th className="py-2.5 px-3 text-center">Risk Tier</th>
                          <th className="py-2.5 px-3 text-center">Default Prob</th>
                          <th className="py-2.5 px-3 text-center">Recommendation</th>
                          <th className="py-2.5 px-3 text-right">Fraud Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {bulkResult.predictions.map((p: any, i: number) => (
                          <tr key={i} className="hover:bg-white/[0.01]">
                            <td className="py-3 px-3 text-center font-mono text-slate-500">{p.row_index + 1}</td>
                            <td className="py-3 px-3 font-semibold text-slate-200">{p.customer_name}</td>
                            <td className="py-3 px-3 text-center font-mono text-slate-300">{p.credit_score}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${getRiskColor(p.risk_category)}`}>
                                {p.risk_category}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center font-mono text-slate-300">{(p.default_probability * 100).toFixed(1)}%</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`font-mono font-bold ${p.recommendation === "Approve" ? "text-cyan-400" : "text-red-400"}`}>
                                {p.recommendation.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right">
                              {p.fraud_alerts_count > 0 ? (
                                <span className="text-red-400 font-bold font-mono">🚨 {p.fraud_alerts_count} Flagged</span>
                              ) : (
                                <span className="text-slate-500 font-mono">Clean</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
