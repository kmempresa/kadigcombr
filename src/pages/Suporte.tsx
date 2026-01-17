import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Paperclip, 
  Send, 
  X, 
  MessageCircle, 
  HelpCircle, 
  Bug, 
  Lightbulb,
  CreditCard,
  MoreHorizontal,
  Mail,
  Clock,
  CheckCircle2
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const Suporte = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [email, setEmail] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anexo, setAnexo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categorias = [
    { value: "duvida", label: "Dúvida", icon: HelpCircle, color: "text-blue-500" },
    { value: "problema", label: "Problema", icon: Bug, color: "text-red-500" },
    { value: "sugestao", label: "Sugestão", icon: Lightbulb, color: "text-yellow-500" },
    { value: "financeiro", label: "Financeiro", icon: CreditCard, color: "text-green-500" },
    { value: "outro", label: "Outro", icon: MoreHorizontal, color: "text-muted-foreground" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("O arquivo deve ter no máximo 5MB");
        return;
      }
      setAnexo(file);
    }
  };

  const removeAnexo = () => {
    setAnexo(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !categoria || !descricao) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    
    setEmail("");
    setCategoria("");
    setDescricao("");
    setAnexo(null);
    setIsSubmitting(false);
  };

  const selectedCategoria = categorias.find(c => c.value === categoria);

  return (
    <div className={`${theme === "light" ? "light-theme" : ""} min-h-screen bg-background`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <h1 className="text-xl font-semibold text-foreground">Suporte</h1>
      </header>

      <div className="p-4 space-y-6 pb-8">
        {/* Hero Section */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <MessageCircle className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-1">Como podemos ajudar?</h2>
              <p className="text-sm text-muted-foreground">
                Nossa equipe está pronta para resolver suas dúvidas e problemas.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 flex gap-6 mt-6 pt-4 border-t border-primary/10">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Resposta em até 24h</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">98% resolvidos</span>
            </div>
          </div>
        </motion.section>

        {/* Category Selection */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label className="text-sm font-medium text-foreground mb-3 block">
            Qual é o assunto? <span className="text-destructive">*</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {categorias.map((cat) => {
              const Icon = cat.icon;
              const isSelected = categoria === cat.value;
              return (
                <motion.button
                  key={cat.value}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCategoria(cat.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                      : "bg-card hover:bg-muted"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? "text-primary-foreground" : cat.color}`} />
                  <span className={`text-[10px] font-medium ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`}>
                    {cat.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </motion.section>

        {/* Form Card */}
        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl p-5 space-y-5 shadow-sm border border-border/50"
        >
          {/* Selected Category Badge */}
          <AnimatePresence>
            {selectedCategoria && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-xl w-fit"
              >
                <selectedCategoria.icon className={`w-4 h-4 ${selectedCategoria.color}`} />
                <span className="text-sm font-medium text-foreground">{selectedCategoria.label}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              Seu email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground h-12 rounded-xl"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Descreva em detalhes <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Como podemos ajudá-lo? Descreva sua situação com o máximo de detalhes possível..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[140px] resize-none rounded-xl"
              maxLength={1000}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Quanto mais detalhes, mais rápido resolvemos!
              </p>
              <p className="text-xs text-muted-foreground">
                {descricao.length}/1000
              </p>
            </div>
          </div>

          {/* Anexo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Anexar arquivo
            </label>
            
            {anexo ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-4 bg-primary/10 rounded-xl border border-primary/20"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {anexo.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(anexo.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={removeAnexo}
                  className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-4 h-4 text-destructive" />
                </motion.button>
              </motion.div>
            ) : (
              <label className="flex items-center gap-4 p-4 bg-background rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Paperclip className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Anexar arquivo</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, PDF até 5MB</p>
                </div>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
              </label>
            )}
          </div>

          {/* Submit Button */}
          <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting || !email || !categoria || !descricao}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 disabled:shadow-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Enviar mensagem
                </>
              )}
            </Button>
          </motion.div>
        </motion.form>

        {/* Quick Contact */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-3xl p-5 shadow-sm border border-border/50"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Prefere email direto?</p>
              <a 
                href="mailto:suporte@kadig.com.br" 
                className="text-base font-semibold text-primary hover:underline"
              >
                suporte@kadig.com.br
              </a>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default Suporte;
