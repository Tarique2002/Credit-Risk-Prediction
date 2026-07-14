import React, { useState, useEffect } from "react";
import { 
  Shield, Users, Activity, FileText, Database, 
  Settings, RefreshCw, AlertTriangle, CheckCircle,
  Cpu, LayoutGrid, Terminal, ArrowRight, Zap, CheckCircle2
} from "lucide-react";
import { apiFetch } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"logs" | "users" | "drift">("drift");
  
  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsSkip, setLogsSkip] = useState(0);
  const [logsLimit] = useState(15);
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

  const handleTrainModel = async () => {
    setTraining(true);
    setError(null);
    setTrainSummary(null);
    try {
      const res = await apiFetch("/admin/train", { method: "POST" });
      setTrainSummary(res);
      fetchDrift();
    } catch (err: any) {
      setError(err.message || "Ensemble training failed.");
    } finally {
      setTraining(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 rounded-3xl glass-panel border border-white/[0.04]">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
        <h3 className="text-white text-sm font-bold font-mono uppercase tracking-wider">Access Restrained</h3>
        <p className="text-xs text-slate-400 leading-normal">
          This system administrative console requires administrative keys. Please re-login with a root account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.04] pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Shield className="text-cyan-400 w-5 h-5" /> Admin Controls
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Check ensemble PSI drift metrics, toggle user privileges, and inspect log telemetry.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-[#0b0f19] border border-white/[0.04] p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab("drift")}
            className={`px-4.5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === "drift"
                ? "bg-white/[0.04] text-cyan-400 border border-white/[0.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Drift & Retrain
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4.5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === "users"
                ? "bg-white/[0.04] text-cyan-400 border border-white/[0.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            User Access
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-4.5 py-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
              activeTab === "logs"
                ? "bg-white/[0.04] text-cyan-400 border border-white/[0.02]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Audit Telemetry
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-2xl text-xs font-mono">
          {error}
        </div>
      )}

      {/* Tabs panels */}
      <AnimatePresence mode="wait">
        
        {/* Drift Dashboard */}
        {activeTab === "drift" && (
          <motion.div
            key="drift"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            <div className="lg:col-span-8 space-y-6">
              <div className="p-6 rounded-3xl glass-panel border border-white/[0.04]">
                <div className="flex justify-between items-center mb-6 border-b border-white/[0.04] pb-4">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4.5 h-4.5 text-cyan-400" /> Feature Stability Indices (PSI)
                  </h2>
                  <button
                    onClick={fetchDrift}
                    className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-slate-300 font-mono text-[9px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Recompute Drift
                  </button>
                </div>

                {loadingDrift ? (
                  <div className="flex justify-center items-center py-16">
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                  </div>
                ) : !driftReport ? (
                  <p className="text-slate-500 text-xs font-mono text-center py-16 uppercase">No prediction data found to compute drift.</p>
                ) : (
                  <div className="space-y-6">
                    <div className={`p-4 rounded-2xl flex items-center gap-4 border ${
                      driftReport.drift_detected 
                        ? "bg-red-500/5 border-red-500/10 text-red-200"
                        : "bg-emerald-500/5 border-emerald-500/10 text-emerald-200"
                    }`}>
                      {driftReport.drift_detected ? (
                        <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
                      ) : (
                        <CheckCircle className="w-8 h-8 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <h4 className="font-bold font-mono text-xs uppercase tracking-wider">
                          {driftReport.drift_detected ? "Covariate Drift Alert" : "Ensemble Baseline Stable"}
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          Average stability index (PSI) is <span className="font-bold text-white font-mono">{driftReport.overall_psi}</span>. 
                          {driftReport.drift_detected 
                            ? " Drift thresholds crossed. Model retraining is highly recommended to adapt boundaries."
                            : " Inference client attributes align seamlessly with historical baseline models."}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-white/[0.04] text-[9px] font-mono uppercase text-slate-500">
                            <th className="py-2.5 px-3">Input Attribute</th>
                            <th className="py-2.5 px-3 text-center">Stability Metric (PSI)</th>
                            <th className="py-2.5 px-3 text-right">Drift Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.02] font-mono">
                          {Object.entries(driftReport.feature_drift).map(([feat, data]: [string, any]) => (
                            <tr key={feat} className="hover:bg-white/[0.01]">
                              <td className="py-3 px-3 font-semibold text-slate-300 capitalize">{feat.replace(/_/g, " ")}</td>
                              <td className="py-3 px-3 text-center text-slate-200">{data.psi}</td>
                              <td className="py-3 px-3 text-right">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                                  data.drift_status === "High Drift"
                                    ? "bg-red-500/5 text-red-400 border-red-500/10"
                                    : data.drift_status === "Moderate Drift"
                                    ? "bg-amber-500/5 text-amber-400 border-amber-500/10"
                                    : "bg-emerald-500/5 text-emerald-400 border-emerald-500/10"
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
              </div>
            </div>

            {/* Model retraining box */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl glass-panel border border-white/[0.04]">
                <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 border-b border-white/[0.04] pb-3">
                  <Settings className="w-4.5 h-4.5 text-cyan-400" /> Pipeline Operations
                </h2>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-6 font-sans">
                  Retrain models using newly seeded customer files to optimize classification boundaries.
                </p>

                <button
                  onClick={handleTrainModel}
                  disabled={training}
                  className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 font-mono text-xs uppercase tracking-wider rounded-xl py-3 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 animate-pulse-glow"
                >
                  {training ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Optimize Classifier</span>
                  )}
                </button>

                {trainSummary && (
                  <div className="mt-6 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-2 text-[10px] text-slate-400 font-mono">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Re-Fitting Completed
                    </span>
                    <div className="pt-2 divide-y divide-white/5 space-y-1.5">
                      <div className="flex justify-between">
                        <span>New Accuracy:</span>
                        <span className="text-white">{(trainSummary.accuracy * 100).toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span>Train Size:</span>
                        <span className="text-white">{trainSummary.records_used} records</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Users list */}
        {activeTab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-3xl glass-panel border border-white/[0.04]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-cyan-400" /> Terminal Access Ledger
              </h2>
              <button
                onClick={fetchUsers}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-slate-300 font-mono text-[9px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Accounts
              </button>
            </div>

            {loadingUsers ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-[9px] font-mono uppercase text-slate-500">
                      <th className="py-2.5 px-3">Agent Identifier</th>
                      <th className="py-2.5 px-3 text-center">Identity Status</th>
                      <th className="py-2.5 px-3 text-center">RBAC Authorization Role</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02] font-mono">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-slate-200">{usr.email}</td>
                        <td className="py-3.5 px-3 text-center">
                          <span className={`px-2 py-0.2 rounded text-[8px] font-bold ${
                            usr.is_active ? "text-emerald-400 bg-emerald-500/5" : "text-red-400 bg-red-500/5"
                          }`}>
                            {usr.is_active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center uppercase">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] border ${
                            usr.role === "admin" 
                              ? "bg-cyan-500/5 text-cyan-400 border-cyan-500/10 font-bold" 
                              : "bg-slate-900 text-slate-400 border-slate-800"
                          }`}>
                            {usr.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleRoleToggle(usr.id, usr.role)}
                            className="bg-white/[0.01] hover:bg-cyan-500/10 border border-white/[0.04] hover:border-cyan-500/20 text-slate-400 hover:text-cyan-400 font-sans text-[9px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            Toggle Privilege
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Audit logs trace */}
        {activeTab === "logs" && (
          <motion.div
            key="logs"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-6 rounded-3xl glass-panel border border-white/[0.04]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Terminal className="w-4.5 h-4.5 text-cyan-400" /> Audit Trail traces
              </h2>
              <button
                onClick={fetchLogs}
                className="bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] text-slate-300 font-mono text-[9px] uppercase tracking-wider rounded-lg px-3 py-2 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Synchronize Logs
              </button>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center items-center py-16">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/[0.04] text-[9px] font-mono uppercase text-slate-500">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Operation Code</th>
                        <th className="py-2.5 px-3">Agent</th>
                        <th className="py-2.5 px-3">IP Address</th>
                        <th className="py-2.5 px-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.02] font-mono text-[10px]">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-300">{log.action}</td>
                          <td className="py-2.5 px-3 text-slate-400">{log.user_email || "System Daemon"}</td>
                          <td className="py-2.5 px-3 text-slate-500">{log.ip_address}</td>
                          <td className="py-2.5 px-3 text-right text-slate-400 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Paging */}
                <div className="flex justify-between items-center pt-4 border-t border-white/[0.04] font-mono text-[9px] text-slate-500">
                  <span>Traces {logsSkip + 1} - {Math.min(logsSkip + logsLimit, logsTotal)} of {logsTotal}</span>
                  <div className="flex gap-2">
                    <button
                      disabled={logsSkip === 0}
                      onClick={() => setLogsSkip(Math.max(0, logsSkip - logsLimit))}
                      className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      Prev
                    </button>
                    <button
                      disabled={logsSkip + logsLimit >= logsTotal}
                      onClick={() => setLogsSkip(logsSkip + logsLimit)}
                      className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
};
export default AdminPanel;
