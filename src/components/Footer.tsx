import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import kadigLogo from "@/assets/kadig-logo.png";
import { ArrowUpRight } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-20 relative">
      {/* CTA Section */}
      <div className="container mx-auto px-6 mb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-strong rounded-3xl p-12 text-center relative overflow-hidden"
        >
          {/* Glow */}
          <div className="absolute inset-0 bg-primary/5 blur-[80px] rounded-full" />

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pronto para assumir o controle?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Junte-se a milhares de pessoas que já transformaram sua gestão patrimonial.
            </p>
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-medium inline-flex items-center gap-2 glow-blue"
            >
              Criar Conta Gratuita
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* Footer content */}
      <div className="container mx-auto px-6">
        <div className="flex flex-col items-center gap-8 py-8 border-t border-border">
          {/* App Store Badge */}
          <a 
            href="https://apps.apple.com/app/kadig" 
            target="_blank" 
            rel="noopener noreferrer"
            className="transition-opacity hover:opacity-80"
          >
            <img 
              src="/app-store-badge.svg" 
              alt="Disponível na App Store" 
              className="h-10"
            />
          </a>

          {/* Links */}
          <div className="flex gap-8">
            <Link
              to="/privacidade"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Política de Privacidade
            </Link>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Termos de Uso
            </a>
            <a
              href="#"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Contato
            </a>
          </div>

          {/* Kadig Logo and Copyright */}
          <div className="flex flex-col items-center gap-3">
            <img src={kadigLogo} alt="Kadig" className="h-6 opacity-60" />
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Kadig
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
