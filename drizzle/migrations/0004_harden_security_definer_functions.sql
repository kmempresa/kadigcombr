REVOKE EXECUTE ON FUNCTION public.create_welcome_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.capture_sensitive_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_account_security_active(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_active_subscription(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_account_security_active(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid) TO authenticated, service_role;