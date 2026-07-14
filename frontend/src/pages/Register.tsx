import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, Mail, Users, CheckCircle, RefreshCw, ChevronLeft } from "lucide-react";
import { apiFetch } from "../utils/api";
import { motion } from "framer-motion";
import { Magnetic } from "../components/Magnetic";

const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
    role: z.enum(["admin", "analyst"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "analyst",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          role: data.role,
        }),
      });
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 2500);
    } catch (err: any) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#030712]">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      {/* Back to Home Link */}
      <Link 
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> BACK TO HOMEPAGE
      </Link>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="p-8 md:p-10 rounded-3xl glass-panel border-white/[0.04] shadow-2xl relative overflow-hidden">
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <div className="bg-cyan-500/10 p-4 rounded-3xl border border-cyan-500/20 text-cyan-400">
                <Users className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="absolute inset-0 bg-cyan-500/10 blur-md rounded-full -z-10" />
            </div>
            
            <h1 className="text-xl font-extrabold tracking-widest text-center uppercase bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Register Credentials
            </h1>
            <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
              Establish Agent Identity
            </p>
          </motion.div>

          {success ? (
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-8 space-y-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Registration Completed</h3>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                  Your identity has been seeded in the secure registry. <br /> Redirecting to login terminal...
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-200 p-3.5 rounded-2xl text-[10px] text-center font-mono"
                >
                  {error}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Agent Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full bg-[#070d19]/40 border border-white/[0.06] hover:border-white/[0.12] focus:border-cyan-500/40 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  placeholder="analyst@bank.com"
                />
                {errors.email && (
                  <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Security Password
                </label>
                <input
                  type="password"
                  {...register("password")}
                  className="w-full bg-[#070d19]/40 border border-white/[0.06] hover:border-white/[0.12] focus:border-cyan-500/40 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-[9px] font-mono text-red-400 mt-0.5 max-w-xs leading-tight">{errors.password.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  {...register("confirmPassword")}
                  className="w-full bg-[#070d19]/40 border border-white/[0.06] hover:border-white/[0.12] focus:border-cyan-500/40 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.confirmPassword.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="space-y-1.5">
                <label className="text-[9px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Operational Role
                </label>
                <select
                  {...register("role")}
                  className="w-full bg-[#070d19]/40 border border-white/[0.06] hover:border-white/[0.12] focus:border-cyan-500/40 rounded-2xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none transition-all cursor-pointer"
                >
                  <option value="analyst" className="bg-[#0b0f19] text-slate-200">Risk Analyst</option>
                  <option value="admin" className="bg-[#0b0f19] text-slate-200">System Administrator</option>
                </select>
                {errors.role && (
                  <p className="text-[9px] font-mono text-red-400 mt-0.5">{errors.role.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants} className="pt-2">
                <Magnetic className="w-full" strength={0.3} scale={1.02}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border border-cyan-500/20 text-white font-semibold rounded-2xl px-4 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.15)] disabled:opacity-50 text-xs tracking-widest uppercase font-mono"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" data-magnetic-inner />
                    ) : (
                      <span data-magnetic-inner>Register Account</span>
                    )}
                  </button>
                </Magnetic>
              </motion.div>
            </form>
          )}

          <motion.div
            variants={itemVariants}
            className="mt-6 pt-6 border-t border-white/[0.04] text-center"
          >
            <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
              <span>Have credentials?</span>{" "}
              <Magnetic strength={0.2} scale={1.03}>
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors font-mono uppercase tracking-wider">
                  <span data-magnetic-inner>Access Terminal</span>
                </Link>
              </Magnetic>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
export default Register;
