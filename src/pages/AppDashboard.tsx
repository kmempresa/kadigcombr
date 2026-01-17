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
  Target,
  PiggyBank
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
    { name: "Renda Fixa", value: 50, color: "hsl(210, 100%, 50%)" },
    { name: "Ações", value: 30, color: "hsl(280, 70%, 55%)" },
    { name: "FIIs", value: 20, color: "hsl(35, 95%, 55%)" },
  ];

  return (
    <div className="light-theme min-h-screen bg-background flex flex-col">
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
            <header className="sticky top-0 bg-background/95 backdrop-blur-sm z-40 border-b border-border/50">
              <div className="flex items-center justify-between px-5 py-4 safe-area-inset-top">
                <button className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                  <span className="text-base font-semibold text-foreground">Minha Carteira</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <div className="flex items-center gap-1">
                  <button className="p-2.5 rounded-full hover:bg-muted/50 transition-colors">
                    <Bell className="w-5 h-5 text-muted-foreground" />
                  </button>
                  <button 
                    className="p-2.5 rounded-full hover:bg-muted/50 transition-colors" 
                    onClick={() => setShowValues(!showValues)}
                  >
                    {showValues ? <Eye className="w-5 h-5 text-muted-foreground" /> : <EyeOff className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <button className="ml-1 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
                    <Plus className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Sub Tabs */}
              <div className="flex px-5 gap-6">
                {[
                  { id: "resumo", label: "Resumo" },
                  { id: "ativos", label: "Ativos" },
                  { id: "analises", label: "Análises" },
                  { id: "extrato", label: "Extrato" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setCarteiraTab(tab.id as any)}
                    className={`pb-3 text-sm font-medium transition-colors relative ${
                      carteiraTab === tab.id
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground/70"
                    }`}
                  >
                    {tab.label}
                    {carteiraTab === tab.id && (
                      <motion.div
                        layoutId="carteiraTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                      />
                    )}
                  </button>
                ))}
              </div>
            </header>

            {/* Resumo Content */}
            {carteiraTab === "resumo" && (
              <div className="px-5 py-6 space-y-8">
                {/* Portfolio Value Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-3xl p-6 border border-primary/10"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Patrimônio Total</p>
                      <h2 className="text-3xl font-bold text-foreground tracking-tight">
                        {formatCurrency(127450.53)}
                      </h2>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          +{formatPercent(2.64)}
                        </span>
                        <span className="text-xs text-muted-foreground">este mês</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Ganho de Capital</p>
                      <p className="text-lg font-semibold text-emerald-600">
                        +{formatCurrency(3280.26)}
                      </p>
                    </div>
                  </div>

                  {/* Mini Stats */}
                  <div className="flex items-center gap-4 pt-4 border-t border-primary/10">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">Carteira</p>
                      <p className="text-base font-bold text-foreground">{formatPercent(0.49)}</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex-1 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">CDI</p>
                      <p className="text-base font-bold text-primary">{formatPercent(0.55)}</p>
                    </div>
                    <div className="w-px h-8 bg-border" />
                    <div className="flex-1 text-center">
                      <p className="text-xs text-muted-foreground mb-0.5">IPCA</p>
                      <p className="text-base font-bold text-orange-500">{formatPercent(0.17)}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Allocation Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Alocação</h3>
                    <button className="text-xs text-primary font-medium">Ver detalhes</button>
                  </div>
                  
                  <div className="space-y-3">
                    {portfolioData.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-foreground flex-1">{item.name}</span>
                        <span className="text-sm font-semibold text-foreground">{item.value}%</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* AI Consultant Card */}
                <motion.button 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-violet-500/20"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-white">Consultor Kadig IA</h3>
                    <p className="text-sm text-white/80">Tire suas dúvidas agora</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </motion.button>

                {/* Goals Section */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Metas</h3>
                    <button className="text-xs text-primary font-medium">+ Nova meta</button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Goal Card 1 */}
                    <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <PiggyBank className="w-4 h-4 text-emerald-600" />
                        </div>
                        <span className="font-medium text-foreground text-sm">Renda Passiva</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Atual</span>
                          <span className="font-medium text-foreground">{formatCurrency(450)}/mês</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[45%] bg-emerald-500 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Meta</span>
                          <span className="font-medium text-foreground">{formatCurrency(1000)}/mês</span>
                        </div>
                      </div>
                    </div>

                    {/* Goal Card 2 */}
                    <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-medium text-foreground text-sm">Patrimônio</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Atual</span>
                          <span className="font-medium text-foreground">{formatCurrency(127450)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full w-[64%] bg-primary rounded-full" />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Meta</span>
                          <span className="font-medium text-foreground">{formatCurrency(200000)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Other tabs placeholder */}
            {carteiraTab !== "resumo" && (
              <div className="flex-1 flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-sm">Em breve</p>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Conta Tab Content */}
        {activeTab === "conta" && (
          <motion.div 
            key="conta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 pb-24"
          >
            {/* Header */}
            <header className="px-5 py-6 safe-area-inset-top">
              <h1 className="text-xl font-bold text-foreground mb-5">Conta</h1>
              
              {/* Profile Section */}
              <button className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border border-border hover:shadow-md transition-shadow">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground text-lg">{profile.name}</p>
                  <span className="text-xs text-muted-foreground">Plano Gratuito</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </header>

            {/* Premium Card */}
            <div className="px-5 mb-6">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-5 shadow-xl shadow-violet-500/20">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white mb-1">Kadig Premium</h3>
                    <p className="text-white/80 text-sm mb-4">
                      Análises avançadas e recomendações personalizadas
                    </p>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-white">R$ 29,90</span>
                      <span className="text-white/70 text-sm">/mês</span>
                    </div>
                    <button className="bg-white text-violet-600 font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg">
                      Assinar agora
                    </button>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                    <Sparkles className="w-7 h-7 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="px-5 space-y-1">
              {[
                { icon: Shield, label: "Central de segurança", badge: "Novo" },
                { icon: Link2, label: "Open Finance" },
                { icon: Settings, label: "Preferências" },
                { icon: MessageSquare, label: "Suporte" },
                { icon: Info, label: "Sobre" },
              ].map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between py-4 px-1 hover:bg-muted/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="font-medium text-foreground">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}

              <div className="pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 py-4 px-1 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair da conta</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Other tabs placeholder */}
        {(activeTab === "trade" || activeTab === "conexoes" || activeTab === "mercado") && (
          <motion.div 
            key="other"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 pb-24 flex items-center justify-center"
          >
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                {activeTab === "trade" && <TrendingUp className="w-7 h-7 text-muted-foreground" />}
                {activeTab === "conexoes" && <Link2 className="w-7 h-7 text-muted-foreground" />}
                {activeTab === "mercado" && <BarChart3 className="w-7 h-7 text-muted-foreground" />}
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                {activeTab === "trade" && "Trade"}
                {activeTab === "conexoes" && "Conexões"}
                {activeTab === "mercado" && "Mercado"}
              </h2>
              <p className="text-muted-foreground text-sm">Em breve</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border z-50">
        <div className="flex justify-around py-2 safe-area-inset-bottom">
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
              className={`flex flex-col items-center gap-1 px-4 py-2 transition-all ${
                activeTab === tab.id 
                  ? "text-primary" 
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "scale-110" : ""} transition-transform`} />
              <span className={`text-xs ${activeTab === tab.id ? "font-semibold" : "font-medium"}`}>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppDashboard;
