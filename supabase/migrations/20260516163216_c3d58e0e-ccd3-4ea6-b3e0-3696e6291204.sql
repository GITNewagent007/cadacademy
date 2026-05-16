-- Revoke has_role execute from anon (least privilege)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- Drop broad SELECT policies that allow listing public buckets.
-- Public file URLs continue to work via the storage public endpoint.
DROP POLICY IF EXISTS "anyone reads article-assets" ON storage.objects;
DROP POLICY IF EXISTS "public read icon files" ON storage.objects;