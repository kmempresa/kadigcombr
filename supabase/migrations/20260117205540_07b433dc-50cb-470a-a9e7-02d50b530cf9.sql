-- Create table for portfolio history snapshots
CREATE TABLE public.portfolio_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_value NUMERIC NOT NULL DEFAULT 0,
  total_invested NUMERIC NOT NULL DEFAULT 0,
  total_gain NUMERIC NOT NULL DEFAULT 0,
  gain_percent NUMERIC NOT NULL DEFAULT 0,
  cdi_accumulated NUMERIC DEFAULT 0,
  ipca_accumulated NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure only one snapshot per portfolio per day
  CONSTRAINT unique_portfolio_daily_snapshot UNIQUE (portfolio_id, snapshot_date)
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own portfolio history"
  ON public.portfolio_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolio history"
  ON public.portfolio_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio history"
  ON public.portfolio_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolio history"
  ON public.portfolio_history FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for fast queries by user and date range
CREATE INDEX idx_portfolio_history_user_date ON public.portfolio_history(user_id, snapshot_date DESC);
CREATE INDEX idx_portfolio_history_portfolio_date ON public.portfolio_history(portfolio_id, snapshot_date DESC);

-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;