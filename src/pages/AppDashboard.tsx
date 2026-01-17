import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Bell, 
  Eye,
  EyeOff,
  Plus,
  ChevronRight,
  ChevronDown,
  User,
  Wallet,
  TrendingUp,
  Link2,
  BarChart3,
  Shield,
  Settings,
  MessageSquare,
  Info,
  LogOut,
  Sparkles,
  PieChart
} from "lucide-react";

interface UserProfile {
  name: string;
  experience: string;
  riskTolerance: string;
}

const AppDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"carteira" | "trade" | "conexoes" | "mercado" | "conta">("carteira");
  const [carteiraTab, setCarteiraTab] = useState<"resumo" | "ativos" | "analises" | "extrato">("resumo");
  const [showValues, setShowValues] = useState(true);

  useEffect(() => {
    const savedProfile = localStorage.getItem("kadig-user-profile");
    if (!savedProfile) {
      navigate("/onboarding");
      return;
    }
    setProfile(JSON.parse(savedProfile));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("kadig-user-profile");
    navigate("/welcome");
  };

  if (!profile) return null;

  const formatCurrency = (value: number) => {
    if (!showValues) return "••••••";
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatPercent = (value: number) => {
    if (!showValues) return "••••";
    return `${value.toFixed(2)}%`;
  };

  // Portfolio data
  const portfolioData = [
    { label: "Renda Fixa", value: 50, color: "#0EA5E9" },
    { label: "Ações", value: 30, color: "#8B5CF6" },
    { label: "FIIs", value: 20, color: "#F97316" },
  ];

  return (
    <div className="light-theme min-h-screen bg-[#FAFBFC] flex flex-col">
      {/* Carteira Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "carteira" && (
          <motion.div 
            key="carteira"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 pb-24"
          >
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-5 py-4 safe-area-inset-top">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-white font-bold text-xs">K</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Patrimônio de</p>
                    <button className="flex items-center gap-1 font-semibold text-gray-900">
                      {profile.name}
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center"
                    onClick={() => setShowValues(!showValues)}
                  >
                    {showValues ? (
                      <Eye className="w-4 h-4 text-gray-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center relative">
                    <Bell className="w-4 h-4 text-gray-500" />
                    <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                  </button>
                  <button className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Plus className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </header>

            {/* Sub Tabs */}
            <div className="bg-white px-5 border-b border-gray-100">
              <div className="flex gap-6">
                {[
                  { id: "resumo", label: "Resumo" },
                  { id: "ativos", label: "Ativos" },
                  { id: "analises", label: "Análises" },
                  { id: "extrato", label: "Extrato" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCarteiraTab(tab.id as any)}
                    className={`py-3 text-sm font-medium relative transition-colors ${
                      carteiraTab === tab.id
                        ? "text-gray-900"
                        : "text-gray-400"
                    }`}
                  >
                    {tab.label}
                    {carteiraTab === tab.id && (
                      <motion.div
                        layoutId="carteiraTabIndicator"
                        className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumo Content */}
            {carteiraTab === "resumo" && (
              <div className="p-5 space-y-5">
                {/* Main Balance Card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
                >
                  {/* Total Value */}
                  <div className="text-center mb-6">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Saldo Total</p>
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                      {formatCurrency(127450.53)}
                    </h2>
                  </div>

                  {/* Donut Chart */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-48 h-48">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {/* Background */}
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#F1F5F9"
                          strokeWidth="8"
                        />
                        {/* Segments */}
                        {portfolioData.reduce((acc, item, index) => {
                          const circumference = 2 * Math.PI * 40;
                          const offset = acc.offset;
                          const length = (item.value / 100) * circumference;
                          
                          acc.elements.push(
                            <circle
                              key={index}
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={item.color}
                              strokeWidth="8"
                              strokeDasharray={`${length} ${circumference}`}
                              strokeDashoffset={-offset}
                              strokeLinecap="round"
                              className="transition-all duration-500"
                            />
                          );
                          
                          acc.offset += length;
                          return acc;
                        }, { offset: 0, elements: [] as JSX.Element[] }).elements}
                      </svg>
                      
                      {/* Center Label */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <PieChart className="w-5 h-5 text-gray-300 mb-1" />
                        <span className="text-xs text-gray-400">JAN 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex justify-center gap-4">
                    {portfolioData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-gray-500">{item.label}</span>
                        <span className="text-xs font-semibold text-gray-700">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Performance Stats */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-3 gap-3"
                >
                  <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">Carteira</p>
                    <p className="text-lg font-bold text-emerald-500">{formatPercent(0.49)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">CDI</p>
                    <p className="text-lg font-bold text-primary">{formatPercent(0.55)}</p>
                  </div>
                  <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">IPCA</p>
                    <p className="text-lg font-bold text-orange-500">{formatPercent(0.17)}</p>
                  </div>
                </motion.div>

                {/* Performance Badge */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-emerald-50 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">Ganho de Capital</p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(3280.26)}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-medium">
                    88% CDI
                  </span>
                </motion.div>

                {/* AI Card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-primary to-blue-600 rounded-2xl p-5 text-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Consultor Kadig IA</h3>
                      <p className="text-sm text-white/80">
                        Tire dúvidas e receba recomendações personalizadas para seus investimentos.
                      </p>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-white text-primary font-semibold py-2.5 rounded-xl text-sm">
                    Conversar agora
                  </button>
                </motion.div>

                {/* Goals Section */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Minhas Metas</h3>
                    <button className="text-xs text-primary font-medium">Ver todas</button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {/* Goal Card 1 */}
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Wallet className="w-4 h-4 text-purple-600" />
                        </div>
                        <span className="font-medium text-gray-900 text-sm">Renda Passiva</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                        <div className="bg-purple-500 h-1.5 rounded-full w-0" />
                      </div>
                      <p className="text-xs text-gray-400">Definir meta</p>
                    </div>

                    {/* Goal Card 2 */}
                    <div className="bg-white rounded-xl p-4 border border-gray-100">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium text-gray-900 text-sm">Patrimônio</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full w-1/3" />
                      </div>
                      <p className="text-xs text-gray-400">{formatCurrency(127450.53)}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Placeholder for other sub-tabs */}
            {carteiraTab !== "resumo" && (
              <div className="flex-1 flex items-center justify-center p-10">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-sm">Em breve</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conta Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "conta" && (
          <motion.div 
            key="conta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 pb-24"
          >
            {/* Header */}
            <header className="bg-white px-5 py-6 safe-area-inset-top border-b border-gray-100">
              <h1 className="text-xl font-bold text-gray-900 mb-5">Conta</h1>
              
              {/* Profile Section */}
              <button className="w-full flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-gray-900">{profile.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      Plano Gratuito
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            </header>

            {/* Premium Card */}
            <div className="p-5">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">KADIG PREMIUM</p>
                    <p className="font-bold">R$ 29,90/mês</p>
                  </div>
                </div>
                <p className="text-sm text-white/80 mb-4">
                  Acompanhe com mais clareza o desempenho dos seus investimentos.
                </p>
                <button className="w-full bg-white text-violet-600 font-semibold py-2.5 rounded-xl text-sm">
                  Assinar Premium
                </button>
              </motion.div>
            </div>

            {/* Menu Items */}
            <div className="px-5">
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                {[
                  { icon: Shield, label: "Central de segurança", badge: "Novo" },
                  { icon: Link2, label: "Open Finance" },
                  { icon: Settings, label: "Preferências" },
                  { icon: MessageSquare, label: "Suporte" },
                  { icon: Info, label: "Sobre o Kadig" },
                ].map((item, index, arr) => (
                  <button
                    key={index}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                      index !== arr.length - 1 ? "border-b border-gray-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-400" />
                      <span className="font-medium text-gray-700">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </button>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="w-full mt-4 flex items-center justify-center gap-2 p-4 text-red-500 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sair da conta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Other tabs placeholder */}
      <AnimatePresence mode="wait">
        {(activeTab === "trade" || activeTab === "conexoes" || activeTab === "mercado") && (
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 pb-24 flex items-center justify-center"
          >
            <div className="text-center p-10">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Em desenvolvimento</h3>
              <p className="text-sm text-gray-400">Esta funcionalidade estará disponível em breve.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-area-inset-bottom">
        <div className="flex items-center justify-around py-2">
          {[
            { id: "carteira", icon: Wallet, label: "Carteira" },
            { id: "trade", icon: TrendingUp, label: "Trade" },
            { id: "conexoes", icon: Link2, label: "Conexões" },
            { id: "mercado", icon: BarChart3, label: "Mercado" },
            { id: "conta", icon: User, label: "Conta" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-gray-400"
              }`}
            >
              <div className={`relative ${activeTab === tab.id ? "" : ""}`}>
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "stroke-[2.5]" : ""}`} />
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -inset-2 bg-primary/10 rounded-xl -z-10"
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium ${activeTab === tab.id ? "font-semibold" : ""}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppDashboard;
