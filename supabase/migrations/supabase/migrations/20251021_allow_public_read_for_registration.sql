-- supabase/migrations/20251021_allow_public_read_for_registration.sql

-- ⚠️ Hypothèse: RLS déjà activé sur schools (sinon active-le avant ces policies)
-- Permettre à TOUT LE MONDE (anon) de lire les écoles actives
DROP POLICY IF EXISTS "Public can view active schools" ON public.schools;
CREATE POLICY "Public can view active schools"
  ON public.schools
  FOR SELECT
  USING (is_active = true);

-- Permettre à TOUT LE MONDE (anon) de lire les matières des écoles actives
DROP POLICY IF EXISTS "Public can view subjects of active schools" ON public.subjects;
CREATE POLICY "Public can view subjects of active schools"
  ON public.subjects
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.schools s
      WHERE s.id = subjects.school_id
        AND s.is_active = true
    )
  );

-- Optionnel: BORNER les colonnes si besoin (exclure description longue) via une VIEW plus tard

