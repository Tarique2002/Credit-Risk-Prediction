import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, ArrowLeft, RefreshCw, ChevronLeft } from "lucide-react";
import { apiFetch } from "../utils/api";
import { motion } from "framer-motion";
import { Magnetic } from "../components/Magnetic";

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type FormData = z.infer<typeof schema>;

export const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setResetToken(null);
    try {
      const res = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSuccessMsg(res.message);
      if (res.token) {
        setResetToken(res.token);
      }
    } catch (err: any) {
      setError(err.message || "Failed to trigger recovery. Check input.");
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
        staggerChildren: 0.1,
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

      {/* Back to Login Link */}
      <Link 
        to="/login"
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-slate-200 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> BACK TO LOGIN
      </Link>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="p-8 md:p-10 rounded-3xl glass-panel border-white/[0.04] shadow-2xl relative overflow-hidden">
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="bg-cyan-500/10 p-4 rounded-3xl border border-cyan-500/20 text-cyan-400">
                <ShieldCheck className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="absolute inset-0 bg-cyan-500/10 blur-md rounded-full -z-10" />
            </div>
            
            <h1 className="text-xl font-extrabold tracking-widest text-center uppercase bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Restore Keys
            </h1>
            <p className="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
              Recovery Authorization
            </p>
          </motion.div>

          {successMsg ? (
            <motion.div variants={itemVariants} className="space-y-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs font-mono leading-relaxed">
                {successMsg}
              </div>
              {resetToken && (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-left space-y-2">
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block">DEVELOPER BACKDOOR KEY</span>
                  <div className="p-2.5 bg-black/40 rounded-xl font-mono text-[10px] text-cyan-400 break-all select-all border border-cyan-500/10">
                    {resetToken}
                  </div>
                  <p className="text-[9px] text-slate-400 leading-relaxed">
                    Note: Since this is a demo environment, the reset token is returned directly here for testing purposes.
                  </p>
                </div>
              )}
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 font-mono uppercase tracking-wider transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Return to Login
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-200 p-3.5 rounded-2xl text-[10px] text-center font-mono"
                >
                  {error}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Agent Account Email
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full bg-[#070d19]/40 border border-white/[0.06] hover:border-white/[0.12] focus:border-cyan-500/40 rounded-2xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                  placeholder="e.g. admin@bank.com"
                />
                {errors.email && (
                  <p className="text-[10px] font-mono text-red-400 mt-1">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Magnetic className="w-full" strength={0.3} scale={1.02}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border border-cyan-500/20 text-white font-semibold rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.15)] disabled:opacity-50 text-xs tracking-widest uppercase font-mono"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" data-magnetic-inner />
                    ) : (
                      <span data-magnetic-inner>Dispatch Reset Link</span>
                    )}
                  </button>
                </Magnetic>
              </motion.div>
            </form>
          )}

        </div>
      </motion.div>
    </div>
  );
};
export default ForgotPassword;
