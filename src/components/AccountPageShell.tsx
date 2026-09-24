import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

type Props = { title: string; subtitle?: string; children: ReactNode };

export default function AccountPageShell({ title, subtitle, children }: Props) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  return (
    <main className={`${theme === "light" ? "light-theme" : ""} h-[100dvh] overflow-hidden bg-background text-foreground`}>
      <div className="mx-auto flex h-full w-full max-w-lg flex-col">
        <header className="safe-area-inset-top shrink-0 border-b border-border bg-background/95 px-4 pb-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 pt-3">
            <Button variant="ghost" size="icon" aria-label="Voltar para Conta" onClick={() => navigate("/app", { state: { returnToTab: "conta" } })} className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold">{title}</h1>
              {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 safe-area-inset-bottom">
          {children}
        </div>
      </div>
    </main>
  );
}
