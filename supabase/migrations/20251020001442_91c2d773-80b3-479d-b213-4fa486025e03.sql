-- ============================================
-- 1. MARQUER LE SETUP COMME COMPLÉTÉ
-- ============================================
UPDATE setup_config SET first_setup_completed = true WHERE first_setup_completed = false;

-- ============================================
-- 2. TABLES POUR GESTION CLASSES & SALLES
-- ============================================

-- Table: Classes
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  level TEXT,
  capacity INTEGER,
  academic_year TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, code, academic_year)
);

-- Table: Salles (Rooms)
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  room_type TEXT,
  capacity INTEGER,
  floor TEXT,
  building TEXT,
  equipment TEXT[],
  is_available BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, code)
);

-- ============================================
-- 3. INDICES POUR PERFORMANCES
-- ============================================
CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_classes_academic_year ON public.classes(academic_year);
CREATE INDEX idx_rooms_school_id ON public.rooms(school_id);
CREATE INDEX idx_rooms_available ON public.rooms(is_available) WHERE is_available = true;

-- ============================================
-- 4. TRIGGERS POUR UPDATED_AT
-- ============================================
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. RLS - ACTIVER LA SÉCURITÉ
-- ============================================
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. RLS POLICIES - CLASSES
-- ============================================

-- Super Admin: accès total
CREATE POLICY "Super admins can view all classes"
  ON public.classes FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert classes"
  ON public.classes FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update classes"
  ON public.classes FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete classes"
  ON public.classes FOR DELETE
  USING (is_super_admin(auth.uid()));

-- School Admin: accès à son établissement
CREATE POLICY "School admins can view their school classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = classes.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can insert their school classes"
  ON public.classes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = classes.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can update their school classes"
  ON public.classes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = classes.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can delete their school classes"
  ON public.classes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = classes.school_id
        AND role = 'school_admin'
    )
  );

-- Teachers: lecture seule sur leur établissement
CREATE POLICY "Teachers can view their school classes"
  ON public.classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = classes.school_id
    )
  );

-- ============================================
-- 7. RLS POLICIES - ROOMS
-- ============================================

-- Super Admin: accès total
CREATE POLICY "Super admins can view all rooms"
  ON public.rooms FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update rooms"
  ON public.rooms FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete rooms"
  ON public.rooms FOR DELETE
  USING (is_super_admin(auth.uid()));

-- School Admin: accès à son établissement
CREATE POLICY "School admins can view their school rooms"
  ON public.rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = rooms.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can insert their school rooms"
  ON public.rooms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = rooms.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can update their school rooms"
  ON public.rooms FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = rooms.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can delete their school rooms"
  ON public.rooms FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = rooms.school_id
        AND role = 'school_admin'
    )
  );

-- Teachers: lecture seule sur leur établissement
CREATE POLICY "Teachers can view their school rooms"
  ON public.rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = rooms.school_id
    )
  );