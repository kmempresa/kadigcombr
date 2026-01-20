-- Add pluggy_item_id to investments to track which investments came from Pluggy
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS pluggy_investment_id text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_investments_pluggy_investment_id ON public.investments(pluggy_investment_id);

-- Add column to track the source of investment (manual or pluggy)
ALTER TABLE public.investments 
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';

-- Enable realtime for investments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;

-- Enable realtime for portfolios table
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolios;