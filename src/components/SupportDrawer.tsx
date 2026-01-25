import { useState, useRef, useEffect } from "react";
import { X, Upload, FileText, Trash2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

interface SupportDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

const supportCategories = [
  { value: "carteira", label: "Minha Carteira" },
  { value: "investimentos", label: "Investimentos" },
  { value: "bianca", label: "Bianca (IA)" },
  { value: "conta", label: "Minha Conta" },
  { value: "pagamentos", label: "Pagamentos e Assinatura" },
  { value: "bug", label: "Reportar um Bug" },
  { value: "sugestao", label: "Sugestão de Melhoria" },
  { value: "outro", label: "Outro" },
];

const SupportDrawerComponent = ({ open, onOpenChange, userEmail = "" }: SupportDrawerProps) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState(userEmail);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update email when userEmail prop changes
  useEffect(() => {
    if (userEmail) setEmail(userEmail);
  }, [userEmail]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => {
      const isValidType = ["image/jpeg", "image/png", "application/pdf"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      if (!isValidType) toast.error(`${file.name}: Formato não aceito`);
      if (!isValidSize) toast.error(`${file.name}: Arquivo muito grande (máx 5MB)`);
      return isValidType && isValidSize;
    });
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => {
      const isValidType = ["image/jpeg", "image/png", "application/pdf"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });
    setFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!email || !category || !description) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    
    // Simulate sending - in production, this would call an edge function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success("Chamado enviado com sucesso! Entraremos em contato em breve.");
    setCategory("");
    setDescription("");
    setFiles([]);
    onOpenChange(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={`h-[95vh] ${theme === "light" ? "light-theme" : ""} bg-background`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
          <span className="text-lg font-semibold text-foreground">Abrir chamado</span>
          <button onClick={handleClose} className="p-2" type="button">
            <X className="w-6 h-6 text-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-background">
          <div className="bg-card rounded-2xl p-6 shadow-sm border border-border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Fale Conosco</h2>
              <button 
                onClick={handleClose}
                type="button"
                className="text-primary font-medium hover:underline"
              >
                Voltar
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  E-mail * <span className="text-muted-foreground font-normal">(Utilize de preferência o e-mail cadastrado na plataforma)</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-background border-input rounded-xl h-12 text-foreground"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Para onde precisa de ajuda?*
                </label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background border-input rounded-xl h-12 text-foreground">
                    <SelectValue placeholder="Busque ou selecione uma das opções" />
                  </SelectTrigger>
                  <SelectContent className={theme === "light" ? "light-theme" : ""}>
                    {supportCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="support-description" className="block text-sm font-medium text-foreground mb-2">
                  Descreva o problema *
                </label>
                <textarea
                  id="support-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhadamente o problema ou dúvida..."
                  className="flex w-full rounded-xl border border-input bg-background px-3 py-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[120px] resize-none"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Anexo
                </label>
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">
                    Arraste para aqui seu(s) arquivo(s) ou clique para selecionar
                  </p>
                  <p className="text-muted-foreground text-xs mt-2">
                    Caso deseje anexar múltiplos arquivos, selecione ou arraste todos de uma vez
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Formatos aceitos: jpeg, png, pdf
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Tamanho máximo: 5mb
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(index)} className="p-1 hover:bg-destructive/10 rounded">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground">* Campo obrigatório</p>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !email || !category || !description}
                className="w-full h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg"
              >
                {isSubmitting ? "ENVIANDO..." : "ENVIAR"}
              </Button>
            </form>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export { SupportDrawerComponent as SupportDrawer };
