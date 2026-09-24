import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import kadigIcon from "@/assets/kadig-icon-new.png";
import AccountPageShell from "@/components/AccountPageShell";
import { Button } from "@/components/ui/button";

const Sobre = () => {
  const navigate = useNavigate();

  const links = [
    { label: "Termos de Uso", path: "/termos-de-uso" },
    { label: "Política de Privacidade", path: "/politica-privacidade" },
    { label: "Central de Ajuda", path: "/central-ajuda" },
  ];

  return (
    <AccountPageShell title="Sobre" subtitle="Informações e documentos da Kadig">
      <div className="space-y-7">
        {/* Logo and Version */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <div className="w-24 h-24 rounded-2xl overflow-hidden flex items-center justify-center mb-4 shadow-lg">
            <img src={kadigIcon} alt="Kadig" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Kadig</h2>
          <p className="text-muted-foreground">Versão 1.0.0</p>
        </motion.div>

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
           className="bg-card rounded-xl p-5 border border-border"
        >
          <p className="text-muted-foreground text-center leading-relaxed">
            A Kadig analisa seu patrimônio, encontra oportunidades e riscos e ajuda
            você a tomar decisões financeiras melhores.
          </p>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          {links.map((link, index) => (
            <Button
              variant="ghost"
              key={index}
              onClick={() => navigate(link.path)}
              className="h-auto w-full justify-between rounded-none border-b border-border px-4 py-4 last:border-b-0"
            >
              <span className="font-medium text-foreground">{link.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Button>
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
            Swiss-made technology
          </p>
        </motion.div>
      </div>
    </AccountPageShell>
  );
};

export default Sobre;
