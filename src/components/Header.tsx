import { motion } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-6 mt-4">
        <div className="glass-strong rounded-2xl px-6 py-3 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <img src={kadigLogo} alt="Kadig" className="h-10" />
          </motion.div>

          <nav className="hidden md:flex items-center gap-1">
            {["Patrimônio", "Análises", "Segurança"].map((item, i) => (
              <motion.a
                key={item}
                href="#"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary/50"
              >
                {item}
              </motion.a>
            ))}
          </nav>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-kadig-light transition-colors"
          >
            Entrar
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
};
