import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function RequireAuth() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setAuthenticated(Boolean(data.session));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAuthenticated(Boolean(session));
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" aria-label="Verificando acesso" />
      </div>
    );
  }

  if (!authenticated) return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}