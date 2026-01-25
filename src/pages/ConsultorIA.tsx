import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, User, History, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import biancaConsultora from "@/assets/bianca-consultora.png";
import { useTheme } from "@/hooks/useTheme";
import { useSubscription } from "@/hooks/useSubscription";
import PremiumSubscriptionDrawer from "@/components/PremiumSubscriptionDrawer";
import PremiumPaywall from "@/components/PremiumPaywall";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/kadig-ai-chat`;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Olá! Sou a Bianca, sua consultora financeira pessoal 👋\n\nConheço sua carteira de investimentos e estou aqui para te ajudar com análises personalizadas, recomendações e tirar suas dúvidas.\n\nComo posso ajudar você hoje?",
  timestamp: new Date(),
};

const ConsultorIA = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isPremium, isLoading: isLoadingSubscription, refetch: refetchSubscription } = useSubscription();
  const [premiumDrawerOpen, setPremiumDrawerOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Conversation memory state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check authentication and load conversations
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (session) {
        setUserId(session.user.id);
        loadConversations(session.user.id);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setUserId(session.user.id);
        loadConversations(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load user's conversations
  const loadConversations = async (uid: string) => {
    setLoadingConversations(true);
    try {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", uid)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setConversations(data || []);
      console.log("Loaded conversations:", data?.length);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  // Load messages for a specific conversation
  const loadConversationMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const loadedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));
        setMessages([WELCOME_MESSAGE, ...loadedMessages]);
        setCurrentConversationId(conversationId);
        console.log("Loaded messages for conversation:", conversationId, data.length);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Erro ao carregar conversa");
    }
  };

  // Create a new conversation
  const createNewConversation = async (firstMessage: string): Promise<string | null> => {
    if (!userId) return null;

    try {
      // Generate title from first message (first 50 chars)
      const title = firstMessage.length > 50 
        ? firstMessage.substring(0, 47) + "..." 
        : firstMessage;

      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: userId,
          title: title,
        })
        .select()
        .single();

      if (error) throw error;
      
      console.log("Created new conversation:", data.id);
      setCurrentConversationId(data.id);
      
      // Refresh conversations list
      await loadConversations(userId);
      
      return data.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  };

  // Save a message to the database
  const saveMessage = async (conversationId: string, role: "user" | "assistant", content: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("chat_messages")
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role: role,
          content: content,
        });

      if (error) throw error;

      // Update conversation's updated_at
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);

      console.log("Saved message to conversation:", conversationId);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    if (!userId) return;

    try {
      // Delete messages first (foreign key constraint)
      await supabase
        .from("chat_messages")
        .delete()
        .eq("conversation_id", conversationId);

      // Delete conversation
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      toast.success("Conversa excluída");
      
      // If this was the current conversation, start fresh
      if (currentConversationId === conversationId) {
        startNewChat();
      }
      
      // Refresh list
      await loadConversations(userId);
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Erro ao excluir conversa");
    }
  };

  // Start a new chat
  const startNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const streamChat = async (userMessages: { role: string; content: string }[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.error("Você precisa estar logado para usar o consultor IA");
      navigate("/auth");
      return null;
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

    return assistantContent;
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
      // Create or get conversation ID
      let convId = currentConversationId;
      if (!convId) {
        convId = await createNewConversation(userInput);
      }

      // Save user message
      if (convId) {
        await saveMessage(convId, "user", userInput);
      }

      // Build messages array for AI (without timestamps and ids)
      const aiMessages = messages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));
      aiMessages.push({ role: "user", content: userInput });

      const assistantResponse = await streamChat(aiMessages);

      // Save assistant response
      if (convId && assistantResponse) {
        await saveMessage(convId, "assistant", assistantResponse);
      }
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

  // Format relative time
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Agora";
    if (hours < 24) return `${hours}h atrás`;
    if (days === 1) return "Ontem";
    if (days < 7) return `${days} dias atrás`;
    return date.toLocaleDateString("pt-BR");
  };

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
      <div className={`${themeClass} min-h-screen bg-background flex flex-col`}>
        <header className="flex items-center justify-between px-5 py-4 safe-area-inset-top relative z-20 bg-gradient-to-b from-background to-transparent flex-shrink-0">
          <button
            onClick={() => navigate("/app")}
            className="w-10 h-10 rounded-full bg-card shadow-sm border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-all"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10" />
        </header>

        <div className="flex-1 overflow-hidden">
          <PremiumPaywall type="bianca" onSubscribe={() => setPremiumDrawerOpen(true)} />
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
    <div className={`${themeClass} bg-gradient-to-b from-background to-card flex flex-col h-screen overflow-hidden`}>
      {/* History Drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-card z-50 shadow-2xl flex flex-col safe-area-inset-top"
            >
              {/* Drawer Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Conversas</h2>
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* New Chat Button */}
              <div className="p-4 border-b border-border">
                <button
                  onClick={startNewChat}
                  className="w-full py-3 px-4 bg-gradient-to-r from-kadig-blue to-kadig-cyan text-white rounded-2xl font-medium flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nova Conversa
                </button>
              </div>

              {/* Conversations List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Nenhuma conversa ainda</p>
                    <p className="text-xs mt-1">Suas conversas aparecerão aqui</p>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative rounded-2xl transition-all ${
                        currentConversationId === conv.id
                          ? "bg-primary/10 border border-primary/30"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <button
                        onClick={() => {
                          loadConversationMessages(conv.id);
                          setShowHistory(false);
                        }}
                        className="w-full p-4 text-left"
                      >
                        <p className="font-medium text-foreground text-sm line-clamp-2">
                          {conv.title || "Conversa sem título"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(conv.updated_at)}
                        </p>
                      </button>
                      
                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Minimal Header - Fixed */}
      <header className="flex items-center justify-between px-5 py-4 safe-area-inset-top bg-gradient-to-b from-background to-transparent flex-shrink-0 relative z-10">
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

        {/* Spacer */}
        <div className="w-10" />
      </header>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 px-5 py-4 space-y-6 overflow-y-auto overflow-x-hidden">
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
      <div className="flex-shrink-0 p-4 safe-area-inset-bottom bg-gradient-to-t from-card to-transparent relative z-10">
        <div className="bg-card rounded-3xl shadow-lg border border-border p-2">
          <div className="flex items-end gap-2">
            <div className="flex-1 min-h-[44px] flex items-center">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pergunte algo..."
                rows={1}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none text-[15px] py-3 px-3 max-h-32"
                style={{ minHeight: "24px" }}
              />
            </div>
            
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
          {currentConversationId 
            ? "💾 Conversa salva automaticamente"
            : "Bianca conhece sua carteira e dá recomendações personalizadas"
          }
        </p>
      </div>
    </div>
  );
};

export default ConsultorIA;