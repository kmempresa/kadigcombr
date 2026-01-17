import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Paperclip, Send, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
    { value: "duvida", label: "Dúvida" },
    { value: "problema", label: "Problema técnico" },
    { value: "sugestao", label: "Sugestão" },
    { value: "financeiro", label: "Financeiro" },
    { value: "outro", label: "Outro" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit file size to 5MB
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate submission for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
    
    // Reset form
    setEmail("");
    setCategoria("");
    setDescricao("");
    setAnexo(null);
    setIsSubmitting(false);
  };

  return (
    <div className={`${theme === "light" ? "light-theme" : ""} min-h-screen bg-background`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Suporte</h1>
      </header>

      <div className="p-4 space-y-6">
        {/* Intro Section */}
        <section className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Como podemos ajudar?</h2>
          <p className="text-muted-foreground">
            Envie sua mensagem e nossa equipe responderá o mais rápido possível.
          </p>
        </section>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Seu email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Categoria <span className="text-destructive">*</span>
            </label>
            <Select value={categoria} onValueChange={setCategoria}>
              <SelectTrigger className="bg-card border-border text-foreground">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {categorias.map((cat) => (
                  <SelectItem 
                    key={cat.value} 
                    value={cat.value}
                    className="text-foreground hover:bg-muted focus:bg-muted"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Descrição <span className="text-destructive">*</span>
            </label>
            <Textarea
              placeholder="Descreva sua dúvida ou problema em detalhes..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="bg-card border-border text-foreground placeholder:text-muted-foreground min-h-[150px] resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {descricao.length}/1000 caracteres
            </p>
          </div>

          {/* Anexo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Anexo (opcional)
            </label>
            
            {anexo ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border"
              >
                <Paperclip className="w-5 h-5 text-primary" />
                <span className="flex-1 text-sm text-foreground truncate">
                  {anexo.name}
                </span>
                <button
                  type="button"
                  onClick={removeAnexo}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </motion.div>
            ) : (
              <label className="flex items-center gap-3 p-4 bg-card rounded-xl border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                <Paperclip className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para anexar um arquivo (máx. 5MB)
                </span>
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
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="pt-4"
          >
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl flex items-center justify-center gap-2"
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
        </form>

        {/* Contact Info */}
        <section className="text-center pt-6 pb-8">
          <p className="text-sm text-muted-foreground">
            Ou entre em contato diretamente pelo email:
          </p>
          <a 
            href="mailto:suporte@kadig.com.br" 
            className="text-primary font-medium hover:underline"
          >
            suporte@kadig.com.br
          </a>
        </section>
      </div>
    </div>
  );
};

export default Suporte;
