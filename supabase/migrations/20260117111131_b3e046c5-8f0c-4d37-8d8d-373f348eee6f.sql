-- Create a table for all financial movements/transactions
CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE,
  investment_id UUID REFERENCES public.investments(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('aplicacao', 'resgate', 'transferencia_entrada', 'transferencia_saida', 'dividendo', 'bonificacao')),
  asset_name TEXT NOT NULL,
  ticker TEXT,
  asset_type TEXT,
  quantity NUMERIC DEFAULT 0,
  unit_price NUMERIC DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  portfolio_name TEXT,
  target_portfolio_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  movement_date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- Enable Row Level Security
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own movements" 
ON public.movements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own movements" 
ON public.movements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movements" 
ON public.movements 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movements" 
ON public.movements 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_movements_user_id ON public.movements(user_id);
CREATE INDEX idx_movements_movement_date ON public.movements(movement_date DESC);
CREATE INDEX idx_movements_type ON public.movements(type);