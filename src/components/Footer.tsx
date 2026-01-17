import { motion } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";

export const Footer = () => {
  return (
    <footer className="py-16 bg-card border-t border-border" id="contato">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center md:items-start"
          >
            <img src={kadigLogo} alt="Kadig" className="h-8 mb-4" />
            <p className="text-sm text-muted-foreground text-center md:text-left">
              Gestão patrimonial inteligente
              <br />
              para o seu futuro.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="flex gap-8"
          >
            {["Privacidade", "Termos", "Suporte"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 pt-8 border-t border-border text-center"
        >
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kadig. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </footer>
  );
};
