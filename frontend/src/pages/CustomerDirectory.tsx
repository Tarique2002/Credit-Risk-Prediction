import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { 
  Users, Search, UserPlus, RefreshCw, 
  ArrowLeft, ArrowRight, Mail, Phone
} from "lucide-react";
import { apiFetch } from "../utils/api";
import { GlassCard } from "../components/GlassCard";
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
  const [limit] = useState(15);
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
      income: 50000,
      employment_status: "employed",
      employment_duration_months: 12,
      debt_to_income_ratio: 0.25,
      payment_history_score: 95,
      existing_loans_count: 1,
      total_debt: 5000,
      savings_balance: 10000,
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

  const pageIndex = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="text-cyan-400 w-6 h-6" /> Client Directory
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Browse and manage corporate accounts and client profiles
          </p>
        </div>
        <Magnetic strength={0.3} scale={1.04}>
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-4 py-3 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <UserPlus className="w-4 h-4" data-magnetic-inner /> <span data-magnetic-inner>Add New Customer</span>
          </motion.button>
        </Magnetic>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-500/10 border border-red-500/20 text-red-200 px-5 py-4 rounded-2xl text-xs font-mono"
        >
          {error}
        </motion.div>
      )}

      {/* Add Customer Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <GlassCard glowColor="cyan" className="space-y-6 border border-cyan-500/10">
              <div className="border-b border-white/[0.04] pb-4">
                <h2 className="text-sm font-bold text-white uppercase font-mono tracking-wider">New Profile Registry</h2>
                <p className="text-[11px] text-slate-500 mt-1">Please input customer details accurately. Background validation triggers automatically.</p>
              </div>

              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl text-xs font-mono">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmitCustomer)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Part 1: Personal */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-cyan-400 font-mono uppercase tracking-widest border-l-2 border-cyan-500 pl-2">Personal Identity</h3>
                    
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
                        placeholder="name@email.com"
                      />
                      {errors.email && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-400">Phone</label>
                      <input
                        type="text"
                        {...register("phone")}
                        className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        placeholder="+14155552671"
                      />
                      {errors.phone && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.phone.message}</p>}
                    </div>
                  </div>

                  {/* Part 2: Employment */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-cyan-400 font-mono uppercase tracking-widest border-l-2 border-cyan-500 pl-2">Employment Capacity</h3>
                    
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
                      {errors.employment_status && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.employment_status.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-400">Duration (Months)</label>
                      <input
                        type="number"
                        {...register("employment_duration_months", { valueAsNumber: true })}
                        className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      />
                      {errors.employment_duration_months && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.employment_duration_months.message}</p>}
                    </div>

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
                  </div>

                  {/* Part 3: Financial Risk metrics */}
                  <div className="space-y-4">
                    <h3 className="text-[11px] font-bold text-cyan-400 font-mono uppercase tracking-widest border-l-2 border-cyan-500 pl-2">Financial Risk</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">DTI Ratio</label>
                        <input
                          type="number"
                          step="any"
                          {...register("debt_to_income_ratio", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                          placeholder="e.g. 0.25"
                        />
                        {errors.debt_to_income_ratio && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.debt_to_income_ratio.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Pay Score (%)</label>
                        <input
                          type="number"
                          step="any"
                          {...register("payment_history_score", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.payment_history_score && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.payment_history_score.message}</p>}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono uppercase text-slate-400">Savings Account Balance ($)</label>
                      <input
                        type="number"
                        step="any"
                        {...register("savings_balance", { valueAsNumber: true })}
                        className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                      />
                      {errors.savings_balance && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.savings_balance.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Existing Loans</label>
                        <input
                          type="number"
                          {...register("existing_loans_count", { valueAsNumber: true })}
                          className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                        />
                        {errors.existing_loans_count && <p className="text-[10px] font-mono text-red-400 mt-0.5">{errors.existing_loans_count.message}</p>}
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase text-slate-400">Total Debt ($)</label>
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
                </div>

                <div className="flex justify-end gap-3 border-t border-white/[0.04] pt-5 items-center">
                  <Magnetic strength={0.2} scale={1.02}>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="bg-white/[0.02] hover:bg-white/[0.06] text-slate-400 border border-white/[0.04] rounded-xl px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      <span data-magnetic-inner>Cancel</span>
                    </button>
                  </Magnetic>
                  
                  <Magnetic strength={0.3} scale={1.04}>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-5 py-2.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? "Registering..." : <span data-magnetic-inner>Register Profile</span>}
                    </button>
                  </Magnetic>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directory Table */}
      <GlassCard className="border border-white/[0.04]">
        {/* Search tool */}
        <div className="flex items-center bg-[#070913]/60 border border-white/[0.06] rounded-2xl px-4 py-3 mb-6 max-w-md focus-within:border-cyan-500/50 transition-all duration-300">
          <Search className="w-4 h-4 text-slate-500 mr-3" />
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search clients by name or email address..."
            className="bg-transparent border-none text-slate-200 placeholder-slate-600 focus:outline-none w-full text-xs font-mono"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
          </div>
        ) : customers.length === 0 ? (
          <p className="text-slate-500 text-center py-16 text-xs font-mono">No client profiles found matching criteria.</p>
        ) : (
          <div className="space-y-5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.04] text-[10px] font-mono uppercase text-slate-500">
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-right">Income</th>
                    <th className="py-3 px-4 text-center">Employment</th>
                    <th className="py-3 px-4 text-center">Payment History</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-slate-200">
                        <Link to={`/customers/${c.id}`} className="hover:text-cyan-400 transition-colors">
                          {c.first_name} {c.last_name}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{c.email}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">{c.phone}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-200">${c.income.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="capitalize px-2 py-0.5 rounded bg-slate-900 border border-white/[0.04] text-slate-300">
                          {c.employment_status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-emerald-400 font-semibold">{c.payment_history_score}%</td>
                      <td className="py-3.5 px-4 text-right">
                        <Magnetic strength={0.2} scale={1.03}>
                          <Link
                            to={`/customers/${c.id}`}
                            className="bg-white/[0.02] hover:bg-cyan-500/10 border border-white/[0.04] hover:border-cyan-500/20 text-slate-300 hover:text-cyan-400 text-[10px] font-mono font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all inline-block"
                          >
                            <span data-magnetic-inner>View File</span>
                          </Link>
                        </Magnetic>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center pt-4 border-t border-white/[0.04] text-[10px] font-mono text-slate-500">
              <span>Showing {customers.length} of {total} records</span>
              <div className="flex items-center gap-3">
                <Magnetic strength={0.3} scale={1.1}>
                  <button
                    disabled={skip === 0}
                    onClick={() => setSkip(Math.max(0, skip - limit))}
                    className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] p-2 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" data-magnetic-inner />
                  </button>
                </Magnetic>
                <span>Page {pageIndex} / {totalPages}</span>
                <Magnetic strength={0.3} scale={1.1}>
                  <button
                    disabled={pageIndex >= totalPages}
                    onClick={() => setSkip(skip + limit)}
                    className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] p-2 rounded-lg disabled:opacity-30 cursor-pointer transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5" data-magnetic-inner />
                  </button>
                </Magnetic>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};
