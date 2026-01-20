import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import kadigLogo from "@/assets/kadig-logo.png";

const Sobre = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  return (
    <div className={`min-h-screen bg-background ${theme === "light" ? "light-theme" : ""}`}>
      {/* Header */}
      <header className="flex items-center gap-4 p-4 safe-area-inset-top">
        <button 
          onClick={() => navigate("/app", { state: { returnToTab: "conta" } })}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Sobre</h1>
      </header>

      <div className="p-6 space-y-8">
        {/* Logo and Version */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center mb-4 shadow-lg">
            <img src={kadigLogo} alt="Kadig" className="w-16 h-16 object-contain" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Kadig</h2>
          <p className="text-muted-foreground">Versão 1.0.0</p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-5 border border-border"
        >
          <p className="text-muted-foreground text-center leading-relaxed">
            O Kadig é seu assistente financeiro pessoal, projetado para ajudá-lo a 
            gerenciar suas carteiras de investimentos, acompanhar seu patrimônio e 
            tomar decisões financeiras mais inteligentes.
          </p>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {[
            { label: "Termos de Uso", href: "#" },
            { label: "Política de Privacidade", href: "/privacidade" },
            { label: "Central de Ajuda", href: "#" },
          ].map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="flex items-center justify-between py-4 px-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
            >
              <span className="font-medium text-foreground">{link.label}</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          ))}
        </motion.div>

        {/* Credits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center pt-4"
        >
          <p className="text-sm text-muted-foreground">
            © 2026 Kadig. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Feito com 💙 no Brasil
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Sobre;
