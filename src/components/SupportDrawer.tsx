import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";

interface Props { open: boolean; onOpenChange: (open: boolean) => void; userEmail?: string }
const categories = [
  ["carteira", "Minha Carteira"], ["investimentos", "Investimentos"], ["intelligence", "Intelligence"], ["conta", "Minha Conta"],
  ["pagamentos", "Pagamentos e assinatura"], ["bug", "Reportar um problema"], ["sugestao", "Sugestão"], ["outro", "Outro"],
];

const SupportDrawerComponent = ({ open, onOpenChange, userEmail = "" }: Props) => {
  const { theme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState(userEmail);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (userEmail) setEmail(userEmail); }, [userEmail]);

  const addFiles = (list: FileList | null) => {
    const next = Array.from(list ?? []);
    for (const file of next) {
      if (!["image/jpeg", "image/png", "application/pdf"].includes(file.type)) return toast.error("Use imagens JPG, PNG ou arquivos PDF.");
      if (file.size > 5 * 1024 * 1024) return toast.error("Cada anexo pode ter até 5 MB.");
    }
    if (files.length + next.length > 3) return toast.error("Envie no máximo 3 anexos.");
    setFiles((current) => [...current, ...next]);
  };

  const submit = async () => {
    if (!email || !category || description.trim().length < 10) return toast.error("Preencha os campos e descreva o pedido com pelo menos 10 caracteres.");
    setBusy(true);
    const body = new FormData(); body.append("email", email); body.append("category", category); body.append("description", description.trim()); files.forEach((file) => body.append("attachments", file));
    const { error } = await supabase.functions.invoke("create-support-ticket", { body });
    setBusy(false);
    if (error) return toast.error("Não foi possível enviar o chamado. Tente novamente.");
    setCategory(""); setDescription(""); setFiles([]); onOpenChange(false); toast.success("Chamado enviado. A equipe Kadig responderá por e-mail.");
  };

  return <Drawer open={open} onOpenChange={onOpenChange}>
    <DrawerContent className={`${theme === "light" ? "light-theme" : ""} h-[96dvh] overflow-hidden bg-background`}>
      <header className="shrink-0 border-b border-border px-4 pb-4 safe-area-inset-top"><div className="flex items-center gap-3 pt-2"><Button variant="ghost" size="icon" className="rounded-full" onClick={() => onOpenChange(false)} aria-label="Voltar"><ArrowLeft /></Button><div><h1 className="text-xl font-semibold">Suporte</h1><p className="text-xs text-muted-foreground">Fale diretamente com a equipe Kadig</p></div></div></header>
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 pb-8 safe-area-inset-bottom">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <label className="block text-sm font-medium">E-mail<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-12 bg-background" /></label>
          <label className="block text-sm font-medium">Assunto<Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-2 h-12 bg-background"><SelectValue placeholder="Selecione uma opção" /></SelectTrigger><SelectContent className={theme === "light" ? "light-theme" : ""}>{categories.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></label>
          <label className="block text-sm font-medium">Como podemos ajudar?<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={5000} placeholder="Conte o que aconteceu..." className="mt-2 min-h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-3 text-base outline-none focus:ring-2 focus:ring-ring" /></label>
          <div><input ref={inputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={(e) => addFiles(e.target.files)} /><Button type="button" variant="outline" className="h-12 w-full rounded-xl" onClick={() => inputRef.current?.click()}><Paperclip />Adicionar anexo</Button><p className="mt-2 text-xs text-muted-foreground">Até 3 arquivos JPG, PNG ou PDF de 5 MB cada.</p></div>
          {files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"><FileText className="text-primary" /><span className="min-w-0 flex-1 truncate text-sm">{file.name}</span><Button type="button" variant="ghost" size="icon" onClick={() => setFiles((all) => all.filter((_, i) => i !== index))} aria-label={`Remover ${file.name}`}><Trash2 /></Button></div>)}
        </div>
        <Button type="submit" className="mt-4 h-12 w-full rounded-xl" disabled={busy || !email || !category || description.trim().length < 10}>{busy ? <><Loader2 className="animate-spin" />Enviando</> : "Enviar chamado"}</Button>
      </form>
    </DrawerContent>
  </Drawer>;
};
export { SupportDrawerComponent as SupportDrawer };
