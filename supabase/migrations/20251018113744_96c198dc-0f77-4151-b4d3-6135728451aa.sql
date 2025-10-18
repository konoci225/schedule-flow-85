-- Politique temporaire pour permettre l'insertion du premier super admin
-- Cette politique permet l'insertion uniquement si c'est le premier utilisateur et que le setup n'est pas complété
CREATE POLICY "Allow first super admin creation during setup"
ON public.user_roles
FOR INSERT
WITH CHECK (
  -- Vérifier que le setup n'est pas complété
  EXISTS (
    SELECT 1 FROM public.setup_config 
    WHERE first_setup_completed = false
  )
  AND
  -- Vérifier qu'il n'y a pas encore de super_admin
  NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE role = 'super_admin'
  )
  AND
  -- Vérifier que c'est bien pour l'utilisateur courant
  auth.uid() = user_id
  AND
  -- Vérifier que le rôle est super_admin
  role = 'super_admin'
);