-- Add gender enum
CREATE TYPE public.gender AS ENUM ('male', 'female', 'other');

-- Add teacher status enum
CREATE TYPE public.teacher_status AS ENUM ('permanent', 'contract', 'substitute');

-- Add subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(school_id, code)
);

-- Add teachers table with all required fields
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  gender public.gender NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  matricule TEXT NOT NULL,
  status public.teacher_status NOT NULL,
  birth_date DATE,
  birth_place TEXT,
  address TEXT,
  photo_url TEXT,
  diploma TEXT,
  qualifications TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(school_id, matricule)
);

-- Add teacher_subjects junction table
CREATE TABLE public.teacher_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(teacher_id, subject_id)
);

-- Add invitations table for Admin École
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(email, school_id, role)
);

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY "Super admins can view all subjects"
  ON public.subjects FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can view their school subjects"
  ON public.subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = subjects.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their school subjects"
  ON public.subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE user_id = auth.uid()
        AND school_id = subjects.school_id
    )
  );

CREATE POLICY "Super admins can insert subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can insert subjects"
  ON public.subjects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = subjects.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Super admins can update subjects"
  ON public.subjects FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can update their school subjects"
  ON public.subjects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = subjects.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Super admins can delete subjects"
  ON public.subjects FOR DELETE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can delete their school subjects"
  ON public.subjects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = subjects.school_id
        AND role = 'school_admin'
    )
  );

-- RLS Policies for teachers
CREATE POLICY "Super admins can view all teachers"
  ON public.teachers FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can view their school teachers"
  ON public.teachers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = teachers.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their own profile"
  ON public.teachers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert teacher registration"
  ON public.teachers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can update all teachers"
  ON public.teachers FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can update their school teachers"
  ON public.teachers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = teachers.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can update their own profile"
  ON public.teachers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can delete teachers"
  ON public.teachers FOR DELETE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can delete their school teachers"
  ON public.teachers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = teachers.school_id
        AND role = 'school_admin'
    )
  );

-- RLS Policies for teacher_subjects
CREATE POLICY "Super admins can view all teacher subjects"
  ON public.teacher_subjects FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can view their school teacher subjects"
  ON public.teacher_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE t.id = teacher_subjects.teacher_id
        AND ur.school_id = t.school_id
        AND ur.role = 'school_admin'
    )
  );

CREATE POLICY "Teachers can view their own subjects"
  ON public.teacher_subjects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers
      WHERE id = teacher_subjects.teacher_id
        AND user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage teacher subjects"
  ON public.teacher_subjects FOR ALL
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can manage their school teacher subjects"
  ON public.teacher_subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teachers t
      JOIN public.user_roles ur ON ur.user_id = auth.uid()
      WHERE t.id = teacher_subjects.teacher_id
        AND ur.school_id = t.school_id
        AND ur.role = 'school_admin'
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Super admins can view all invitations"
  ON public.invitations FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "School admins can view their school invitations"
  ON public.invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
        AND school_id = invitations.school_id
        AND role = 'school_admin'
    )
  );

CREATE POLICY "Super admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete invitations"
  ON public.invitations FOR DELETE
  USING (public.is_super_admin(auth.uid()));

-- Add triggers for updated_at
CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add profiles fields for gender
ALTER TABLE public.profiles
  ADD COLUMN gender public.gender,
  ADD COLUMN matricule TEXT,
  ADD COLUMN birth_date DATE,
  ADD COLUMN birth_place TEXT,
  ADD COLUMN address TEXT,
  ADD COLUMN photo_url TEXT;