CREATE OR REPLACE FUNCTION public.create_welcome_notification()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, category)
  VALUES (NEW.user_id, 'Bem-vindo à Kadig', 'Comece adicionando seu patrimônio e acompanhe tudo em tempo real.', 'success', 'system');
  RETURN NEW;
END;
$function$;