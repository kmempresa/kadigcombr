-- Create global_assets table for storing global patrimony items
CREATE TABLE public.global_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'outros',
  currency TEXT NOT NULL DEFAULT 'BRL',
  original_value NUMERIC NOT NULL DEFAULT 0,
  value_brl NUMERIC NOT NULL DEFAULT 0,
  exchange_rate NUMERIC DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_assets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own global assets"
ON public.global_assets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own global assets"
ON public.global_assets
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own global assets"
ON public.global_assets
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own global assets"
ON public.global_assets
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_global_assets_updated_at
BEFORE UPDATE ON public.global_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();