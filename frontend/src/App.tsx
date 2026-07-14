import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  Activity, Users, Calculator, Bot, Shield, 
  LogOut, Menu, X, ShieldAlert, Bell, Search,
  ChevronDown, ChevronsUpDown, Sparkles, Inbox
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { Dashboard } from "./pages/Dashboard";
import { CustomerDirectory } from "./pages/CustomerDirectory";
import { CustomerProfile } from "./pages/CustomerProfile";
import { Predict } from "./pages/Predict";
import { AIAssistant } from "./pages/AIAssistant";
import { AdminPanel } from "./pages/AdminPanel";
import { motion, AnimatePresence } from "framer-motion";
import { Magnetic } from "./components/Magnetic";
import { CommandPalette } from "./components/CommandPalette";

// Initialize Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

// Guard Component for Authenticated Sessions
const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#030712]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full shadow-[0_0_20px_rgba(6,182,212,0.3)]"
        />
        <span className="text-xs font-mono tracking-widest text-cyan-400 mt-4 animate-pulse">ESTABLISHING SECURE CONNECTION...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Main Layout Wrapper
const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Navigation sidebar & interactive layouts state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState("Corporate Underwriting");
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  
  // Notifications State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: "Model Refit Complete", desc: "CatBoost model successfully updated", read: false, time: "5m ago" },
    { id: 2, title: "Anomaly Flagged", desc: "High DTI alert on applicant admin@bank.com", read: false, time: "1h ago" },
    { id: 3, title: "Database Backup Success", desc: "Automatic seeding checks completed", read: true, time: "24h ago" }
  ]);

  // Command Palette State
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Monitor keyboard shortcut (Ctrl + K / Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navigation = user?.role === "user"
    ? [
        { name: "My Dashboard", path: "/dashboard", icon: Activity },
        { name: "Apply for Credit", path: "/predict", icon: Calculator },
        { name: "My Risk Copilot", path: "/ai", icon: Bot },
      ]
    : [
        { name: "Portfolio Monitors", path: "/dashboard", icon: Activity },
        { name: "Client Directory", path: "/customers", icon: Users },
        { name: "Credit Decisioning", path: "/predict", icon: Calculator },
        { name: "AI Risk Copilot", path: "/ai", icon: Bot },
        ...(user?.role === "admin" 
          ? [{ name: "Admin Controls", path: "/admin", icon: Shield }] 
          : []
        ),
      ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex bg-[#030712] selection:bg-cyan-500/30 selection:text-cyan-200 text-slate-100">
      
      {/* Background radial effects */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Sidebar (Desktop) */}
      <aside 
        className={`shrink-0 border-r border-white/[0.04] bg-[#080d19]/60 backdrop-blur-2xl transition-all duration-300 hidden md:flex flex-col justify-between ${
          isSidebarCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="space-y-6">
          {/* Brand/Logo header */}
          <div className="px-6 h-20 flex items-center justify-between border-b border-white/[0.04]">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="relative shrink-0">
                <ShieldAlert className="w-7 h-7 text-cyan-400" />
                <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10" />
              </div>
              {!isSidebarCollapsed && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <span className="text-xs font-bold tracking-widest bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent uppercase block">
                    Credit Intel
                  </span>
                  <span className="block text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">{user?.role === "user" ? "USER HUB" : "OPS PORTAL"}</span>
                </motion.div>
              )}
            </Link>

            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-slate-500 hover:text-white hover:bg-white/5 p-1 rounded-md transition-all duration-200"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher */}
          {!isSidebarCollapsed && (
            <div className="px-4 relative">
              <button 
                onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] rounded-xl text-left text-xs font-semibold text-slate-200 transition-all duration-200"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)] shrink-0" />
                  <span className="truncate">{user?.role === "user" ? "Borrower Console" : activeWorkspace}</span>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              </button>
              
              <AnimatePresence>
                {workspaceMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setWorkspaceMenuOpen(false)} />
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-4 right-4 mt-1 bg-[#0b0f19] border border-white/[0.06] rounded-xl shadow-2xl p-1 z-50 text-xs text-slate-400 space-y-0.5"
                    >
                      {(user?.role === "user" ? ["Borrower Core Dashboard", "Asset Verification Hub", "Support Workspace"] : ["Corporate Underwriting", "Retail Lending Core", "Compliance Sandbox"]).map((ws) => (
                        <button
                          key={ws}
                          onClick={() => {
                            setActiveWorkspace(ws);
                            setWorkspaceMenuOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/[0.03] hover:text-white transition-colors ${
                            activeWorkspace === ws ? "text-cyan-400 bg-cyan-500/5 font-bold" : ""
                          }`}
                        >
                          {ws}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Navigation links */}
          <div className="px-3 space-y-1">
            <span className={`text-[9px] font-mono uppercase text-slate-500 block px-3 tracking-widest mb-2 ${
              isSidebarCollapsed ? "text-center" : ""
            }`}>
              {isSidebarCollapsed ? (user?.role === "user" ? "USER" : "OPS") : (user?.role === "user" ? "Borrower Portal" : "Operations Control")}
            </span>

            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === "/customers" && location.pathname.startsWith("/customers/"));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`relative w-full flex items-center gap-3.5 px-4.5 py-3 rounded-xl text-xs font-semibold transition-all duration-300 group ${
                    isActive 
                      ? "text-cyan-400 font-bold" 
                      : "text-slate-400 hover:text-white"
                  }`}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-nav"
                      className="absolute inset-0 bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.3)] rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"}`} />
                  {!isSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* User profile actions */}
        <div className="p-4 border-t border-white/[0.04] space-y-3">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-3 bg-white/[0.01] border border-white/[0.03] p-2.5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase">
                  {user?.email[0]}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-mono text-slate-200 font-semibold truncate leading-tight">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-0.5 text-[8px] font-mono text-slate-400 uppercase tracking-wider">
                    <span className="w-1 h-1 bg-emerald-500 rounded-full" />
                    {user?.role} Session
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout Session
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div 
                className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase"
                title={user?.email}
              >
                {user?.email[0]}
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2.5 rounded-xl transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <header className="sticky top-0 z-40 w-full border-b border-white/[0.04] bg-[#030712]/50 backdrop-blur-xl h-20 flex items-center justify-between px-6">
          {/* Mobile brand header (visible on mobile only) */}
          <div className="flex items-center gap-2 md:hidden">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span className="text-xs font-extrabold tracking-wider bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent uppercase">
              CIP ENGINE
            </span>
          </div>

          {/* Search trigger displaying Ctrl + K hint */}
          <div className="hidden sm:block w-72">
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08] text-slate-500 rounded-xl text-xs transition-all"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Search features or borrowers...</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[9px] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/5">
                <span>Ctrl</span>
                <span>K</span>
              </div>
            </button>
          </div>

          {/* User controls / Alerts */}
          <div className="flex items-center gap-4">
            
            {/* Search icon triggers Command Palette on narrow devices */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="sm:hidden text-slate-400 hover:text-white p-2"
              title="Global Search"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] text-slate-400 hover:text-white p-2.5 rounded-xl transition-all"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_8px_rgba(6,182,212,1)]" />
                )}
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-80 bg-[#0b0f19] border border-white/[0.08] shadow-2xl rounded-2xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 bg-white/[0.01] border-b border-white/[0.04] flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Inbox className="w-3.5 h-3.5 text-cyan-400" /> Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllRead}
                            className="text-[9px] font-mono text-cyan-400 hover:text-cyan-300 uppercase"
                          >
                            Mark All Read
                          </button>
                        )}
                      </div>
                      
                      <div className="max-h-64 overflow-y-auto divide-y divide-white/[0.04]">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`p-3 text-xs transition-colors hover:bg-white/[0.01] ${
                              n.read ? "opacity-60" : "bg-cyan-500/[0.02]"
                            }`}
                          >
                            <div className="flex justify-between font-semibold text-slate-200">
                              <span>{n.title}</span>
                              <span className="text-[9px] font-mono text-slate-500">{n.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">{n.desc}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Micro details badge */}
            <div className="hidden md:flex items-center gap-2 bg-cyan-500/5 border border-cyan-500/10 px-3 py-1.5 rounded-xl">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider">AI Copilot Activated</span>
            </div>

            {/* Mobile Menu trigger */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-400 hover:text-white p-2.5 bg-white/[0.01] border border-white/[0.04] rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </header>

        {/* Mobile Nav overlay menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex justify-start"
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: -260 }}
                animate={{ x: 0 }}
                exit={{ x: -260 }}
                transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                className="w-72 bg-[#080d19] border-r border-white/[0.06] p-8 space-y-6 flex flex-col justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-7 h-7 text-cyan-400" />
                    <span className="text-xs font-extrabold tracking-widest bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent uppercase">
                      Risk Engine
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                            isActive 
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold" 
                              : "text-slate-400 hover:text-white hover:bg-white/[0.01]"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-mono text-[9px] text-slate-500 border-t border-white/[0.04] pt-4">
                    <p className="text-slate-300 font-semibold truncate">{user?.email}</p>
                    <p className="uppercase mt-0.5">{user?.role} SECURE SESSION</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> <span>Logout Session</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Box */}
        <main className="flex-1 min-w-0 p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/customers" element={<ProtectedRoute roles={["admin", "analyst"]}><CustomerDirectory /></ProtectedRoute>} />
                <Route path="/customers/:id" element={<ProtectedRoute roles={["admin", "analyst"]}><CustomerProfile /></ProtectedRoute>} />
                <Route path="/predict" element={<ProtectedRoute><Predict /></ProtectedRoute>} />
                <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Ctrl + K Command Palette */}
      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login isAdminEntry={true} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};
export default App;
