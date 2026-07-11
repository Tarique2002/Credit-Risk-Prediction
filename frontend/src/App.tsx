import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  Activity, Users, Calculator, Bot, Shield, 
  LogOut, Menu, X, ShieldAlert 
} from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#020308]">
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = [
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

  return (
    <div className="min-h-screen flex flex-col bg-[#020308] selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.04] bg-[#020308]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShieldAlert className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-400/20 blur-md rounded-full -z-10" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-widest bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent uppercase">
                Credit Risk Engine
              </span>
              <p className="text-[9px] font-mono uppercase text-slate-500 tracking-widest mt-0.5">
                Financial Operations Console
              </p>
            </div>
          </div>

          {/* User details & logout */}
          <div className="hidden md:flex items-center gap-5">
            <div className="text-right font-mono text-[10px]">
              <span className="text-slate-200 font-semibold">{user?.email}</span>
              <div className="flex items-center gap-1.5 justify-end text-slate-400 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="uppercase text-[9px] tracking-wider">{user?.role} Session</span>
              </div>
            </div>
            
            <Magnetic scale={1.1} strength={0.4}>
              <button
                onClick={handleLogout}
                className="bg-white/[0.02] hover:bg-red-500/10 border border-white/[0.04] hover:border-red-500/20 text-slate-400 hover:text-red-400 p-2.5 rounded-xl transition-all duration-300 cursor-pointer"
                title="Logout Session"
              >
                <LogOut className="w-4.5 h-4.5" data-magnetic-inner />
              </button>
            </Magnetic>
          </div>

          {/* Mobile Menu trigger */}
          <div className="md:hidden">
            <Magnetic scale={1.1}>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-400 hover:text-white p-2 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" data-magnetic-inner /> : <Menu className="w-6 h-6" data-magnetic-inner />}
              </button>
            </Magnetic>
          </div>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-6 py-8 gap-8 items-stretch">
        {/* Sidebar (Desktop) */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="sticky top-28 space-y-6">
            <div>
              <span className="text-[9px] font-mono uppercase text-slate-500 px-3 block tracking-widest mb-3">
                Operations Control
              </span>
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path || (item.path === "/customers" && location.pathname.startsWith("/customers/"));
                  return (
                    <Magnetic key={item.name} className="w-full" strength={0.25} scale={1.03}>
                      <Link
                        to={item.path}
                        className={`relative w-full flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 group ${
                          isActive 
                            ? "text-cyan-400 font-bold" 
                            : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="active-nav"
                            className="absolute inset-0 bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_20px_rgba(0,0,0,0.3)] rounded-2xl -z-10"
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                        <Icon className={`w-5 h-5 transition-transform group-hover:scale-105 ${isActive ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"}`} data-magnetic-inner />
                        <span data-magnetic-inner>{item.name}</span>
                      </Link>
                    </Magnetic>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar overlay */}
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
                className="w-72 bg-[#0b0f19] border-r border-white/[0.04] p-8 space-y-6 flex flex-col justify-between"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-8 h-8 text-cyan-400" />
                    <span className="text-sm font-bold tracking-widest bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent uppercase">
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
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
                            isActive 
                              ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
                              : "text-slate-400 hover:text-white hover:bg-white/[0.01]"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-mono text-[10px] text-slate-500 border-t border-white/[0.04] pt-4">
                    <p className="text-slate-300 font-bold truncate">{user?.email}</p>
                    <p className="uppercase mt-0.5">{user?.role} SECURE SESSION</p>
                  </div>
                  <Magnetic className="w-full" strength={0.3} scale={1.03}>
                    <button
                      onClick={handleLogout}
                      className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl px-4 py-3 text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" data-magnetic-inner /> <span data-magnetic-inner>Logout Session</span>
                    </button>
                  </Magnetic>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Box */}
        <main className="flex-1 min-w-0">
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
                <Route path="/customers" element={<ProtectedRoute><CustomerDirectory /></ProtectedRoute>} />
                <Route path="/customers/:id" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />
                <Route path="/predict" element={<ProtectedRoute><Predict /></ProtectedRoute>} />
                <Route path="/ai" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminPanel /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
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
