-- JLC module: follow-up hardening from Supabase's security advisor.
--
-- Trigger functions are only ever invoked by their triggers (EXECUTE is not re-checked when a
-- trigger fires), so nobody needs EXECUTE on them through the REST API. Also pin search_path on
-- the three functions that didn't set one.

alter function public.jlc_actor_label() set search_path = public;
alter function public.jlc_limit_attachments() set search_path = public;
alter function public.jlc_guard_report_update() set search_path = public;

revoke all on function public.jlc_audit_report() from public, anon, authenticated;
revoke all on function public.jlc_audit_attachment() from public, anon, authenticated;
revoke all on function public.jlc_audit_facility() from public, anon, authenticated;
revoke all on function public.jlc_limit_attachments() from public, anon, authenticated;
revoke all on function public.jlc_guard_report_update() from public, anon, authenticated;
revoke all on function public.jlc_actor_label() from public, anon;
grant execute on function public.jlc_actor_label() to authenticated, service_role;
