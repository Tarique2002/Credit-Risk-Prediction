import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Calculator, Upload, FileText, AlertTriangle, ShieldCheck, 
  RefreshCw, BarChart2, Users, ChevronRight, ChevronLeft, 
  ThumbsUp, ThumbsDown, CheckCircle2, AlertOctagon, Sparkles,
  Download, Printer, FileClock, UserCheck
} from "lucide-react";
import { apiFetch, apiUploadFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | any>("single");
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

  // Multi-step form step state
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    trigger,
    reset,
    formState: { errors },
  } = useForm<PredictFormData>({
    resolver: zodResolver(predictSchema),
    defaultValues: {
      income: 65000,
      employment_status: "employed",
      employment_duration_months: 24,
      debt_to_income_ratio: 0.28,
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
    if (user?.role !== "user") {
      loadCustomers();
    } else {
      // Pre-fill standard user profile details from customers/me
      apiFetch("/customers/me")
        .then((res) => {
          if (res.profile) {
            setValue("customer_id", res.profile.id.toString());
            setValue("first_name", res.profile.first_name);
            setValue("last_name", res.profile.last_name);
            setValue("email", res.profile.email);
            setValue("phone", res.profile.phone);
            setValue("income", res.profile.income);
            setValue("employment_status", res.profile.employment_status);
            setValue("employment_duration_months", res.profile.employment_duration_months);
            setValue("debt_to_income_ratio", res.profile.debt_to_income_ratio);
            setValue("payment_history_score", res.profile.payment_history_score);
            setValue("existing_loans_count", res.profile.existing_loans_count);
            setValue("total_debt", res.profile.total_debt);
            setValue("savings_balance", res.profile.savings_balance);
          }
        })
        .catch(() => console.log("No personal profile found for this user account."));
    }
  }, [user]);

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
      
      // Auto-validate and jump to step 4 or 5
      trigger();
      setStep(5);
    }
  };

  const handleNextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate: (keyof PredictFormData)[] = [];
    if (step === 1) {
      fieldsToValidate = ["first_name", "last_name", "email", "phone"];
    } else if (step === 2) {
      fieldsToValidate = ["income", "employment_status", "employment_duration_months"];
    } else if (step === 3) {
      fieldsToValidate = ["savings_balance", "total_debt", "debt_to_income_ratio"];
    } else if (step === 4) {
      fieldsToValidate = ["payment_history_score", "existing_loans_count"];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep(prev => Math.min(totalSteps, prev + 1));
    }
  };

  const handlePrevStep = () => {
    setStep(prev => Math.max(1, prev - 1));
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
      case "Very Low": return "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
      case "Low": return "text-green-400 border-green-500/20 bg-green-500/5";
      case "Medium": return "text-amber-400 border-amber-500/20 bg-amber-500/5";
      case "High": return "text-orange-400 border-orange-500/20 bg-orange-500/5";
      case "Very High": return "text-red-400 border-red-500/20 bg-red-500/5";
      default: return "text-slate-400 border-slate-800 bg-slate-900/40";
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // SHAP formatting drivers
  const positiveDrivers = result?.shap_explanations?.filter((e: any) => e.shap_value < 0) || [];
  const negativeDrivers = result?.shap_explanations?.filter((e: any) => e.shap_value >= 0) || [];

  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="border-b border-white/[0.04] pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Calculator className="text-cyan-400 w-5 h-5" /> Credit Decisioning
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Perform predictive default calculations, run ensemble simulations, and inspect explainable risk vectors.
          </p>
        </div>

        {/* Tab Selector Links */}
        {user?.role !== "user" && (
          <div className="flex bg-[#0b0f19] border border-white/[0.04] p-1 rounded-xl shrink-0">
            <button
              onClick={() => {
                setActiveTab("single");
                setResult(null);
              }}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === "single"
                  ? "bg-white/[0.04] text-cyan-400 font-bold border border-white/[0.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Single Underwriting
            </button>
            <button
              onClick={() => setActiveTab("bulk")}
              className={`px-4 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                activeTab === "bulk"
                  ? "bg-white/[0.04] text-cyan-400 font-bold border border-white/[0.02]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Bulk CSV Processing
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "single" ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            
            {/* Form Steps Block */}
            <div className="lg:col-span-7">
              <div className="p-6 md:p-8 rounded-3xl glass-panel border-white/[0.04]">
                
                {/* Form header with prefill options */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white/[0.04] pb-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-cyan-400" /> Borrower Profile Application
                  </h2>
                  
                  {user?.role !== "user" && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <select
                        onChange={handleCustomerSelect}
                        className="bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-1.5 text-[10px] font-mono text-cyan-400 focus:outline-none w-full sm:w-auto"
                        defaultValue=""
                      >
                        <option value="" disabled>Pre-fill from profile registry...</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id.toString()}>
                            {c.first_name} {c.last_name} ({c.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Steps Navigation indicator */}
                <div className="mb-8 flex items-center justify-between text-[10px] font-mono font-bold text-slate-500">
                  {[...Array(totalSteps)].map((_, i) => {
                    const stepNum = i + 1;
                    const isActive = step === stepNum;
                    const isCompleted = step > stepNum;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center border transition-all ${
                          isActive 
                            ? "border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]" 
                            : isCompleted
                            ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                            : "border-white/[0.06] text-slate-500 bg-[#030712]"
                        }`}>
                          {stepNum}
                        </span>
                        <span className={`hidden sm:inline ${isActive ? "text-slate-200" : ""}`}>
                          {stepNum === 1 && "Identity"}
                          {stepNum === 2 && "Income"}
                          {stepNum === 3 && "Assets"}
                          {stepNum === 4 && "Credit"}
                          {stepNum === 5 && "Review"}
                        </span>
                        {stepNum < totalSteps && <span className="text-white/5 font-normal">|</span>}
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSubmit(onSubmitSingle)} className="space-y-6">
                  <input type="hidden" {...register("customer_id")} />
                  
                  {/* Step 1: Personal Details */}
                  {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Step 1: Borrower Identity</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-400">First Name</label>
                          <input
                            type="text"
                            {...register("first_name")}
                            className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          />
                          {errors.first_name && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.first_name.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono uppercase text-slate-400">Last Name</label>
                          <input
                            type="text"
                            {...register("last_name")}
                            className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          />
                          {errors.last_name && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.last_name.message}</p>}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Email Address</label>
                        <input
                          type="email"
                          {...register("email")}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.email && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.email.message}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Contact Number</label>
                        <input
                          type="text"
                          {...register("phone")}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.phone && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.phone.message}</p>}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Employment */}
                  {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Step 2: Employment & Income</h3>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Employment Status</label>
                        <select
                          {...register("employment_status")}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 cursor-pointer"
                        >
                          <option value="employed">Employed (Full-Time)</option>
                          <option value="self_employed">Self-Employed</option>
                          <option value="unemployed">Unemployed</option>
                          <option value="retired">Retired</option>
                        </select>
                        {errors.employment_status && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.employment_status.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Employment Duration (Months)</label>
                        <input
                          type="number"
                          {...register("employment_duration_months", { valueAsNumber: true })}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.employment_duration_months && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.employment_duration_months.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Annual Base Income ($)</label>
                        <input
                          type="number"
                          {...register("income", { valueAsNumber: true })}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.income && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.income.message}</p>}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Assets & Liabilities */}
                  {step === 3 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Step 3: Assets & Liabilities</h3>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Savings Account Balance ($)</label>
                        <input
                          type="number"
                          {...register("savings_balance", { valueAsNumber: true })}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.savings_balance && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.savings_balance.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Total Outstanding Liabilities / Debt ($)</label>
                        <input
                          type="number"
                          {...register("total_debt", { valueAsNumber: true })}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.total_debt && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.total_debt.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Debt-To-Income Ratio (DTI)</label>
                        <input
                          type="number"
                          step="0.01"
                          {...register("debt_to_income_ratio", { valueAsNumber: true })}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.debt_to_income_ratio && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.debt_to_income_ratio.message}</p>}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Credit Score */}
                  {step === 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                      <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Step 4: Credit History</h3>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Bureau Payment History Score (0 - 100)</label>
                        <input
                          type="number"
                          {...register("payment_history_score", { valueAsNumber: true })}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.payment_history_score && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.payment_history_score.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono uppercase text-slate-400">Active / Existing Loan Count</label>
                        <input
                          type="number"
                          {...register("existing_loans_count", { valueAsNumber: true })}
                          className="w-full bg-[#030712]/60 border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.existing_loans_count && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.existing_loans_count.message}</p>}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 5: Review & Submit */}
                  {step === 5 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <h3 className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wider">Step 5: Review & Submit</h3>
                      
                      <div className="p-4 bg-white/[0.01] border border-white/[0.03] rounded-2xl grid grid-cols-2 gap-4 text-xs font-sans">
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Applicant</span>
                          <span className="font-semibold text-slate-200">{getValues("first_name")} {getValues("last_name")}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Income</span>
                          <span className="font-semibold text-slate-200">${Number(getValues("income")).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">DTI Ratio</span>
                          <span className="font-semibold text-slate-200">{(Number(getValues("debt_to_income_ratio")) * 100).toFixed(0)}%</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Payment Score</span>
                          <span className="font-semibold text-slate-200">{getValues("payment_history_score")}/100</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Savings</span>
                          <span className="font-semibold text-slate-200">${Number(getValues("savings_balance")).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-[9px] font-mono text-slate-500 uppercase block">Loans</span>
                          <span className="font-semibold text-slate-200">{getValues("existing_loans_count")} Active</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 bg-cyan-500/5 border border-cyan-500/10 text-cyan-400 rounded-xl text-[10px]">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <span>ML classification structures will run ensemble default risks instantly.</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Form Footer Action Navigation Buttons */}
                  <div className="flex items-center justify-between border-t border-white/[0.04] pt-6 mt-6">
                    {step > 1 ? (
                      <button
                        type="button"
                        onClick={handlePrevStep}
                        className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] rounded-xl text-slate-400 hover:text-white transition-all text-xs font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                      >
                        <ChevronLeft className="w-4 h-4" /> Previous
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          reset();
                          setResult(null);
                          setStep(1);
                        }}
                        className="px-4 py-2 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] rounded-xl text-slate-500 hover:text-slate-300 transition-all text-xs font-mono uppercase tracking-wider cursor-pointer"
                      >
                        Reset Form
                      </button>
                    )}

                    {step < totalSteps ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-cyan-400 hover:text-white rounded-xl text-xs font-mono uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
                      >
                        Next Step <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={calculating}
                        className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-md animate-pulse-glow"
                      >
                        {calculating ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span>Submit & Decision</span>
                        )}
                      </button>
                    )}
                  </div>

                </form>
              </div>
            </div>

            {/* Results Side */}
            <div className="lg:col-span-5 space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-xs font-mono text-center leading-relaxed">
                  {error}
                </div>
              )}

              {!result && !calculating && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01]">
                  <Calculator className="w-10 h-10 text-slate-600 mb-4" />
                  <h3 className="text-slate-400 text-xs font-bold font-mono uppercase tracking-wider">Awaiting Decision</h3>
                  <p className="text-[10px] text-slate-500 mt-2 max-w-[200px] leading-relaxed">
                    Complete the application form wizard steps and submit to generate risk mapping.
                  </p>
                </div>
              )}

              {calculating && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01] space-y-4">
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                  <p className="text-[10px] font-mono text-slate-500 animate-pulse uppercase tracking-widest">Running neural ensembles...</p>
                </div>
              )}

              {/* Redesigned AI prediction report result */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6"
                >
                  <div className="p-6 md:p-8 rounded-3xl glass-panel border-white/[0.04] relative overflow-hidden">
                    
                    {/* Header operations controls */}
                    <div className="flex items-center justify-between border-b border-white/[0.04] pb-4 mb-6">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4.5 h-4.5 text-cyan-400" />
                        <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold">Credit Intel Audit Report</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={handlePrint}
                          className="p-1.5 hover:bg-white/5 rounded text-slate-400 hover:text-white transition-colors"
                          title="Print Report"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Gauge Meter & recommendation */}
                    <div className="text-center space-y-4">
                      
                      {/* Interactive ring gauge */}
                      <div className="flex justify-center items-center py-2 relative">
                        
                        <div className="w-36 h-36 rounded-full border border-white/[0.04] bg-[#030712]/80 flex flex-col items-center justify-center shadow-2xl relative">
                          <span className="text-4xl font-extrabold text-white font-mono">{result.credit_score}</span>
                          <span className="text-[8px] text-slate-500 font-mono mt-0.5 tracking-widest uppercase">FICO Score</span>
                          
                          {/* Radial border overlay showing default probability */}
                          <div 
                            className={`absolute inset-0 rounded-full border-2 ${
                              result.recommendation === "Approve" ? "border-emerald-500/30" : "border-red-500/30"
                            }`} 
                          />
                        </div>

                      </div>

                      <div className="space-y-2">
                        <div className={`mx-auto w-32 border py-1 rounded-full text-[10px] font-mono font-bold text-center uppercase ${getRiskColor(result.risk_category)}`}>
                          {result.risk_category} Risk
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Forecast Default Risk: <span className="font-mono font-semibold text-white">{(result.default_probability * 100).toFixed(2)}%</span>
                        </p>
                      </div>

                      {/* Underwriting Recommendation */}
                      <div className="border-y border-white/[0.04] py-4 my-4 flex justify-between items-center px-2">
                        <div className="text-left">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Bureau Status</span>
                          <h4 className={`text-xl font-bold uppercase mt-1 tracking-wider ${
                            result.recommendation === "Approve" ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {result.recommendation === "Approve" ? "Approved" : "Rejected"}
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Decision Conf</span>
                          <span className="font-mono text-slate-200 text-sm font-semibold">{(result.confidence_score * 100).toFixed(1)}%</span>
                        </div>
                      </div>

                    </div>

                    {/* Fraud Flags warning blocks */}
                    {result.fraud_flags && result.fraud_flags.length > 0 && (
                      <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 mb-6">
                        <h3 className="text-[10px] font-bold text-red-400 flex items-center gap-1.5 uppercase font-mono tracking-wider mb-2">
                          <AlertOctagon className="w-3.5 h-3.5" /> Security Fraud warnings ({result.fraud_flags.length})
                        </h3>
                        <ul className="text-[10px] text-red-200/70 space-y-1 list-disc pl-4 font-sans">
                          {result.fraud_flags.map((flag: string, i: number) => (
                            <li key={i}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Positive & negative drivers */}
                    <div className="space-y-4 my-6">
                      <h3 className="text-[10px] font-bold text-slate-300 uppercase font-mono tracking-wider border-b border-white/[0.04] pb-2">
                        Audit Risk Drivers
                      </h3>
                      
                      {/* Positive (decreases risk) */}
                      {positiveDrivers.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" /> Favorable Indicators
                          </span>
                          <div className="space-y-1.5">
                            {positiveDrivers.slice(0, 3).map((d: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] bg-emerald-500/[0.02] border border-emerald-500/5 p-2 rounded-lg text-slate-300">
                                <span>{d.feature.replace(/_/g, " ")}</span>
                                <span className="font-mono text-emerald-400 font-bold">{d.shap_value.toFixed(3)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Negative (increases risk) */}
                      {negativeDrivers.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <span className="text-[9px] font-mono text-red-400 uppercase tracking-widest flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" /> Adverse Risk Indicators
                          </span>
                          <div className="space-y-1.5">
                            {negativeDrivers.slice(0, 3).map((d: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-center text-[10px] bg-red-500/[0.02] border border-red-500/5 p-2 rounded-lg text-slate-300">
                                <span className="capitalize">{d.feature.replace(/_/g, " ")}</span>
                                <span className="font-mono text-red-400 font-bold">+{d.shap_value.toFixed(3)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Suggestions optimization timeline guidelines */}
                    <div className="space-y-3 pt-4 border-t border-white/[0.04]">
                      <h3 className="text-[10px] font-bold text-slate-300 uppercase font-mono tracking-wider">
                        Rehabilitation Guidelines
                      </h3>
                      <div className="relative border-l border-white/5 pl-4 space-y-4 text-[10px] text-slate-400">
                        {result.suggestions.map((sug: string, idx: number) => (
                          <div key={idx} className="relative">
                            <span className="absolute -left-[20px] top-0.5 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                            <p className="font-semibold text-slate-300 font-mono text-[9px] uppercase">Plan phase {idx + 1}</p>
                            <p className="mt-1 leading-normal">{sug}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </div>

          </motion.div>
        ) : (
          /* Bulk Tab Redesign */
          <motion.div
            key="bulk"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            <div className="lg:col-span-4">
              <div className="p-6 md:p-8 rounded-3xl glass-panel border-white/[0.04]">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/[0.04] pb-3">
                  <Upload className="w-4.5 h-4.5 text-cyan-400" /> Batch Processing Console
                </h2>
                
                <div className="bg-[#030712] border border-white/[0.06] p-4.5 rounded-2xl mb-6 space-y-3 text-[10px] text-slate-400 leading-relaxed font-sans">
                  <h3 className="font-bold text-cyan-400 font-mono uppercase tracking-wider">CSV Data Template Schema</h3>
                  <p>Incorporate the exact features in your CSV headers:</p>
                  <div className="bg-black/40 p-2.5 rounded-xl border border-white/[0.04] font-mono text-[8px] text-slate-400 leading-normal select-all break-all">
                    income, employment_status, employment_duration_months, debt_to_income_ratio, payment_history_score, existing_loans_count, total_debt, savings_balance
                  </div>
                  <p className="text-slate-500 font-mono text-[9px] leading-normal">
                    * Fits standardized CatBoost schemas. Max file size: 5MB.
                  </p>
                </div>

                <form onSubmit={handleBulkUpload} className="space-y-4">
                  <div className="border border-dashed border-white/[0.06] rounded-2xl p-8 flex flex-col items-center justify-center bg-white/[0.01] hover:bg-white/[0.02] transition-colors relative cursor-pointer group">
                    <input
                      type="file"
                      id="csv-file-selector"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-medium text-slate-300">
                      {csvFile ? csvFile.name : "Select CSV file"}
                    </span>
                    <span className="text-[9px] text-slate-500 mt-1 font-mono uppercase">
                      {csvFile ? `${(csvFile.size / 1024).toFixed(1)} KB` : "Drag and drop or browse"}
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={bulkUploading || !csvFile}
                    className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl py-3 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {bulkUploading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>Run Batch Predict</span>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Bulk result panel */}
            <div className="lg:col-span-8 space-y-6">
              {bulkError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-xs font-mono text-center">
                  {bulkError}
                </div>
              )}

              {!bulkResult && !bulkUploading && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01]">
                  <FileClock className="w-10 h-10 text-slate-600 mb-4" />
                  <h3 className="text-slate-400 text-xs font-bold font-mono uppercase tracking-wider">Queue Awaiting Upload</h3>
                  <p className="text-[10px] text-slate-500 mt-2 max-w-[220px] leading-relaxed">
                    Upload a batch CSV file to view statistical distribution curves and predict classifications.
                  </p>
                </div>
              )}

              {bulkUploading && (
                <div className="flex flex-col items-center justify-center border border-white/[0.04] rounded-3xl p-12 text-center h-[350px] bg-white/[0.01] space-y-4">
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                  <p className="text-[10px] font-mono text-slate-500 animate-pulse">CLASSIFYING BATCH ROWS...</p>
                </div>
              )}

              {bulkResult && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 md:p-8 rounded-3xl glass-panel border-white/[0.04] space-y-6"
                >
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/[0.04] pb-3 mb-4">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Batch calculation complete
                  </h2>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-white/[0.01] border border-white/[0.03] p-4 rounded-2xl">
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Processed Rows</span>
                      <p className="text-2xl font-bold text-white mt-1 font-mono">{bulkResult.total_records}</p>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                      <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-wider">Approved</span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{bulkResult.approved_count}</p>
                    </div>
                    <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl">
                      <span className="text-[8px] font-mono text-red-500 uppercase tracking-wider">Rejected</span>
                      <p className="text-2xl font-bold text-red-400 mt-1 font-mono">{bulkResult.rejected_count}</p>
                    </div>
                  </div>

                  {/* Bulk previews list table */}
                  {bulkResult.results && bulkResult.results.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-bold text-slate-300 uppercase font-mono tracking-wider">Preview results</h3>
                      <div className="overflow-x-auto border border-white/[0.04] rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-white/[0.01] border-b border-white/[0.04] text-[8px] font-mono text-slate-500 uppercase">
                              <th className="p-2.5">Row ID</th>
                              <th className="p-2.5 text-center">FICO Score</th>
                              <th className="p-2.5 text-center">Risk Tier</th>
                              <th className="p-2.5 text-center">Probability</th>
                              <th className="p-2.5 text-right">Result</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.02] font-mono text-[10px]">
                            {bulkResult.results.slice(0, 10).map((row: any, idx: number) => (
                              <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                <td className="p-2.5 text-slate-400">#{idx + 1}</td>
                                <td className="p-2.5 text-center text-slate-200">{row.credit_score}</td>
                                <td className="p-2.5 text-center">
                                  <span className={`px-2 py-0.2 rounded text-[8px] ${getRiskColor(row.risk_category)}`}>
                                    {row.risk_category}
                                  </span>
                                </td>
                                <td className="p-2.5 text-center text-slate-200">{(row.default_probability * 100).toFixed(1)}%</td>
                                <td className={`p-2.5 text-right font-bold ${row.recommendation === "Approve" ? "text-emerald-400" : "text-red-400"}`}>
                                  {row.recommendation.toUpperCase()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {bulkResult.results.length > 10 && (
                        <p className="text-[8px] text-slate-500 text-center font-mono">
                          * SHOWING TOP 10 PREVIEWS OF {bulkResult.results.length} RECORDED ROWS
                        </p>
                      )}
                    </div>
                  )}

                </motion.div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default Predict;
