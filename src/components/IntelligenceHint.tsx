import { Sparkles, ChevronRight } from "lucide-react";

interface Props {
  title?: string;
  message: string;
  cta?: string;
  onClick?: () => void;
  tone?: "default" | "risk";
}

/** Contextual Kadig Intelligence insight shown across the app. */
export default function IntelligenceHint({ title, message, cta, onClick, tone = "default" }: Props) {
  const border = tone === "risk" ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5";
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={`w-full text-left rounded-2xl border ${border} p-3.5 flex items-start gap-3`}>
      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        {title && <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">{title}</p>}
        <p className="text-sm text-foreground leading-snug">{message}</p>
        {cta && <p className="text-xs font-medium text-primary mt-1 flex items-center gap-0.5">{cta} <ChevronRight className="w-3 h-3" /></p>}
      </div>
    </button>
  );
}
