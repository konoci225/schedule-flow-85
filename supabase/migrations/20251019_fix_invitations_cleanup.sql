-- Migration pour nettoyer et gérer les invitations acceptées

-- 1. Marquer comme acceptées toutes les invitations dont l'email existe déjà dans user_roles
UPDATE invitations i
SET accepted = true
WHERE i.role = 'school_admin' 
AND i.accepted = false
AND EXISTS (
  SELECT 1 
  FROM auth.users u
  JOIN user_roles ur ON u.id = ur.user_id
  WHERE LOWER(u.email) = LOWER(i.email)
  AND ur.role = 'school_admin'
);

-- 2. Créer un trigger pour marquer automatiquement les invitations comme acceptées
-- quand un utilisateur s'inscrit avec le même email
CREATE OR REPLACE FUNCTION mark_invitation_as_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Marquer l'invitation comme acceptée si elle existe
  UPDATE invitations
  SET accepted = true,
      accepted_at = NOW()
  WHERE LOWER(email) = LOWER(NEW.email)
  AND role = 'school_admin'
  AND accepted = false;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur auth.users
CREATE TRIGGER on_user_signup_mark_invitation
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION mark_invitation_as_accepted();

-- 3. Ajouter une colonne accepted_at pour tracer quand l'invitation a été acceptée
ALTER TABLE invitations 
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;

-- 4. Créer une policy pour permettre au système de mettre à jour les invitations
CREATE POLICY "System can update invitations"
ON invitations
FOR UPDATE
USING (true)
WITH CHECK (true);
