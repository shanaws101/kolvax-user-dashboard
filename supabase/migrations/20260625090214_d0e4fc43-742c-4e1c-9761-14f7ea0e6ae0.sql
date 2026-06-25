-- Restrict integrations.config column access. Authenticated members can read/write
-- only safe columns; only service_role (used by ops/admin server flows) can read or
-- modify the config blob that may contain credentials.

REVOKE SELECT, INSERT, UPDATE ON public.integrations FROM authenticated;

GRANT SELECT (id, business_id, kind, provider, status, connected_at, created_at, updated_at)
  ON public.integrations TO authenticated;

GRANT INSERT (id, business_id, kind, provider, status, connected_at)
  ON public.integrations TO authenticated;

GRANT UPDATE (status, connected_at, provider)
  ON public.integrations TO authenticated;

GRANT DELETE ON public.integrations TO authenticated;

-- service_role keeps full access for ops server functions
GRANT ALL ON public.integrations TO service_role;