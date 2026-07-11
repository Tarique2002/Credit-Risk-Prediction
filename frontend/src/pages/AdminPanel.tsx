import React, { useState, useEffect } from "react";
import { 
  Shield, Users, Activity, FileText, Database, 
  Settings, RefreshCw, AlertTriangle, CheckCircle 
} from "lucide-react";
import { apiFetch } from "../utils/api";
import { GlassCard } from "../components/GlassCard";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"logs" | "users" | "drift">("logs");
  
  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsSkip, setLogsSkip] = useState(0);
  const [logsLimit] = useState(25);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Users state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Drift state
  const [driftReport, setDriftReport] = useState<any>(null);
  const [loadingDrift, setLoadingDrift] = useState(false);
  
  // Training trigger
  const [training, setTraining] = useState(false);
  const [trainSummary, setTrainSummary] = useState<any>(null);
  
  const [error, setError] = useState<string | null>(null);

  // Load audit logs
  const fetchLogs = async () => {
    setLoadingLogs(true);
    setError(null);
    try {
      const data = await apiFetch(`/admin/logs?skip=${logsSkip}&limit=${logsLimit}`);
      setLogs(data.items || []);
      setLogsTotal(data.total || 0);
    } catch (err: any) {
      setError(err.message || "Failed loading system audit logs");
    } finally {
      setLoadingLogs(false);
    }
  };

  // Load users list
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await apiFetch("/admin/users");
      setUsersList(data || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load drift report
  const fetchDrift = async () => {
    setLoadingDrift(true);
    try {
      const data = await apiFetch("/admin/drift");
      setDriftReport(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingDrift(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") return;
    
    if (activeTab === "logs") {
      fetchLogs();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "drift") {
      fetchDrift();
    }
  }, [activeTab, logsSkip]);

  const handleRoleToggle = async (userId: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "analyst" : "admin";
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: "PUT",
        body: JSON.stringify({ role: newRole }),
      });
      fetchUsers();
    } catch (err: any) {
      alert("Failed to update user role: " + err.message);
    }
  };

  const handleTriggerTraining = async () => {
    setTraining(true);
    setTrainSummary(null);
    try {
      const res = await apiFetch("/predictions/train", {
        method: "POST",
      });
      setTrainSummary(res.summary);
      if (activeTab === "drift") {
        fetchDrift();
      }
    } catch (err: any) {
      alert("ML Pipeline Retraining Failed: " + err.message);
    } finally {
      setTraining(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <GlassCard className="text-center p-12 space-y-5 max-w-md border border-red-500/10" glowColor="red">
          <Shield className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
          <h2 className="text-sm font-bold text-white uppercase tracking-widest font-mono">Security Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed font-sans">
            You are authenticated under an analyst terminal session. Administrative panel configurations are restricted to system administrators only.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.04] pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Shield className="text-cyan-400 w-6 h-6" /> Administration Controls
        </h1>
        <p className="text-slate-500 text-xs mt-1">
          Review security logs, audit user sessions, monitor feature distributions drift, and trigger ML retraining loops
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/[0.04] pb-3 text-xs font-bold font-mono tracking-widest">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 transition-all cursor-pointer ${
            activeTab === "logs"
              ? "text-cyan-400 border-b-2 border-cyan-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          [SECURITY AUDIT LOGS]
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 transition-all cursor-pointer ${
            activeTab === "users"
              ? "text-cyan-400 border-b-2 border-cyan-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          [AGENT TERMINALS]
        </button>
        <button
          onClick={() => setActiveTab("drift")}
          className={`px-4 py-2 transition-all cursor-pointer ${
            activeTab === "drift"
              ? "text-cyan-400 border-b-2 border-cyan-500"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          [MODEL DRIFT MONITORING]
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-xs font-mono text-center">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === "logs" && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="border border-white/[0.04]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-cyan-400" /> Enterprise Audit Logs
                </h2>
                <button
                  onClick={fetchLogs}
                  className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-slate-300 font-mono text-[10px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh logs
                </button>
              </div>

              {loadingLogs ? (
                <div className="flex justify-center items-center py-16">
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                </div>
              ) : logs.length === 0 ? (
                <p className="text-slate-500 text-center py-16 text-xs font-mono">No system audit records found.</p>
              ) : (
                <div className="space-y-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/[0.04] text-[10px] font-mono uppercase text-slate-500 pb-2">
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Agent Email</th>
                          <th className="py-2.5 px-3">Security Action</th>
                          <th className="py-2.5 px-3">Transaction Details</th>
                          <th className="py-2.5 px-3">IP Address</th>
                          <th className="py-2.5 px-3 text-right">User Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.02]">
                        {logs.map((log) => (
                          <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="py-3 px-3 font-mono text-slate-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-300">{log.user_email}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono ${
                                log.action.includes("FAILED") || log.action.includes("LOCKOUT") || log.action.includes("DELETED")
                                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                  : log.action.includes("SUCCESS") || log.action.includes("PREDICT")
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                              }`}>
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-300 font-sans leading-relaxed">{log.details}</td>
                            <td className="py-3 px-3 font-mono text-slate-400">{log.ip_address || "System"}</td>
                            <td className="py-3 px-3 text-right text-slate-500 font-mono truncate max-w-xs" title={log.user_agent}>
                              {log.user_agent || "Direct Call"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Paging */}
                  <div className="flex justify-between items-center pt-4 border-t border-white/[0.04] font-mono text-[10px] text-slate-500">
                    <span>Showing {logs.length} of {logsTotal} audit traces</span>
                    <div className="flex gap-2">
                      <button
                        disabled={logsSkip === 0}
                        onClick={() => setLogsSkip(Math.max(0, logsSkip - logsLimit))}
                        className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        Prev
                      </button>
                      <button
                        disabled={logsSkip + logsLimit >= logsTotal}
                        onClick={() => setLogsSkip(logsSkip + logsLimit)}
                        className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] px-3.5 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider disabled:opacity-30 cursor-pointer transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <GlassCard className="border border-white/[0.04]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Users className="w-4.5 h-4.5 text-cyan-400" /> User Terminal Access
                </h2>
                <button
                  onClick={fetchUsers}
                  className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-slate-300 font-mono text-[10px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh list
                </button>
              </div>

              {loadingUsers ? (
                <div className="flex justify-center items-center py-16">
                  <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[10px] font-mono uppercase text-slate-500">
                        <th className="py-2.5 px-3">Agent Email</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-center">Security Access Role</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02] font-mono">
                      {usersList.map((usr) => (
                        <tr key={usr.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-3.5 px-3 font-semibold text-slate-200">{usr.email}</td>
                          <td className="py-3.5 px-3 text-center font-bold">
                            <span className={usr.is_active ? "text-emerald-400" : "text-red-400"}>
                              {usr.is_active ? "ACTIVE" : "INACTIVE"}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center uppercase">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${
                              usr.role === "admin" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-slate-900 text-slate-400 border-slate-800"
                            }`}>
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => handleRoleToggle(usr.id, usr.role)}
                              className="bg-white/[0.02] hover:bg-cyan-500/10 border border-white/[0.04] hover:border-cyan-500/20 text-slate-300 hover:text-cyan-400 font-sans text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                            >
                              Toggle Access Role
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {activeTab === "drift" && (
          <motion.div
            key="drift"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Diagnostics summary */}
            <div className="lg:col-span-2 space-y-6">
              <GlassCard className="border border-white/[0.04]">
                <div className="flex justify-between items-center mb-6 border-b border-white/[0.04] pb-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-cyan-400" /> Feature Drift Analysis (PSI)
                  </h2>
                  <button
                    onClick={fetchDrift}
                    className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-slate-300 font-mono text-[10px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Recalculate Drift
                  </button>
                </div>

                {loadingDrift ? (
                  <div className="flex justify-center items-center py-16">
                    <RefreshCw className="w-7 h-7 text-cyan-400 animate-spin" />
                  </div>
                ) : !driftReport ? (
                  <p className="text-slate-500 text-xs font-mono text-center py-16">No prediction records have been processed to calculate drift.</p>
                ) : (
                  <div className="space-y-6">
                    {/* Summary Box */}
                    <div className={`p-4 rounded-2xl flex items-center gap-4 border ${
                      driftReport.drift_detected 
                        ? "bg-red-500/10 border-red-500/20 text-red-200"
                        : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
                    }`}>
                      {driftReport.drift_detected ? (
                        <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold font-mono text-xs uppercase tracking-wider">
                          {driftReport.drift_detected ? "Drift Detection Warning" : "Portfolio Stable"}
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                          Average Population Stability Index (PSI): <span className="font-bold font-mono">{driftReport.overall_psi}</span>. 
                          {driftReport.drift_detected 
                            ? " Significant changes detected in applicant distributions. Model retraining advised."
                            : " The incoming client distributions match the model training baseline profile."}
                        </p>
                      </div>
                    </div>

                    {/* Feature Breakdown Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.04] text-[10px] font-mono uppercase text-slate-500">
                            <th className="py-2 px-3">Inference Input Feature</th>
                            <th className="py-2 px-3 text-center">Stability Metric (PSI)</th>
                            <th className="py-2 px-3 text-right">Drift Alert Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02] font-mono">
                          {Object.entries(driftReport.feature_drift).map(([feat, data]: [string, any]) => (
                            <tr key={feat} className="hover:bg-white/[0.01]">
                              <td className="py-2.5 px-3 font-semibold text-slate-300 capitalize">{feat.replace(/_/g, " ")}</td>
                              <td className="py-2.5 px-3 text-center text-slate-200">{data.psi}</td>
                              <td className="py-2.5 px-3 text-right">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  data.drift_status === "High Drift"
                                    ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                                    : data.drift_status === "Moderate Drift"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                }`}>
                                  {data.drift_status.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Model Controls Retraining */}
            <div className="lg:col-span-1 space-y-6">
              <GlassCard className="border border-white/[0.04]">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/[0.04] pb-3">
                  <Settings className="w-4.5 h-4.5 text-cyan-400" /> Classifier Controls
                </h2>

                <div className="bg-[#070913]/60 border border-white/[0.06] p-4 rounded-2xl space-y-3 text-[11px] text-slate-300 leading-relaxed font-sans">
                  <h3 className="font-bold text-cyan-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4" /> Model Control
                  </h3>
                  <p>Version ID: <span className="font-mono text-white">1.0.0 (Active)</span></p>
                  <p>
                    Triggering the retraining loop downloads updated training arrays, compiles coefficients across 5 model classes, compiles validation AUC scores, and updates pipeline configurations dynamically.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleTriggerTraining}
                  disabled={training}
                  className="w-full mt-6 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {training ? (
                    <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                  ) : (
                    "Trigger Retraining Loop"
                  )}
                </motion.button>

                {training && (
                  <p className="text-[10px] text-slate-500 mt-3.5 font-mono text-center animate-pulse">
                    Fitting Logistic Regression, RF, XGB, CatBoost, LightGBM...
                  </p>
                )}

                {trainSummary && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl mt-6 space-y-2.5 text-[11px] text-slate-300 leading-normal font-sans">
                    <h4 className="font-bold text-emerald-400 font-mono uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Pipeline Fit Completed
                    </h4>
                    <p>Selected Model: <span className="font-bold text-white">{trainSummary.best_model}</span></p>
                    <p className="text-slate-500 font-mono text-[10px]">
                      Retrained at: {new Date(trainSummary.trained_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
