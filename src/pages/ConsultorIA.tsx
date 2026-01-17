import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Bot, User, Loader2, Mic, Paperclip } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ConsultorIA = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Olá! Sou o assistente Kadig 👋\n\nComo posso ajudar você hoje?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const aiResponses = [
        "Ótima pergunta! Baseado no seu perfil de investidor, recomendo diversificar sua carteira entre renda fixa e variável. Posso detalhar mais sobre cada opção?",
        "Analisando sua carteira atual, vejo que você tem uma boa exposição em ações. Para equilibrar o risco, sugiro considerar alguns títulos de renda fixa como Tesouro IPCA+.",
        "Para atingir sua meta de patrimônio, sugiro aumentar seus aportes mensais em pelo menos 15%. Isso pode acelerar significativamente seus objetivos financeiros.",
        "Considerando o cenário atual de juros, investimentos em renda fixa como CDBs e LCIs estão oferecendo retornos atrativos. Quer que eu explique mais sobre essas opções?",
      ];

      const randomResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: randomResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
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

  return (
    <div className="light-theme min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-5 py-4 safe-area-inset-top">
        <button
          onClick={() => navigate("/app")}
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-800 text-sm">Kadig AI</h1>
            <p className="text-[11px] text-emerald-500 font-medium">Online</p>
          </div>
        </div>

        <div className="w-10" /> {/* Spacer for centering */}
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {message.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-200/40">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div
                className={`max-w-[85%] ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-3xl rounded-br-lg px-5 py-3.5 shadow-lg shadow-slate-300/30"
                    : "bg-white text-slate-700 rounded-3xl rounded-bl-lg px-5 py-3.5 shadow-sm border border-slate-100"
                }`}
              >
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <span
                  className={`text-[10px] mt-2 block ${
                    message.role === "user" ? "text-slate-400" : "text-slate-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {message.role === "user" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center flex-shrink-0 shadow-md">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200/40">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm border border-slate-100">
              <div className="flex items-center gap-1.5">
                <motion.div
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className="w-2 h-2 bg-emerald-400 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="w-2 h-2 bg-emerald-400 rounded-full"
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
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-600 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm"
              >
                {action}
              </motion.button>
            ))}
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modern Input Area */}
      <div className="p-4 safe-area-inset-bottom">
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 p-2">
          <div className="flex items-end gap-2">
            <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex-shrink-0">
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
                className="w-full bg-transparent text-slate-700 placeholder:text-slate-400 resize-none outline-none text-[15px] py-3 px-2 max-h-32"
                style={{ minHeight: "24px" }}
              />
            </div>

            <button className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex-shrink-0">
              <Mic className="w-5 h-5" />
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-200/50 flex-shrink-0"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
        
        <p className="text-center text-[11px] text-slate-400 mt-3">
          Kadig AI pode cometer erros. Verifique informações importantes.
        </p>
      </div>
    </div>
  );
};

export default ConsultorIA;
