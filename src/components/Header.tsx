import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useState } from "react";
import kadigLogo from "@/assets/kadig-logo.png";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="mx-3 sm:mx-6 mt-3 sm:mt-4">
        <div className="glass-strong rounded-2xl px-4 sm:px-8 py-3 sm:py-4 flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-3"
          >
            <img src={kadigLogo} alt="Kadig" className="h-8 sm:h-12" />
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

          <div className="flex items-center gap-2 sm:gap-4">
            <a 
              href="https://apps.apple.com/app/kadig" 
              target="_blank" 
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img 
                src="/app-store-badge.svg" 
                alt="Disponível na App Store" 
                className="h-6 sm:h-9"
              />
            </a>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 sm:px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-medium hover:bg-kadig-light transition-colors"
            >
              Entrar
            </motion.button>
            <button 
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl mt-2 p-4 md:hidden"
          >
            {["Patrimônio", "Análises", "Segurança"].map((item) => (
              <a
                key={item}
                href="#"
                className="block px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-secondary/50"
              >
                {item}
              </a>
            ))}
            <a 
              href="https://apps.apple.com/app/kadig" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block mt-3 px-4"
            >
              <img 
                src="/app-store-badge.svg" 
                alt="Disponível na App Store" 
                className="h-10"
              />
            </a>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};
