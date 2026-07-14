import React, { useState, useEffect, useRef } from "react";
import { 
  Bot, Send, User, RefreshCw, 
  HelpCircle, ShieldCheck, AlertCircle, Sparkles,
  ChevronRight, BrainCircuit, CornerDownLeft
} from "lucide-react";
import { apiFetch } from "../utils/api";
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
  
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          text: `### Applicant Profile Loaded: ${profile.first_name} ${profile.last_name}\n\n**Financial Overview:**\n- Annual Income: $${profile.income.toLocaleString()}\n- DTI Ratio: ${(profile.debt_to_income_ratio*100).toFixed(0)}%\n- Credit Score: ${fullCustDetails.credit_score} (${fullCustDetails.risk_category} Risk)\n- Underwriting Decision: **${fullCustDetails.recommendation.toUpperCase()}**\n\nChoose a quick question below or type a custom command.`,
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
    <div className="space-y-8 text-left">
      
      {/* Header */}
      <div className="border-b border-white/[0.04] pb-6 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Bot className="text-cyan-400 w-5 h-5" /> AI Risk Copilot
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Query underwriting decisions, generate summaries, and consult Gemini regarding default mitigations.
          </p>
        </div>
        
        {/* Context Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Context Profile:</span>
          <select
            value={selectedCustId}
            onChange={handleCustomerSelect}
            className="bg-[#0b0f19] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-cyan-400 font-semibold focus:outline-none"
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Context Profile quick reference */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-6 rounded-3xl glass-panel border border-white/[0.04] space-y-5">
            <h3 className="text-xs font-semibold text-white mb-2 border-b border-white/[0.04] pb-3 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4 text-cyan-400" /> Model Context
            </h3>
            
            {selectedCust ? (
              <div className="space-y-4 text-xs font-mono">
                <div className="bg-[#030712] p-3.5 border border-white/[0.05] rounded-2xl space-y-1">
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

                <div className="pt-4 border-t border-white/[0.04] space-y-2 font-sans">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold tracking-widest block mb-1">Quick Inquiries</span>
                  <button
                    onClick={() => handleQuickQuestion("why_rejected")}
                    className="w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.05] text-left p-2.5 rounded-xl text-[10px] text-slate-300 hover:text-cyan-400 block cursor-pointer transition-colors"
                  >
                    Explain Underwriting Decision
                  </button>
                  <button
                    onClick={() => handleQuickQuestion("improve_score")}
                    className="w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.05] text-left p-2.5 rounded-xl text-[10px] text-slate-300 hover:text-cyan-400 block cursor-pointer transition-colors"
                  >
                    Generate Actionable Roadmap
                  </button>
                  <button
                    onClick={() => handleQuickQuestion("exec_summary")}
                    className="w-full bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.05] text-left p-2.5 rounded-xl text-[10px] text-slate-300 hover:text-cyan-400 block cursor-pointer transition-colors"
                  >
                    Export Executive Summary
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-[10px] font-mono text-slate-500 uppercase">General copilot mode active.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Chat Console layout */}
        <div className="lg:col-span-9 flex flex-col h-[520px] rounded-3xl glass-panel border border-white/[0.04] overflow-hidden">
          
          {/* Chat Messages flow box */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.sender === "user";
              return (
                <div key={index} className={`flex gap-3.5 max-w-2xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
                  <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 border ${
                    isUser 
                      ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400" 
                      : "bg-[#030712] border-white/[0.05] text-slate-400"
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed font-sans ${
                    isUser 
                      ? "bg-cyan-500/[0.02] border border-cyan-500/10 text-cyan-100 rounded-tr-none" 
                      : "bg-white/[0.01] border border-white/[0.03] text-slate-300 rounded-tl-none markdown-container"
                  }`}>
                    {/* Basic Markdown converter logic for linebreaks & lists */}
                    <div className="space-y-2 whitespace-pre-wrap">
                      {msg.text.split("\n\n").map((para, pIdx) => {
                        if (para.startsWith("###")) {
                          return <h4 key={pIdx} className="text-sm font-bold text-white uppercase tracking-wider font-sans mt-2">{para.replace("###", "")}</h4>;
                        }
                        if (para.startsWith("-") || para.startsWith("*")) {
                          return (
                            <ul key={pIdx} className="list-disc pl-4 space-y-1">
                              {para.split("\n").map((li, lIdx) => (
                                <li key={lIdx}>{li.replace(/^[-*]\s*/, "")}</li>
                              ))}
                            </ul>
                          );
                        }
                        return <p key={pIdx}>{para}</p>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {sending && (
              <div className="flex gap-3.5 mr-auto">
                <div className="w-7.5 h-7.5 rounded-lg bg-[#030712] border border-white/[0.05] text-slate-400 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 animate-spin text-cyan-400" />
                </div>
                <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] text-xs text-slate-500 font-mono animate-pulse">
                  CONSULTING ENSEMBLE ARTIFACTS...
                </div>
              </div>
            )}

            {error && (
              <div className="flex gap-3.5 max-w-md mx-auto">
                <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-xl text-[10px] font-mono flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat input box */}
          <div className="p-4 bg-black/20 border-t border-white/[0.04]">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputPrompt);
              }}
              className="flex items-center gap-3.5 bg-white/[0.02] border border-white/[0.04] focus-within:border-cyan-500/40 px-4 py-3 rounded-2xl transition-all"
            >
              <input
                type="text"
                placeholder="Ask the AI copilot to explain a risk score or summarize data..."
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                disabled={sending}
                className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              
              <div className="flex items-center gap-3">
                <span className="hidden md:flex items-center gap-1 text-[8px] font-mono text-slate-500 uppercase tracking-widest border border-white/5 px-1.5 py-0.5 rounded bg-[#030712]">
                  <span>Enter</span> <CornerDownLeft className="w-2 h-2" />
                </span>
                <button
                  type="submit"
                  disabled={sending || !inputPrompt.trim()}
                  className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 hover:text-white rounded-xl transition-all disabled:opacity-30 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
};
export default AIAssistant;
