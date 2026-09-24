import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Notice = { id: string; title: string; message: string };

export default function MandatorySecurityNotice() {
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("notifications").select("id,title,message,data").eq("user_id", user.id).eq("read", false).eq("category", "security").order("created_at", { ascending: true });
      const mandatory = data?.find((item) => Boolean((item.data as Record<string, unknown> | null)?.mandatory));
      if (active && mandatory) setNotice({ id: mandatory.id, title: mandatory.title, message: mandatory.message });
    };
    void load();
    const channel = supabase.channel(`mandatory-security-${crypto.randomUUID()}`).on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, []);

  const acknowledge = async () => {
    if (!notice) return;
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", notice.id);
    if (!error) setNotice(null);
  };

  return (
    <Dialog open={Boolean(notice)}>
      <DialogContent className="max-w-sm border-border bg-background [&>button]:hidden">
        <DialogHeader className="items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive"><ShieldAlert className="h-6 w-6" /></span>
          <DialogTitle>{notice?.title}</DialogTitle>
          <DialogDescription className="text-foreground/80">{notice?.message}</DialogDescription>
        </DialogHeader>
        <Button className="h-12 w-full" onClick={acknowledge}>Li e entendi</Button>
      </DialogContent>
    </Dialog>
  );
}