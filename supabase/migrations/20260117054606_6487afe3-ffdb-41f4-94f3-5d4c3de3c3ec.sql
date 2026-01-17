-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  investor_profile TEXT DEFAULT 'moderado', -- conservador, moderado, arrojado
  monthly_income DECIMAL(15,2),
  investment_goal TEXT,
  risk_tolerance TEXT DEFAULT 'medio', -- baixo, medio, alto
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create portfolios table for user investments
CREATE TABLE public.portfolios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Minha Carteira',
  total_value DECIMAL(15,2) DEFAULT 0,
  total_gain DECIMAL(15,2) DEFAULT 0,
  cdi_percent DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create investments table for individual assets
CREATE TABLE public.investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL, -- acao, fii, renda_fixa, tesouro, cdb, lci, lca, crypto
  ticker TEXT,
  quantity DECIMAL(15,6) DEFAULT 0,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  current_price DECIMAL(15,2) DEFAULT 0,
  total_invested DECIMAL(15,2) DEFAULT 0,
  current_value DECIMAL(15,2) DEFAULT 0,
  gain_percent DECIMAL(10,4) DEFAULT 0,
  maturity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_conversations table for AI history
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT DEFAULT 'Nova conversa',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table for conversation history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for portfolios
CREATE POLICY "Users can view their own portfolios" ON public.portfolios FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own portfolios" ON public.portfolios FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolios" ON public.portfolios FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own portfolios" ON public.portfolios FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for investments
CREATE POLICY "Users can view their own investments" ON public.investments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own investments" ON public.investments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own investments" ON public.investments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own investments" ON public.investments FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their own conversations" ON public.chat_conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own conversations" ON public.chat_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversations" ON public.chat_conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own conversations" ON public.chat_conversations FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON public.investments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();