import React, { useState, useEffect } from "react";
import { 
  Bot, Send, User, RefreshCw, 
  HelpCircle, ShieldCheck, AlertCircle 
} from "lucide-react";
import { apiFetch } from "../utils/api";
import { GlassCard } from "../components/GlassCard";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "../components/Magnetic";

interface Message {
  sender: "user" | "gemini";
  text: string;
  timestamp: string;
}

export const AIAssistant: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustId, setSelectedCustId] = useState<string>("");
  const [selectedCust, setSelectedCust] = useState<any>(null);
  const [loadingCusts, setLoadingCusts] = useState(false);

  const [inputPrompt, setInputPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "gemini",
      text: "### Welcome to the Credit Risk Assistant\nSelect an applicant profile from the selector above to analyze their portfolio or ask specific risk modeling questions.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoadingCusts(true);
    try {
      const res = await apiFetch("/customers/?limit=50");
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

  const handleCustomerSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    setSelectedCustId(cid);
    setSelectedCust(null);
    if (!cid) return;
    
    try {
      const data = await apiFetch(`/customers/${cid}`);
      const profile = data.profile;
      const latestPrediction = data.predictions && data.predictions[0];
      
      const fullCustDetails = {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        income: profile.income,
        debt_to_income_ratio: profile.debt_to_income_ratio,
        payment_history_score: profile.payment_history_score,
        existing_loans_count: profile.existing_loans_count,
        savings_balance: profile.savings_balance,
        default_probability: latestPrediction ? latestPrediction.default_probability : 0.25,
        credit_score: latestPrediction ? latestPrediction.credit_score : 680,
        risk_category: latestPrediction ? latestPrediction.risk_category : "Medium",
        recommendation: latestPrediction ? latestPrediction.recommendation : "Approve",
        fraud_flags: [],
      };
      
      setSelectedCust(fullCustDetails);
      
      setMessages([
        {
          sender: "gemini",
          text: `### Applicant Profile Loaded: ${profile.first_name} ${profile.last_name}\n\n**Financial Overview:**\n- Annual Income: $${profile.income.toLocaleString()}\n- DTI Ratio: ${(profile.debt_to_income_ratio*100).toFixed(1)}%\n- Credit Score: ${fullCustDetails.credit_score} (${fullCustDetails.risk_category} Risk)\n- System Recommendation: **${fullCustDetails.recommendation.toUpperCase()}**\n\nChoose a quick question below or type a custom command.`,
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
    } catch (err) {
      console.error("Error loading customer profile for AI assistant", err);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    const userMsg: Message = {
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setSending(true);
    setError(null);
    
    try {
      let payload;
      if (selectedCust) {
        payload = {
          ...selectedCust,
          question: textToSend,
        };
      } else {
        payload = {
          first_name: "General",
          last_name: "Inquiry",
          default_probability: 0.15,
          credit_score: 720,
          risk_category: "Low",
          recommendation: "Approve",
          income: 75000,
          debt_to_income_ratio: 0.22,
          payment_history_score: 95,
          existing_loans_count: 1,
          savings_balance: 20000,
          fraud_flags: [],
          question: textToSend,
        };
      }
      
      const res = await apiFetch("/ai/chat", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      
      const geminiMsg: Message = {
        sender: "gemini",
        text: res.explanation || "System was unable to formulate analysis response.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, geminiMsg]);
    } catch (err: any) {
      setError(err.message || "Failed communicating with Gemini assistant");
    } finally {
      setSending(false);
    }
  };

  const handleQuickQuestion = (type: string) => {
    if (!selectedCust) {
      alert("Please select a customer profile file first.");
      return;
    }
    
    let text = "";
    switch (type) {
      case "why_rejected":
        text = `Explain why this loan should be ${selectedCust.recommendation === "Approve" ? "Approved" : "Rejected"}. Summarize the primary driving default risk components.`;
        break;
      case "improve_score":
        text = "Draft a personalized 4-step actionable credit score improvement roadmap for this customer.";
        break;
      case "exec_summary":
        text = "Draft a formal, structured executive summary report for senior management regarding this customer profile risk assessment.";
        break;
      default:
        return;
    }
    handleSendMessage(text);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/[0.04] pb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Bot className="text-cyan-400 w-6 h-6 animate-pulse" /> AI Risk Copilot
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Query underwriting decisions, generate summaries, and consult Gemini regarding default mitigations
          </p>
        </div>
        
        {/* Profile Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Context:</span>
          <select
            value={selectedCustId}
            onChange={handleCustomerSelect}
            className="bg-[#0b0f19] border border-white/[0.06] rounded-xl px-3 py-2 text-xs text-cyan-400 font-semibold focus:outline-none"
            disabled={loadingCusts}
          >
            <option value="">General Inquiries Only</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id.toString()}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left column: Context Profile quick reference */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard className="h-full space-y-5 border border-white/[0.04]">
            <h3 className="text-xs font-semibold text-white mb-2 border-b border-white/[0.04] pb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Active Context
            </h3>
            
            {selectedCust ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="bg-[#070913]/60 p-3.5 border border-white/[0.05] rounded-2xl space-y-1">
                  <p className="text-slate-200 font-bold font-sans text-xs">{selectedCust.first_name} {selectedCust.last_name}</p>
                  <p className="text-slate-500 text-[10px] truncate">{selectedCust.email}</p>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Score:</span>
                    <span className="text-slate-200 font-bold">{selectedCust.credit_score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Risk Tier:</span>
                    <span className="text-cyan-400 font-bold">{selectedCust.risk_category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Decision:</span>
                    <span className={selectedCust.recommendation === "Approve" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                      {selectedCust.recommendation.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Default Prob:</span>
                    <span className="text-slate-200 font-bold">{(selectedCust.default_probability * 100).toFixed(1)}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.04] space-y-2">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block mb-1">Quick Actions</span>
                  <Magnetic className="w-full" strength={0.15} scale={1.02}>
                    <button
                      onClick={() => handleQuickQuestion("why_rejected")}
                      className="w-full bg-[#070913]/40 hover:bg-[#070913] border border-white/[0.05] text-left p-2.5 rounded-xl text-[10px] text-slate-300 font-sans hover:text-cyan-400 block cursor-pointer transition-colors"
                    >
                      <span data-magnetic-inner>Explain Underwriting Decision</span>
                    </button>
                  </Magnetic>
                  <Magnetic className="w-full" strength={0.15} scale={1.02}>
                    <button
                      onClick={() => handleQuickQuestion("improve_score")}
                      className="w-full bg-[#070913]/40 hover:bg-[#070913] border border-white/[0.05] text-left p-2.5 rounded-xl text-[10px] text-slate-300 font-sans hover:text-cyan-400 block cursor-pointer transition-colors"
                    >
                      <span data-magnetic-inner>Roadmap to Optimize Score</span>
                    </button>
                  </Magnetic>
                  <Magnetic className="w-full" strength={0.15} scale={1.02}>
                    <button
                      onClick={() => handleQuickQuestion("exec_summary")}
                      className="w-full bg-[#070913]/40 hover:bg-[#070913] border border-white/[0.05] text-left p-2.5 rounded-xl text-[10px] text-slate-300 font-sans hover:text-cyan-400 block cursor-pointer transition-colors"
                    >
                      <span data-magnetic-inner>Compile Executive Summary</span>
                    </button>
                  </Magnetic>
                </div>
              </div>
            ) : (
              <div className="text-center py-16 space-y-3">
                <HelpCircle className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-[11px] text-slate-500 font-sans leading-relaxed">No client context active. Responses will assume general risk modeling values.</p>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right column: Chat window */}
        <div className="lg:col-span-3 flex flex-col h-[550px]">
          <GlassCard className="flex-1 flex flex-col p-5 overflow-hidden border border-white/[0.04]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 scrollbar-thin">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex gap-3.5 max-w-[85%] ${
                    msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div className={`p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border ${
                    msg.sender === "user" 
                      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                      : "bg-[#0b0f19] border-white/[0.06] text-white"
                  }`}>
                    {msg.sender === "user" ? <User className="w-4.5 h-4.5" /> : <Bot className="w-4.5 h-4.5" />}
                  </div>

                  <div className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === "user" 
                      ? "bg-[#070913] border border-white/[0.06] text-slate-100 rounded-tr-none" 
                      : "bg-white/[0.01] border border-white/[0.03] text-slate-300 rounded-tl-none font-sans"
                  }`}>
                    {msg.text.split("\n").map((line, idx) => {
                      if (line.startsWith("### ")) {
                        return <h3 key={idx} className="text-xs font-bold text-cyan-400 mt-3 mb-2 font-mono uppercase tracking-wider first:mt-0">{line.replace("### ", "")}</h3>;
                      }
                      if (line.startsWith("#### ")) {
                        return <h4 key={idx} className="text-[11px] font-bold text-white mt-2 mb-1.5 font-mono uppercase tracking-wider">{line.replace("#### ", "")}</h4>;
                      }
                      if (line.startsWith("**") && line.endsWith("**")) {
                        return <p key={idx} className="font-bold text-slate-200 mt-2 font-sans">{line.replace(/\*\*/g, "")}</p>;
                      }
                      if (line.startsWith("- ")) {
                        return <li key={idx} className="ml-4 list-disc text-[11px] mt-1 text-slate-400 font-sans">{line.replace("- ", "")}</li>;
                      }
                      return <p key={idx} className="mt-1 font-sans text-slate-300">{line}</p>;
                    })}
                    <span className="text-[8px] text-slate-500 font-mono block mt-2 text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex gap-3.5 mr-auto max-w-[85%]">
                  <div className="p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0 border bg-[#0b0f19] border-white/[0.06] text-white">
                    <Bot className="w-4.5 h-4.5" />
                  </div>
                  <div className="bg-white/[0.01] border border-white/[0.03] rounded-2xl px-4 py-3 text-[11px] font-mono text-slate-500 animate-pulse rounded-tl-none">
                    Gemini risk agent is analyzing metrics...
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-2xl text-xs flex items-center gap-2 max-w-md mx-auto font-mono">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Input field */}
            <div className="border-t border-white/[0.04] pt-4 flex gap-2.5">
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputPrompt)}
                placeholder="Ask underwriting details, risk assessments, or score explanations..."
                className="flex-1 bg-[#070913]/60 border border-white/[0.06] rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                disabled={sending}
              />
              <Magnetic scale={1.1} strength={0.4}>
                <button
                  onClick={() => handleSendMessage(inputPrompt)}
                  disabled={sending || !inputPrompt.trim()}
                  className="bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 p-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" data-magnetic-inner />
                </button>
              </Magnetic>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
