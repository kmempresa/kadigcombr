import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, User, Mic, Paperclip, Sparkles, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import biancaConsultora from "@/assets/bianca-consultora.png";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/hooks/useSubscription";
import PremiumSubscriptionDrawer from "@/components/PremiumSubscriptionDrawer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kadig-ai-chat`;

const ConsultorIA = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isPremium, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useSubscription();
  const [premiumDrawerOpen, setPremiumDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou a Bianca, sua consultora financeira pessoal 👋\n\nConheço sua carteira de investimentos e estou aqui para te ajudar com análises personalizadas, recomendações e tirar suas dúvidas.\n\nComo posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const streamChat = async (userMessages: { role: string; content: string }[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Você precisa estar logado para usar o consultor IA");
      navigate("/auth");
      return;
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (resp.status === 429) {
      toast.error("Muitas requisições. Aguarde um momento.");
      throw new Error("Rate limited");
    }

    if (resp.status === 402) {
      toast.error("Limite de uso atingido.");
      throw new Error("Payment required");
    }

    if (!resp.ok || !resp.body) {
      const error = await resp.json().catch(() => ({}));
      toast.error(error.error || "Erro ao processar mensagem");
      throw new Error(error.error || "Failed to start stream");
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    // Create assistant message placeholder
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => prev.map(m => 
              m.id === assistantId 
                ? { ...m, content: assistantContent }
                : m
            ));
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            assistantContent += content;
            setMessages(prev => prev.map(m => 
              m.id === assistantId 
                ? { ...m, content: assistantContent }
                : m
            ));
          }
        } catch { /* ignore */ }
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const userInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      // Build messages array for AI (without timestamps and ids)
      const aiMessages = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));
      aiMessages.push({ role: "user", content: userInput });

      await streamChat(aiMessages);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Analisar minha carteira",
    "Melhores investimentos",
    "Como reduzir riscos?",
  ];

  const themeClass = theme === "light" ? "light-theme" : "";

  // Show loading while checking subscription
  if (isLoadingSubscription) {
    return (
      <div className={`${themeClass} bg-gradient-to-b from-background to-card flex flex-col items-center justify-center min-h-screen`}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show premium gate if not subscribed
  if (!isPremium) {
    return (
      <div 
        className={`${themeClass} bg-gradient-to-b from-background to-card flex flex-col`}
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          overflow: 'hidden',
          height: '100%',
          width: '100%'
        }}
      >
        <header 
          className="flex items-center justify-between px-5 py-4 safe-area-inset-top"
          style={{ flexShrink: 0 }}
        >
          <button
            onClick={() => navigate("/app")}
            className="w-10 h-10 rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl mb-6">
            <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-muted-foreground">RECURSO PREMIUM</span>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-2">Conheça a Bianca</h1>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Sua consultora financeira pessoal com inteligência artificial para análises personalizadas da sua carteira.
          </p>
          
          <button
            onClick={() => setPremiumDrawerOpen(true)}
            className="bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white font-semibold px-8 py-4 rounded-2xl flex items-center gap-2 hover:shadow-lg transition-shadow"
          >
            <Sparkles className="w-5 h-5" />
            Desbloquear por R$ 39,90/mês
          </button>
        </div>

        <PremiumSubscriptionDrawer
          isOpen={premiumDrawerOpen}
          onClose={() => setPremiumDrawerOpen(false)}
          onSubscribe={() => {
            refetchSubscription();
          }}
        />
      </div>
    );
  }

  return (
    <div 
      className={`${themeClass} bg-gradient-to-b from-background to-card flex flex-col`}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        overflow: 'hidden',
        height: '100%',
        width: '100%'
      }}
    >
      {/* Minimal Header - Fixed */}
      <header 
        className="flex items-center justify-between px-5 py-4 safe-area-inset-top bg-gradient-to-b from-background to-transparent"
        style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}
      >
        <button
          onClick={() => navigate("/app")}
          className="w-10 h-10 rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-lg shadow-primary/20">
              <img src={biancaConsultora} alt="Bianca Consultora" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground text-sm">Bianca Consultora</h1>
            <p className="text-[11px] text-emerald-500 font-medium">
              {isAuthenticated ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="w-10" />
      </header>

      {/* Messages Area - Scrollable */}
      <div 
        className="px-5 py-4 space-y-6"
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          position: 'relative'
        }}
      >
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-primary/20">
                  <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl rounded-br-lg px-5 py-3.5 shadow-lg"
                    : "bg-card text-card-foreground rounded-3xl rounded-bl-lg px-5 py-3.5 shadow-sm border border-border"
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span className="text-[10px] mt-2 block opacity-60">
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-primary/20">
              <img src={biancaConsultora} alt="Bianca" className="w-full h-full object-cover" />
            </div>
            <div className="bg-card rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm border border-border">
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick Actions - Show only if few messages */}
        {messages.length <= 2 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 pt-4"
          >
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setInput(action);
                  inputRef.current?.focus();
                }}
                className="px-4 py-2.5 bg-card border border-border rounded-2xl text-sm text-muted-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                {action}
              </motion.button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Input Area - Fixed */}
      <div 
        className="p-4 safe-area-inset-bottom bg-gradient-to-t from-card to-transparent"
        style={{ flexShrink: 0, position: 'relative', zIndex: 10 }}
      >
        <div className="bg-card rounded-3xl shadow-lg border border-border p-2">
          <div className="flex items-end gap-2">
            <button className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-all flex-shrink-0">
              <Paperclip className="w-5 h-5" />
            </button>
            
            <div className="flex-1 min-h-[44px] flex items-center">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo..."
                rows={1}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-[15px] py-3 px-2 max-h-32"
                style={{ minHeight: "24px" }}
              />
            </div>

            <button className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-all flex-shrink-0">
              <Mic className="w-5 h-5" />
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          Bianca conhece sua carteira e dá recomendações personalizadas
        </p>
      </div>
    </div>
  );
};

export default ConsultorIA;
