import { motion } from "framer-motion";
import kadigLogo from "@/assets/kadig-logo.png";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border"
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          <img src={kadigLogo} alt="Kadig" className="h-8" />
        </motion.div>

        <nav className="hidden md:flex items-center gap-8">
          {["Soluções", "Sobre", "Contato"].map((item, i) => (
            <motion.a
              key={item}
              href={`#${item.toLowerCase()}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </motion.a>
          ))}
        </nav>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button className="bg-primary text-primary-foreground hover:bg-kadig-navy-light transition-all shadow-md">
            Acessar Plataforma
          </Button>
        </motion.div>
      </div>
    </motion.header>
  );
};
