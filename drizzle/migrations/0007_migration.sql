DROP POLICY IF EXISTS "Ofertas são públicas para leitura" ON public.bank_offers;
REVOKE SELECT ON public.bank_offers FROM anon;
GRANT SELECT ON public.bank_offers TO authenticated;
GRANT ALL ON public.bank_offers TO service_role;
CREATE POLICY "Clientes logados leem ofertas" ON public.bank_offers FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);