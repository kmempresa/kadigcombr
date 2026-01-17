import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  PlusSquare, 
  MessageSquarePlus, 
  FileInput, 
  Upload, 
  ArrowRightLeft, 
  Trash2 
} from "lucide-react";

interface AdicionarDrawerProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
}

const menuItems = [
  {
    id: "novo-ativo",
    title: "Adicionar novo ativo",
    description: "Adicione qualquer tipo de ativo do seu banco, corretora financeira ou coorporativa.",
    icon: PlusSquare,
    color: "bg-primary",
    path: "/adicionar-investimento"
  },
  {
    id: "novo-evento",
    title: "Adicionar novo evento",
    description: "Adicione proventos, bonificações, conversão de ativo e outros.",
    icon: MessageSquarePlus,
    color: "bg-emerald-500",
    path: "/adicionar-evento"
  },
  {
    id: "nova-aplicacao",
    title: "Adicionar nova aplicação",
    description: "Você pode adicionar uma aplicação em um ativo já cadastrado.",
    icon: FileInput,
    color: "bg-lime-500",
    path: "/adicionar-aplicacao"
  },
  {
    id: "novo-resgate",
    title: "Adicionar novo resgate",
    description: "Você pode adicionar um resgate em um ativo já cadastrado.",
    icon: Upload,
    color: "bg-orange-500",
    path: "/adicionar-resgate"
  },
  {
    id: "transferir",
    title: "Transferir para outra carteira",
    description: "Mova ou copie um dos seus ativos entre as suas carteiras de forma simples.",
    icon: ArrowRightLeft,
    color: "bg-cyan-500",
    path: "/transferir-ativo"
  },
  {
    id: "excluir",
    title: "Excluir múltiplos ativos",
    description: "Exclua seus ativos de forma simples.",
    icon: Trash2,
    color: "bg-red-500",
    path: "/excluir-ativos"
  }
];

const AdicionarDrawer = ({ open, onClose, onNavigate }: AdicionarDrawerProps) => {
  const handleItemClick = (path: string) => {
    onClose();
    onNavigate(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground text-center">Adicionar</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleItemClick(item.path)}
                    className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:bg-muted/50 active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-foreground flex-1">{item.title}</h3>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="border-t border-border pt-2 mt-2">
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Close Button */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shadow-lg"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AdicionarDrawer;
