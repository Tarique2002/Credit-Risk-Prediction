import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { 
  Users, Search, UserPlus, RefreshCw, 
  ArrowLeft, ArrowRight, Mail, Phone,
  ChevronLeft, ChevronRight, X, Sparkles,
  Briefcase, ShieldCheck, DollarSign
} from "lucide-react";
import { apiFetch } from "../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "../components/Magnetic";

const customerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Invalid phone number"),
  income: z.number().nonnegative("Income must be a positive number"),
  employment_status: z.enum(["employed", "unemployed", "self_employed", "retired"]),
  employment_duration_months: z.number().int().nonnegative("Duration must be 0 or more months"),
  debt_to_income_ratio: z.number().min(0).max(2, "Ratio must be between 0.0 and 2.0"),
  payment_history_score: z.number().min(0).max(100, "Score must be between 0 and 100"),
  existing_loans_count: z.number().int().nonnegative("Count must be 0 or more"),
  total_debt: z.number().nonnegative("Debt must be a positive number"),
  savings_balance: z.number().nonnegative("Savings must be a positive number"),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export const CustomerDirectory: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      income: 60000,
      employment_status: "employed",
      employment_duration_months: 24,
      debt_to_income_ratio: 0.28,
      payment_history_score: 90,
      existing_loans_count: 1,
      total_debt: 7500,
      savings_balance: 12000,
    }
  });

  const fetchCustomers = async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = `/customers/?skip=${skip}&limit=${limit}${search ? `&query=${encodeURIComponent(search)}` : ""}`;
      const data = await apiFetch(endpoint);
      setCustomers(data.items || []);
      setTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load customer list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [skip, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setSkip(0);
  };

  const onSubmitCustomer = async (data: CustomerFormData) => {
    setSubmitting(true);
    setFormError(null);
    try {
      await apiFetch("/customers/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setShowAddForm(false);
      reset();
      fetchCustomers();
    } catch (err: any) {
      setFormError(err.message || "Failed to register customer profile");
    } finally {
      setSubmitting(false);
    }
  };

  const pageCount = Math.ceil(total / limit) || 1;
  const currentPage = Math.floor(skip / limit) + 1;

  const handlePageChange = (page: number) => {
    setSkip((page - 1) * limit);
  };

  return (
    <div className="space-y-8 text-left relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="text-cyan-400 w-5 h-5" /> Client Directory
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Maintain customer risk ledger sheets, update savings indicators, and trigger predictions.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all text-xs font-semibold cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Register Borrower
        </motion.button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-xs font-mono">
          {error}
        </div>
      )}

      {/* Main Ledger Table and Filters */}
      <div className="p-6 rounded-3xl glass-panel border-white/[0.04]">
        
        {/* Table Search & quick utilities bar */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-72 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center px-3.5 py-2 hover:border-white/[0.08] transition-all">
            <Search className="w-4.5 h-4.5 text-slate-500 shrink-0" />
            <input
              type="text"
              placeholder="Search by client name..."
              value={search}
              onChange={handleSearchChange}
              className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full ml-2"
            />
          </div>
          
          <div className="text-[10px] font-mono text-slate-500 flex items-center justify-end uppercase tracking-wider">
            {total} RECORDED PROFILE(S)
          </div>
        </div>

        {/* Directory Ledger Grid */}
        {loading ? (
          <div className="space-y-3 py-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 w-full shimmer-placeholder rounded-xl" />
            ))}
          </div>
        ) : customers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/[0.04] text-[9px] font-mono uppercase text-slate-500">
                  <th className="py-3 px-4">Borrower Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4 text-center">Base Income</th>
                  <th className="py-3 px-4 text-center">FICO History</th>
                  <th className="py-3 px-4 text-center">DTI Ratio</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="py-3.5 px-4 font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                      <Link to={`/customers/${c.id}`} className="block">
                        {c.first_name} {c.last_name}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                      <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-600" /> {c.email}</div>
                      <div className="flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-slate-600" /> {c.phone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      ${c.income.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="font-mono text-slate-200">{c.payment_history_score}/100</div>
                      <span className="text-[9px] text-slate-500 font-mono">history score</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {(c.debt_to_income_ratio * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link 
                        to={`/customers/${c.id}`}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 uppercase"
                      >
                        Profile File <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <Users className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="text-slate-400 text-xs font-mono uppercase tracking-wider font-bold">Ledger Empty</h4>
            <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-normal">
              No registered customer profiles match your search criteria. Create one using the button above.
            </p>
          </div>
        )}

        {/* Pagination Console */}
        {pageCount > 1 && (
          <div className="flex justify-between items-center border-t border-white/[0.04] pt-6 mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3.5 py-1.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] text-slate-400 hover:text-white rounded-xl text-xs transition-all disabled:opacity-40 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="text-[10px] font-mono text-slate-500">
              PAGE {currentPage} OF {pageCount}
            </span>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pageCount}
              className="px-3.5 py-1.5 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] text-slate-400 hover:text-white rounded-xl text-xs transition-all disabled:opacity-40 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      {/* Drawer slide-over for borrower registration */}
      <AnimatePresence>
        {showAddForm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setShowAddForm(false)}
            />
            
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#080d19]/90 backdrop-blur-2xl border-l border-white/[0.08] shadow-2xl z-50 overflow-y-auto p-6 md:p-8"
            >
              {/* Drawer Title header */}
              <div className="flex justify-between items-center border-b border-white/[0.04] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Register Borrower</h3>
                    <p className="text-[8px] font-mono text-slate-500 uppercase">Input customer parameters</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)}
                  className="p-1 hover:bg-white/5 text-slate-400 hover:text-white rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3.5 rounded-2xl text-[10px] font-mono mb-4">
                  {formError}
                </div>
              )}

              {/* Form elements */}
              <form onSubmit={handleSubmit(onSubmitCustomer)} className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">First Name</label>
                    <input 
                      type="text" 
                      {...register("first_name")} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    {errors.first_name && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.first_name.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">Last Name</label>
                    <input 
                      type="text" 
                      {...register("last_name")} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                    {errors.last_name && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.last_name.message}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase text-slate-400">Email Address</label>
                  <input 
                    type="email" 
                    {...register("email")} 
                    className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  {errors.email && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.email.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase text-slate-400">Phone Number</label>
                  <input 
                    type="text" 
                    {...register("phone")} 
                    className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  {errors.phone && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.phone.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase text-slate-400">Annual Base Income ($)</label>
                  <input 
                    type="number" 
                    {...register("income", { valueAsNumber: true })} 
                    className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                  {errors.income && <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.income.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">Employment</label>
                    <select 
                      {...register("employment_status")} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="employed">Employed</option>
                      <option value="self_employed">Self-Employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">Duration (Months)</label>
                    <input 
                      type="number" 
                      {...register("employment_duration_months", { valueAsNumber: true })} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">DTI Ratio</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      {...register("debt_to_income_ratio", { valueAsNumber: true })} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">FICO Score Score</label>
                    <input 
                      type="number" 
                      {...register("payment_history_score", { valueAsNumber: true })} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">Total Debt ($)</label>
                    <input 
                      type="number" 
                      {...register("total_debt", { valueAsNumber: true })} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-mono uppercase text-slate-400">Savings ($)</label>
                    <input 
                      type="number" 
                      {...register("savings_balance", { valueAsNumber: true })} 
                      className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono uppercase text-slate-400">Active Loan count</label>
                  <input 
                    type="number" 
                    {...register("existing_loans_count", { valueAsNumber: true })} 
                    className="w-full bg-[#030712] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="w-1/2 bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] text-slate-400 rounded-xl py-2.5 text-xs font-mono uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-1/2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl py-2.5 text-xs font-mono uppercase cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {submitting ? "Seeding DB..." : "Seed Registry"}
                  </button>
                </div>

              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
export default CustomerDirectory;
