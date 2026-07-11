import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "react-router-dom";
import { Shield, Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { apiFetch } from "../utils/api";
import { GlassCard } from "../components/GlassCard";
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#020308]">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-[80px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px] pointer-events-none -z-10" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <GlassCard glowColor="cyan" className="p-8 md:p-10 border border-white/[0.04]">
          <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="bg-cyan-500/10 p-4 rounded-3xl border border-cyan-500/20 text-cyan-400">
                <Shield className="w-8 h-8 text-cyan-400" />
              </div>
              <div className="absolute inset-0 bg-cyan-500/10 blur-md rounded-full -z-10" />
            </div>
            
            <h1 className="text-xl font-bold tracking-widest text-center uppercase bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Restore Keys
            </h1>
            <p className="text-[10px] font-mono text-slate-500 mt-1 uppercase tracking-widest">
              Password Recovery Term
            </p>
          </motion.div>

          {successMsg ? (
            <motion.div variants={itemVariants} className="space-y-6 text-center">
              <div className="bg-cyan-500/10 p-4 rounded-2xl border border-cyan-500/20 text-slate-300 text-sm font-mono leading-relaxed">
                {successMsg}
              </div>
              
              {resetToken && (
                <div className="bg-[#070913]/90 border border-white/[0.05] p-4 rounded-2xl text-left space-y-2">
                  <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-widest font-bold block">
                    Demo Security Token
                  </span>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Because the platform is running locally, we have output the reset token below:
                  </p>
                  <div className="bg-[#0b0f19] px-3 py-2.5 rounded-xl text-xs font-mono select-all text-emerald-400 border border-white/[0.04] break-all">
                    {resetToken}
                  </div>
                </div>
              )}
              
              <div className="pt-4">
                <Magnetic strength={0.3} scale={1.03}>
                  <Link
                    to="/login"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center justify-center gap-2 text-sm font-semibold transition-colors font-mono"
                  >
                    <ArrowLeft className="w-4 h-4" data-magnetic-inner /> <span data-magnetic-inner>Return to Login</span>
                  </Link>
                </Magnetic>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl text-xs text-center font-mono"
                >
                  {error}
                </motion.div>
              )}

              <motion.div variants={itemVariants} className="space-y-2">
                <label className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  Corporate Email Address
                </label>
                <input
                  type="email"
                  {...register("email")}
                  className="w-full bg-[#070913]/60 border border-white/[0.06] rounded-2xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
                  placeholder="e.g. analyst@bank.com"
                />
                {errors.email && (
                  <p className="text-[11px] font-mono text-red-400 mt-1">{errors.email.message}</p>
                )}
              </motion.div>

              <motion.div variants={itemVariants}>
                <Magnetic className="w-full" strength={0.35} scale={1.03}>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 border border-cyan-400/20 text-white font-semibold rounded-2xl px-4 py-3.5 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.15)] disabled:opacity-50 text-sm tracking-wider uppercase font-mono"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" data-magnetic-inner />
                    ) : (
                      <span data-magnetic-inner>Request Restore Key</span>
                    )}
                  </motion.button>
                </Magnetic>
              </motion.div>

              <motion.div variants={itemVariants} className="text-center pt-2">
                <Magnetic strength={0.25} scale={1.03}>
                  <Link
                    to="/login"
                    className="text-xs text-slate-500 hover:text-cyan-400 flex items-center justify-center gap-1 hover:underline transition-colors font-semibold font-mono"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" data-magnetic-inner /> <span data-magnetic-inner>Back to Authorization Portal</span>
                  </Link>
                </Magnetic>
              </motion.div>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};
