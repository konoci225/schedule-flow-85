-- ============================================
-- TABLE POUR GESTION EMPLOIS DU TEMPS
-- ============================================

CREATE TABLE public.timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  academic_year TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Index pour performances
CREATE INDEX idx_timetables_school_id ON public.timetables(school_id);
CREATE INDEX idx_timetables_class_id ON public.timetables(class_id);
CREATE INDEX idx_timetables_teacher_id ON public.timetables(teacher_id);
CREATE INDEX idx_timetables_day ON public.timetables(day_of_week);

-- Trigger pour updated_at
CREATE TRIGGER update_timetables_updated_at
  BEFORE UPDATE ON public.timetables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS
ALTER TABLE public.timetables ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - TIMETABLES
-- ============================================

-- Super Admin: accès total
CREATE POLICY "Super admins can view all timetables"
  ON public.timetables FOR SELECT
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert timetables"
  ON public.timetables FOR INSERT
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update timetables"
  ON public.timetables FOR UPDATE
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete timetables"
  ON public.timetables FOR DELETE
  USING (is_super_admin(auth.uid()));

-- School Admin: accès à son établissement
CREATE POLICY "School admins can view their school timetables"
  ON public.timetables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = timetables.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can insert their school timetables"
  ON public.timetables FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = timetables.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can update their school timetables"
  ON public.timetables FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = timetables.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can delete their school timetables"
  ON public.timetables FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = timetables.school_id
        AND role = 'school_admin'
    )
  );

-- Teachers: lecture seule sur leur établissement
CREATE POLICY "Teachers can view their school timetables"
  ON public.timetables FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = timetables.school_id
    )
  );