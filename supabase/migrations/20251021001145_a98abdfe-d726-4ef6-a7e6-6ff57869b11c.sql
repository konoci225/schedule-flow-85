-- ============================================
-- TABLES COMPLEMENTAIRES POUR GESTION SCOLAIRE
-- ============================================

-- 1. SCHOOL SETTINGS (Paramètres d'établissement)
CREATE TABLE public.school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  week_start INTEGER DEFAULT 1 CHECK (week_start BETWEEN 1 AND 7),
  geofence_enabled BOOLEAN DEFAULT false,
  geofence_latitude DECIMAL(10, 8),
  geofence_longitude DECIMAL(11, 8),
  geofence_radius_m INTEGER DEFAULT 100,
  attendance_window_before_min INTEGER DEFAULT 15,
  attendance_window_after_min INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_school_settings_school_id ON public.school_settings(school_id);

-- 2. ACADEMIC YEARS (Années scolaires)
CREATE TABLE public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, code)
);

CREATE INDEX idx_academic_years_school_id ON public.academic_years(school_id);
CREATE INDEX idx_academic_years_active ON public.academic_years(school_id, is_active);

-- 3. TERMS (Trimestres/Semestres)
CREATE TABLE public.terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_terms_school_id ON public.terms(school_id);
CREATE INDEX idx_terms_academic_year ON public.terms(academic_year_id);

-- 4. TIME SLOTS (Créneaux horaires)
CREATE TABLE public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  label TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_slot_time CHECK (end_time > start_time)
);

CREATE INDEX idx_time_slots_school_id ON public.time_slots(school_id);
CREATE INDEX idx_time_slots_day ON public.time_slots(school_id, day_of_week, is_active);

-- 5. CALENDAR EXCEPTIONS (Jours fériés/fermetures)
CREATE TYPE public.calendar_availability AS ENUM ('open', 'closed', 'half_day');

CREATE TABLE public.calendar_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  availability calendar_availability DEFAULT 'closed',
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(school_id, date)
);

CREATE INDEX idx_calendar_exceptions_school_id ON public.calendar_exceptions(school_id);
CREATE INDEX idx_calendar_exceptions_date ON public.calendar_exceptions(school_id, date);

-- 6. TEACHER AVAILABILITIES (Disponibilités récurrentes)
CREATE TYPE public.availability_preference AS ENUM ('preferred', 'available', 'if_needed', 'unavailable');

CREATE TABLE public.teacher_availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  preference availability_preference DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_availability_time CHECK (end_time > start_time)
);

CREATE INDEX idx_teacher_availabilities_teacher ON public.teacher_availabilities(teacher_id);
CREATE INDEX idx_teacher_availabilities_day ON public.teacher_availabilities(teacher_id, day_of_week);

-- 7. TEACHER UNAVAILABILITIES (Indisponibilités ponctuelles)
CREATE TABLE public.teacher_unavailabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_unavailability_time CHECK (end_at > start_at)
);

CREATE INDEX idx_teacher_unavailabilities_teacher ON public.teacher_unavailabilities(teacher_id);
CREATE INDEX idx_teacher_unavailabilities_dates ON public.teacher_unavailabilities(teacher_id, start_at, end_at);

-- 8. ATTENDANCES (Pointages)
CREATE TYPE public.attendance_method AS ENUM ('geofence', 'qr', 'nfc', 'manual');
CREATE TYPE public.attendance_status AS ENUM ('present', 'late', 'absent', 'excused');

CREATE TABLE public.attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  timetable_id UUID REFERENCES public.timetables(id) ON DELETE SET NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  accuracy_m DECIMAL(10, 2),
  method attendance_method DEFAULT 'manual',
  status attendance_status DEFAULT 'present',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attendances_teacher ON public.attendances(teacher_id);
CREATE INDEX idx_attendances_timetable ON public.attendances(timetable_id);
CREATE INDEX idx_attendances_date ON public.attendances(occurred_at);

-- 9. ATTENDANCE JUSTIFICATIONS
CREATE TYPE public.justification_decision AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.attendance_justifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID NOT NULL REFERENCES public.attendances(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  file_url TEXT,
  decision justification_decision DEFAULT 'pending',
  decided_by UUID REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_justifications_attendance ON public.attendance_justifications(attendance_id);
CREATE INDEX idx_justifications_decision ON public.attendance_justifications(decision);

-- 10. ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT DEFAULT 'all',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_announcements_school ON public.announcements(school_id);
CREATE INDEX idx_announcements_published ON public.announcements(school_id, published_at);

-- 11. NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read_at);
CREATE INDEX idx_notifications_created ON public.notifications(user_id, created_at);

-- 12. GENERATION JOBS
CREATE TYPE public.job_status AS ENUM ('queued', 'running', 'succeeded', 'failed', 'cancelled');

CREATE TABLE public.generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status job_status DEFAULT 'queued',
  params JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_generation_jobs_school ON public.generation_jobs(school_id);
CREATE INDEX idx_generation_jobs_status ON public.generation_jobs(status);

-- 13. TIMETABLE VERSIONS
CREATE TABLE public.timetable_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_timetable_versions_school ON public.timetable_versions(school_id);
CREATE INDEX idx_timetable_versions_created ON public.timetable_versions(school_id, created_at);

-- ============================================
-- TRIGGERS pour updated_at
-- ============================================

CREATE TRIGGER update_school_settings_updated_at
  BEFORE UPDATE ON public.school_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_terms_updated_at
  BEFORE UPDATE ON public.terms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at
  BEFORE UPDATE ON public.time_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_exceptions_updated_at
  BEFORE UPDATE ON public.calendar_exceptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_availabilities_updated_at
  BEFORE UPDATE ON public.teacher_availabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teacher_unavailabilities_updated_at
  BEFORE UPDATE ON public.teacher_unavailabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendances_updated_at
  BEFORE UPDATE ON public.attendances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_justifications_updated_at
  BEFORE UPDATE ON public.attendance_justifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at
  BEFORE UPDATE ON public.generation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- SCHOOL SETTINGS
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all school settings"
  ON public.school_settings FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can view their school settings"
  ON public.school_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = school_settings.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can update their school settings"
  ON public.school_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = school_settings.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "School admins can insert their school settings"
  ON public.school_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = school_settings.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school settings"
  ON public.school_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = school_settings.school_id
    )
  );

-- ACADEMIC YEARS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all academic years"
  ON public.academic_years FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their academic years"
  ON public.academic_years FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = academic_years.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school academic years"
  ON public.academic_years FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = academic_years.school_id
    )
  );

-- TERMS
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all terms"
  ON public.terms FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their terms"
  ON public.terms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = terms.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school terms"
  ON public.terms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = terms.school_id
    )
  );

-- TIME SLOTS
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all time slots"
  ON public.time_slots FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their time slots"
  ON public.time_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = time_slots.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school time slots"
  ON public.time_slots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = time_slots.school_id
    )
  );

-- CALENDAR EXCEPTIONS
ALTER TABLE public.calendar_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all calendar exceptions"
  ON public.calendar_exceptions FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their calendar exceptions"
  ON public.calendar_exceptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = calendar_exceptions.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school calendar exceptions"
  ON public.calendar_exceptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = calendar_exceptions.school_id
    )
  );

-- TEACHER AVAILABILITIES
ALTER TABLE public.teacher_availabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all availabilities"
  ON public.teacher_availabilities FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their teachers availabilities"
  ON public.teacher_availabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN user_roles ur ON ur.school_id = t.school_id
      WHERE t.id = teacher_availabilities.teacher_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can manage their own availabilities"
  ON public.teacher_availabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE id = teacher_availabilities.teacher_id
        AND user_id = auth.uid()
    )
  );

-- TEACHER UNAVAILABILITIES
ALTER TABLE public.teacher_unavailabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all unavailabilities"
  ON public.teacher_unavailabilities FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their teachers unavailabilities"
  ON public.teacher_unavailabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN user_roles ur ON ur.school_id = t.school_id
      WHERE t.id = teacher_unavailabilities.teacher_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can manage their own unavailabilities"
  ON public.teacher_unavailabilities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE id = teacher_unavailabilities.teacher_id
        AND user_id = auth.uid()
    )
  );

-- ATTENDANCES
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all attendances"
  ON public.attendances FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can view their school attendances"
  ON public.attendances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers t
      JOIN user_roles ur ON ur.school_id = t.school_id
      WHERE t.id = attendances.teacher_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can manage their own attendances"
  ON public.attendances FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE id = attendances.teacher_id
        AND user_id = auth.uid()
    )
  );

-- ATTENDANCE JUSTIFICATIONS
ALTER TABLE public.attendance_justifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all justifications"
  ON public.attendance_justifications FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their school justifications"
  ON public.attendance_justifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM attendances a
      JOIN teachers t ON t.id = a.teacher_id
      JOIN user_roles ur ON ur.school_id = t.school_id
      WHERE a.id = attendance_justifications.attendance_id
        AND ur.user_id = auth.uid()
        AND ur.role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can manage their own justifications"
  ON public.attendance_justifications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM attendances a
      JOIN teachers t ON t.id = a.teacher_id
      WHERE a.id = attendance_justifications.attendance_id
        AND t.user_id = auth.uid()
    )
  );

-- ANNOUNCEMENTS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all announcements"
  ON public.announcements FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their announcements"
  ON public.announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = announcements.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = announcements.school_id
    )
  );

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- GENERATION JOBS
ALTER TABLE public.generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all generation jobs"
  ON public.generation_jobs FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their generation jobs"
  ON public.generation_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = generation_jobs.school_id
        AND role = 'school_admin'
    )
  );

-- TIMETABLE VERSIONS
ALTER TABLE public.timetable_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can manage all timetable versions"
  ON public.timetable_versions FOR ALL
  USING (is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their timetable versions"
  ON public.timetable_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND school_id = timetable_versions.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school timetable versions"
  ON public.timetable_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teachers
      WHERE user_id = auth.uid()
        AND school_id = timetable_versions.school_id
    )
  );