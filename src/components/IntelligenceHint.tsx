import { ChevronRight } from "lucide-react";

interface Props {
  title?: string;
  message: string;
  cta?: string;
  onClick?: () => void;
  tone?: "default" | "risk";
}

/** Contextual Kadig Intelligence insight shown across the app. */
export default function IntelligenceHint({ title, message, cta, onClick, tone = "default" }: Props) {
  const border = tone === "risk" ? "border-destructive/30 bg-destructive/5" : "border-border bg-card";
  return (
    <button type="button" onClick={onClick} disabled={!onClick}
      className={`w-full text-left rounded-2xl border ${border} p-3.5 flex items-start gap-3`}>
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${tone === "risk" ? "bg-destructive" : "bg-primary"}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="text-xs font-medium text-muted-foreground">{title}</p>}
        <p className="text-sm text-foreground leading-snug">{message}</p>
        {cta && <p className="text-xs font-medium text-primary mt-1 flex items-center gap-0.5">{cta} <ChevronRight className="w-3 h-3" /></p>}
      </div>
    </button>
  );
}
