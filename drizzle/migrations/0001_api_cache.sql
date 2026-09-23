CREATE TABLE public.api_cache (
  key text PRIMARY KEY,
  body text NOT NULL,
  status integer NOT NULL DEFAULT 200,
  fetched_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.api_cache TO service_role;
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;