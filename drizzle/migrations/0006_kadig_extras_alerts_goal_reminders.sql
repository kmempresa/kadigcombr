CREATE TABLE public.price_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset_kind text NOT NULL DEFAULT 'stock' CHECK (asset_kind IN ('stock','crypto')),
  symbol text NOT NULL,
  label text NOT NULL,
  direction text NOT NULL CHECK (direction IN ('above','below')),
  target_price numeric NOT NULL CHECK (target_price > 0),
  active boolean NOT NULL DEFAULT true,
  last_price numeric,
  triggered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.price_alerts TO authenticated;
GRANT ALL ON public.price_alerts TO service_role;
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own alerts select" ON public.price_alerts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own alerts insert" ON public.price_alerts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_account_security_active(auth.uid()));
CREATE POLICY "own alerts update" ON public.price_alerts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own alerts delete" ON public.price_alerts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX price_alerts_user_idx ON public.price_alerts(user_id) WHERE active;

ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS monthly_contribution numeric;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS contribution_day integer CHECK (contribution_day BETWEEN 1 AND 28);
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS last_reminder_month text;