CREATE TABLE public.account_security_controls (
  user_id uuid PRIMARY KEY,
  status text NOT NULL DEFAULT 'active',
  public_reason text,
  internal_reason text,
  actioned_by text,
  actioned_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_security_controls_status CHECK (status IN ('active', 'suspended', 'banned'))
);
GRANT SELECT ON public.account_security_controls TO authenticated;
GRANT ALL ON public.account_security_controls TO service_role;
ALTER TABLE public.account_security_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own security status" ON public.account_security_controls
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL DEFAULT 'open',
  title text NOT NULL,
  summary text NOT NULL,
  source text NOT NULL DEFAULT 'app',
  fingerprint text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurrence_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_events_severity CHECK (severity IN ('info', 'attention', 'high', 'critical')),
  CONSTRAINT security_events_status CHECK (status IN ('open', 'reviewing', 'resolved', 'dismissed'))
);
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX security_events_recent_idx ON public.security_events (created_at DESC);
CREATE INDEX security_events_user_idx ON public.security_events (user_id, created_at DESC);
CREATE UNIQUE INDEX security_events_open_fingerprint_idx ON public.security_events (fingerprint) WHERE fingerprint IS NOT NULL AND status IN ('open', 'reviewing');

CREATE TABLE public.security_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  reason text,
  public_message text,
  mandatory_notice boolean NOT NULL DEFAULT false,
  actor text NOT NULL,
  security_event_id uuid REFERENCES public.security_events(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT security_admin_actions_action CHECK (action IN ('notice', 'suspend', 'ban', 'release', 'mark_reviewing', 'resolve', 'dismiss'))
);
GRANT ALL ON public.security_admin_actions TO service_role;
ALTER TABLE public.security_admin_actions ENABLE ROW LEVEL SECURITY;
CREATE INDEX security_admin_actions_user_idx ON public.security_admin_actions (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_account_security_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT status = 'active' FROM public.account_security_controls WHERE user_id = _user_id), true)
$$;
REVOKE ALL ON FUNCTION public.is_account_security_active(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_account_security_active(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.capture_sensitive_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_event_type text;
  v_title text;
  v_count integer;
  v_fingerprint text;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);
  v_event_type := lower(TG_TABLE_NAME || '_' || TG_OP);
  v_title := CASE TG_OP WHEN 'DELETE' THEN 'Exclusão financeira registrada' ELSE 'Alteração financeira registrada' END;

  SELECT count(*) INTO v_count
  FROM public.security_events
  WHERE user_id = v_user_id
    AND source = 'database'
    AND event_type LIKE lower(TG_TABLE_NAME) || '_%'
    AND created_at > now() - interval '10 minutes';

  IF TG_OP = 'DELETE' OR v_count >= 9 THEN
    v_fingerprint := v_user_id::text || ':' || lower(TG_TABLE_NAME) || ':volume:' || to_char(now(), 'YYYYMMDDHH24MI');
    INSERT INTO public.security_events (user_id, event_type, severity, title, summary, source, fingerprint, metadata)
    VALUES (
      v_user_id,
      v_event_type,
      CASE WHEN v_count >= 19 THEN 'high' ELSE 'attention' END,
      v_title,
      CASE WHEN v_count >= 9 THEN 'Volume incomum de alterações em um curto período.' ELSE 'Uma exclusão de dado financeiro foi realizada.' END,
      'database',
      v_fingerprint,
      jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)
    )
    ON CONFLICT (fingerprint) WHERE fingerprint IS NOT NULL AND status IN ('open', 'reviewing')
    DO UPDATE SET occurrence_count = public.security_events.occurrence_count + 1, last_seen_at = now();
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER capture_investment_security_event AFTER INSERT OR UPDATE OR DELETE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.capture_sensitive_change();
CREATE TRIGGER capture_movement_security_event AFTER INSERT OR UPDATE OR DELETE ON public.movements FOR EACH ROW EXECUTE FUNCTION public.capture_sensitive_change();
CREATE TRIGGER capture_global_asset_security_event AFTER INSERT OR UPDATE OR DELETE ON public.global_assets FOR EACH ROW EXECUTE FUNCTION public.capture_sensitive_change();
CREATE TRIGGER capture_connection_security_event AFTER INSERT OR UPDATE OR DELETE ON public.pluggy_connections FOR EACH ROW EXECUTE FUNCTION public.capture_sensitive_change();

CREATE POLICY "Security status restricts investments" ON public.investments AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));
CREATE POLICY "Security status restricts movements" ON public.movements AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));
CREATE POLICY "Security status restricts global assets" ON public.global_assets AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));
CREATE POLICY "Security status restricts portfolios" ON public.portfolios AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));
CREATE POLICY "Security status restricts connections" ON public.pluggy_connections AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));
CREATE POLICY "Security status restricts goals" ON public.goals AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));
CREATE POLICY "Security status restricts chats" ON public.chat_conversations AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));
CREATE POLICY "Security status restricts messages" ON public.chat_messages AS RESTRICTIVE FOR ALL TO authenticated
  USING (public.is_account_security_active(auth.uid())) WITH CHECK (public.is_account_security_active(auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.account_security_controls;