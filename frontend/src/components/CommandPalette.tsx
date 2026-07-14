import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Activity, Users, Calculator, Bot, Shield, 
  CornerDownLeft, Compass, Sparkles, X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = [
    { name: "Portfolio Monitors", path: "/dashboard", icon: Activity, description: "View loan risk segments and portfolio metrics" },
    { name: "Client Directory", path: "/customers", icon: Users, description: "Manage borrower files and active loans" },
    { name: "Credit Decisioning", path: "/predict", icon: Calculator, description: "Calculate FICO default probability" },
    { name: "AI Risk Copilot", path: "/ai", icon: Bot, description: "Ask the Generative AI assistant about predictions" },
    { name: "Admin Controls", path: "/admin", icon: Shield, description: "Review audit logs and check database health" },
  ];

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].path);
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Overlay background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog Card */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg bg-[#0b0f19]/90 border border-white/[0.08] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8),0_0_2px_1px_rgba(255,255,255,0.05)] rounded-2xl overflow-hidden z-10"
          >
            {/* Search Input Box */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] relative">
              <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or navigate..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
              />
              <button 
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 p-1 hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List Results */}
            <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`w-full text-left flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        isSelected 
                          ? "bg-white/[0.04] border border-white/[0.02]" 
                          : "bg-transparent border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`p-2 rounded-lg transition-colors ${
                          isSelected ? "bg-cyan-500/10 text-cyan-400" : "bg-white/[0.02] text-slate-400"
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className={`text-xs font-semibold ${isSelected ? "text-white" : "text-slate-300"}`}>
                            {item.name}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-400 bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/10 animate-fade-in">
                          <span>Enter</span>
                          <CornerDownLeft className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Compass className="w-8 h-8 text-slate-600 animate-pulse" />
                  <p className="text-xs">No command results found for "{search}"</p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="px-4 py-2 bg-black/30 border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span>↑↓ Navigate</span>
                <span>Enter Select</span>
                <span>Esc Close</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Risk Core Command Center</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
