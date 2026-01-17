import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Send, 
  User,
  Wallet,
  PieChart,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Home
} from "lucide-react";
import kadigLogo from "@/assets/kadig-logo.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface UserProfile {
  name: string;
  experience: string;
  riskTolerance: string;
}

const portfolioData = [
  { name: "Ações", value: 45, change: 2.3, color: "from-primary to-accent" },
  { name: "Renda Fixa", value: 30, change: 0.8, color: "from-emerald-500 to-teal-400" },
  { name: "Cripto", value: 15, change: -1.2, color: "from-amber-500 to-orange-400" },
  { name: "FIIs", value: 10, change: 1.5, color: "from-violet-500 to-purple-400" },
];

const recentAlerts = [
  { message: "PETR4 subiu 3.2% hoje", type: "positive", time: "há 5 min" },
  { message: "Oportunidade: VALE3 em suporte", type: "opportunity", time: "há 15 min" },
  { message: "Bitcoin corrigiu 2%", type: "warning", time: "há 30 min" },
];

const AppDashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "chat">("home");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("kadig-user-profile");
    if (!savedProfile) {
      navigate("/onboarding");
      return;
    }
    const parsedProfile = JSON.parse(savedProfile);
    setProfile(parsedProfile);
    
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: `Olá ${parsedProfile.name}! 👋 Sou seu Consultor Kadig. Com base no seu perfil ${parsedProfile.riskTolerance === "conservative" ? "conservador" : parsedProfile.riskTolerance === "moderate" ? "moderado" : "arrojado"}, estou monitorando oportunidades ideais para você. Como posso te ajudar hoje?`,
        timestamp: new Date()
      }
    ]);
  }, [navigate]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        `Excelente pergunta, ${profile?.name}! Baseado na sua análise de risco ${profile?.riskTolerance}, eu recomendaria diversificar sua carteira com foco em ativos de menor volatilidade. Quer que eu detalhe algumas opções?`,
        `Analisando os dados em tempo real, vejo uma oportunidade interessante para seu perfil. Posso explicar mais sobre isso?`,
        `Com base no seu nível de experiência ${profile?.experience === "beginner" ? "iniciante" : profile?.experience === "intermediate" ? "intermediário" : "avançado"}, sugiro começarmos por entender melhor seus objetivos de curto prazo.`,
      ];
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleLogout = () => {
    localStorage.removeItem("kadig-user-profile");
    navigate("/welcome");
  };

  if (!profile) return null;

  return (
    <div className="light-theme min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar - Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full p-4 safe-area-inset-top safe-area-inset-left">
          <div className="flex items-center justify-between mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
              <img src={kadigLogo} alt="Kadig" className="h-5 brightness-0 invert" />
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="space-y-2 flex-1">
            <Button variant="ghost" className="w-full justify-start gap-3 bg-primary/10 text-primary">
              <Wallet className="w-5 h-5" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <PieChart className="w-5 h-5" />
              Portfólio
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              Alertas
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground">
              <Settings className="w-5 h-5" />
              Configurações
            </Button>
          </nav>

          <div className="border-t border-border pt-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm truncate">{profile.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile.riskTolerance}</p>
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pb-20 lg:pb-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-40 safe-area-inset-top">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
            <img src={kadigLogo} alt="Kadig" className="h-4 brightness-0 invert" />
          </div>
          <div className="w-10" />
        </header>

        {/* Mobile Tab Content */}
        <div className="lg:hidden">
          {activeTab === "home" && (
            <div className="p-4 space-y-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">Olá, {profile.name}! 👋</h1>
                <p className="text-muted-foreground text-sm">Seu portfólio está performando bem</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-muted-foreground text-xs">Patrimônio</p>
                    <p className="text-lg font-bold text-foreground">R$ 127.450</p>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">+2.4%</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-3">
                    <p className="text-muted-foreground text-xs">Lucro do Mês</p>
                    <p className="text-lg font-bold text-foreground">R$ 3.280</p>
                    <div className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">+5.1%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Portfolio Distribution */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-base text-foreground">Distribuição</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {portfolioData.map((item) => (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{item.value}%</span>
                            <span className={`text-xs flex items-center ${item.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(item.change)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Alerts */}
              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-base flex items-center gap-2 text-foreground">
                    <Bell className="w-4 h-4 text-primary" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2">
                    {recentAlerts.map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-2.5 bg-muted/50 rounded-lg">
                        <span className="text-sm text-foreground flex-1 mr-2">{alert.message}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "chat" && (
            <div className="flex flex-col h-[calc(100vh-8rem)]">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-foreground">Consultor Kadig</h2>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    Online
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-primary to-accent text-white rounded-br-md"
                        : "bg-card text-foreground rounded-bl-md border border-border"
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                    <div className="bg-card p-3 rounded-2xl rounded-bl-md border border-border shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card safe-area-inset-bottom">
                <div className="flex gap-2">
                  <Input
                    placeholder="Pergunte ao Consultor..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="bg-muted/50 border-border text-foreground"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:block p-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Portfolio Overview */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Olá, {profile.name}! 👋</h1>
                <p className="text-muted-foreground">Seu portfólio está performando bem hoje</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Patrimônio Total</p>
                        <p className="text-2xl font-bold text-foreground">R$ 127.450,00</p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">+2.4%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card border-border shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">Lucro do Mês</p>
                        <p className="text-2xl font-bold text-foreground">R$ 3.280,00</p>
                      </div>
                      <div className="flex items-center gap-1 text-emerald-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">+5.1%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-foreground">Distribuição do Portfólio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {portfolioData.map((item) => (
                      <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{item.value}%</span>
                            <span className={`text-xs flex items-center ${item.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                              {item.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(item.change)}%
                            </span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <Bell className="w-5 h-5 text-primary" />
                    Alertas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAlerts.map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-foreground">{alert.message}</span>
                        <span className="text-xs text-muted-foreground">{alert.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat with Consultant - Desktop */}
            <div className="lg:col-span-1">
              <Card className="bg-card border-border shadow-sm h-[calc(100vh-6rem)] flex flex-col">
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    Consultor Kadig
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-auto" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                  <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-primary to-accent text-white rounded-br-md"
                            : "bg-card text-foreground rounded-bl-md border border-border"
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-card p-3 rounded-2xl rounded-bl-md border border-border shadow-sm">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                            <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Pergunte ao Consultor Kadig..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        className="bg-muted/50 border-border text-foreground"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim()}
                        className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white shadow-md"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border z-50 safe-area-inset-bottom">
        <div className="flex justify-around py-2">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
              activeTab === "home" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs font-medium">Início</span>
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-lg transition-colors ${
              activeTab === "chat" ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-xs font-medium">Consultor</span>
          </button>
        </div>
      </nav>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AppDashboard;
