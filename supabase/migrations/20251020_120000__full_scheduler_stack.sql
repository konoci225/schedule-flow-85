-- 20251020_120000__full_scheduler_stack.sql
-- Full scheduling stack: school settings, academic years/terms, time slots & exceptions,
-- teacher (in)availabilities, attendances, announcements, notifications, generation jobs, timetable versions.
-- Additive only. Requires helpers: public.is_super_admin(uuid), public.has_role(uuid, app_role)

begin;

-- ENUMS (create if not exists)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('queued','running','succeeded','failed');
  end if;
end $$;

-- ================================
-- 1) School-level settings
-- ================================
create table if not exists public.school_settings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  locale text default 'fr',
  timezone text default 'UTC',
  week_start int2 default 1 check (week_start between 1 and 7), -- 1 = lundi
  geofence_radius_m int2 default 120 check (geofence_radius_m between 30 and 500),
  attendance_window_before_min int2 default 15,
  attendance_window_after_min int2 default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id)
);
alter table public.school_settings enable row level security;

create policy "ss_select_scope" on public.school_settings
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.school_id = school_settings.school_id
    )
  );

create policy "ss_write_admin" on public.school_settings
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.school_id = school_settings.school_id
        and ur.role = 'school_admin'::app_role
    )
  );

-- ================================
-- 2) Academic years & terms
-- ================================
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  code text not null,               -- ex: '2025-2026'
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, code)
);
alter table public.academic_years enable row level security;

create policy "ay_select_scope" on public.academic_years
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.school_id = academic_years.school_id
    )
  );

create policy "ay_write_admin" on public.academic_years
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.school_id = academic_years.school_id
        and ur.role = 'school_admin'::app_role
    )
  );

create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  name text not null,               -- Trimestre 1 / Semestre 2...
  starts_on date not null,
  ends_on date not null,
  created_at timestamptz not null default now(),
  unique (school_id, academic_year_id, name)
);
alter table public.terms enable row level security;

create policy "terms_select_scope" on public.terms
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.school_id = terms.school_id
    )
  );

create policy "terms_write_admin" on public.terms
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.school_id = terms.school_id
        and ur.role = 'school_admin'::app_role
    )
  );

-- ================================
-- 3) Time slots & calendar exceptions
-- ================================
create table if not exists public.time_slots (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  day_of_week int2 not null check (day_of_week between 1 and 7), -- 1=lundi
  start_time time not null,
  end_time time not null check (end_time > start_time),
  label text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (school_id, day_of_week, start_time, end_time)
);
create index if not exists idx_time_slots_school_day on public.time_slots(school_id, day_of_week);
alter table public.time_slots enable row level security;

create policy "slots_select_scope" on public.time_slots
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.school_id = time_slots.school_id
    )
  );

create policy "slots_write_admin" on public.time_slots
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.school_id = time_slots.school_id
        and ur.role = 'school_admin'::app_role
    )
  );

create table if not exists public.calendar_exceptions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  date date not null,
  availability text not null check (availability in ('open','closed','half')),
  reason text,
  created_at timestamptz not null default now(),
  unique (school_id, date)
);
alter table public.calendar_exceptions enable row level security;

create policy "ce_select_scope" on public.calendar_exceptions
  for select using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.school_id = calendar_exceptions.school_id
    )
  );

create policy "ce_write_admin" on public.calendar_exceptions
  for all using (
    public.is_super_admin(auth.uid()) or exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.school_id = calendar_exceptions.school_id
        and ur.role = 'school_admin'::app_role
    )
  );

-- ================================
-- 4) Teacher (in)availabilities
-- ================================
create table if not exists public.teacher_availabilities (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  day_of_week int2 not null check (day_of_week between 1 and 7),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  preference text not null check (preference in ('available','preferred','if_needed','unavailable')),
  created_at timestamptz not null default now()
);
create index if not exists idx_ta_teacher on public.teacher_availabilities(teacher_id);
alter table public.teacher_availabilities enable row level security;

create policy "ta_select_scope" on public.teacher_availabilities
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.school_id = teacher_availabilities.school_id)
    or teacher_availabilities.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  );

create policy "ta_write_scope" on public.teacher_availabilities
  for all using (
    public.is_super_admin(auth.uid())
    or public.has_role(auth.uid(), 'school_admin'::app_role)
    or teacher_availabilities.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  );

create table if not exists public.teacher_unavailabilities (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null check (end_at > start_at),
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_tu_teacher_time on public.teacher_unavailabilities(teacher_id, start_at);
alter table public.teacher_unavailabilities enable row level security;

create policy "tu_select_scope" on public.teacher_unavailabilities
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.school_id = teacher_unavailabilities.school_id)
    or teacher_unavailabilities.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  );

create policy "tu_write_scope" on public.teacher_unavailabilities
  for all using (
    public.is_super_admin(auth.uid())
    or public.has_role(auth.uid(), 'school_admin'::app_role)
    or teacher_unavailabilities.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  );

-- ================================
-- 5) Attendances (geofencing) + justifications
-- ================================
create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  timetable_id uuid references public.timetables(id) on delete set null,
  occurred_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  accuracy_m double precision,
  method text not null default 'geofence',   -- geofence|qr|nfc|manual
  status text not null default 'present',    -- present|late|absent|excused
  notes text
);
create index if not exists idx_att_teacher_time on public.attendances(teacher_id, occurred_at desc);
alter table public.attendances enable row level security;

create policy "att_select_scope" on public.attendances
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.school_id = attendances.school_id)
    or attendances.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  );

create policy "att_insert_scope" on public.attendances
  for insert with check (
    public.is_super_admin(auth.uid())
    or public.has_role(auth.uid(), 'school_admin'::app_role)
    or new.teacher_id in (select t.id from public.teachers t where t.user_id = auth.uid())
  );

create table if not exists public.attendance_justifications (
  id uuid primary key default gen_random_uuid(),
  attendance_id uuid not null references public.attendances(id) on delete cascade,
  reason text,
  file_url text,
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  decision text check (decision in ('approved','rejected'))
);
alter table public.attendance_justifications enable row level security;

create policy "aj_select_scope" on public.attendance_justifications
  for select using (public.is_super_admin(auth.uid()) or public.has_role(auth.uid(), 'school_admin'::app_role));

create policy "aj_insert_scope" on public.attendance_justifications
  for insert with check (
    exists (
      select 1
      from public.attendances a
      join public.teachers t on t.id = a.teacher_id
      where a.id = attendance_justifications.attendance_id
        and t.user_id = auth.uid()
    )
  );

-- ================================
-- 6) Announcements & notifications
-- ================================
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  title text not null,
  body text not null,
  audience text default 'all',              -- all|teachers|classes:<id>...
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;

create policy "ann_select_scope" on public.announcements
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.school_id = announcements.school_id)
    or exists (select 1 from public.teachers t where t.user_id = auth.uid() and t.school_id = announcements.school_id)
  );

create policy "ann_write_admin" on public.announcements
  for all using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur
               where ur.user_id = auth.uid()
                 and ur.school_id = announcements.school_id
                 and ur.role = 'school_admin'::app_role)
  );

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                        -- timetable_change, attendance_reminder, etc.
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

create policy "noti_select_self" on public.notifications
  for select using (auth.uid() = user_id);

create policy "noti_insert_system" on public.notifications
  for insert with check (true);

-- ================================
-- 7) Generation jobs (solver)
-- ================================
create table if not exists public.generation_jobs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  term_id uuid references public.terms(id) on delete set null,
  created_by uuid references auth.users(id),
  status public.job_status not null default 'queued',
  params jsonb not null default '{}'::jsonb,   -- weights/constraints
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists idx_gen_jobs_school_status on public.generation_jobs(school_id, status);
alter table public.generation_jobs enable row level security;

create policy "gj_select_scope" on public.generation_jobs
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.school_id = generation_jobs.school_id)
  );

create policy "gj_write_admin" on public.generation_jobs
  for all using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur
               where ur.user_id = auth.uid()
                 and ur.school_id = generation_jobs.school_id
                 and ur.role = 'school_admin'::app_role)
  );

-- ================================
-- 8) Timetable versions (archive/publish)
-- ================================
create table if not exists public.timetable_versions (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  label text,
  snapshot jsonb not null,                    -- copie des lignes timetables (ou diff)
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.timetable_versions enable row level security;

create policy "tv_select_scope" on public.timetable_versions
  for select using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.school_id = timetable_versions.school_id)
  );

create policy "tv_write_admin" on public.timetable_versions
  for all using (
    public.is_super_admin(auth.uid())
    or exists (select 1 from public.user_roles ur
               where ur.user_id = auth.uid()
                 and ur.school_id = timetable_versions.school_id
                 and ur.role = 'school_admin'::app_role)
  );

commit;
