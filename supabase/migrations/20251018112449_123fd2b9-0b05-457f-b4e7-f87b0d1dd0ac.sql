-- Insérer l'enregistrement initial dans setup_config si la table est vide
INSERT INTO public.setup_config (first_setup_completed, primary_super_admin_id)
SELECT false, NULL
WHERE NOT EXISTS (SELECT 1 FROM public.setup_config);