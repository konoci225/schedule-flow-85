export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          code: string
          created_at: string | null
          ends_on: string
          id: string
          is_active: boolean | null
          school_id: string
          starts_on: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          ends_on: string
          id?: string
          is_active?: boolean | null
          school_id: string
          starts_on: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          ends_on?: string
          id?: string
          is_active?: boolean | null
          school_id?: string
          starts_on?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string | null
          body: string
          created_at: string | null
          created_by: string
          id: string
          published_at: string | null
          school_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          audience?: string | null
          body: string
          created_at?: string | null
          created_by: string
          id?: string
          published_at?: string | null
          school_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          audience?: string | null
          body?: string
          created_at?: string | null
          created_by?: string
          id?: string
          published_at?: string | null
          school_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_justifications: {
        Row: {
          attendance_id: string
          created_at: string | null
          decided_at: string | null
          decided_by: string | null
          decision: Database["public"]["Enums"]["justification_decision"] | null
          file_url: string | null
          id: string
          reason: string
          updated_at: string | null
        }
        Insert: {
          attendance_id: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?:
            | Database["public"]["Enums"]["justification_decision"]
            | null
          file_url?: string | null
          id?: string
          reason: string
          updated_at?: string | null
        }
        Update: {
          attendance_id?: string
          created_at?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?:
            | Database["public"]["Enums"]["justification_decision"]
            | null
          file_url?: string | null
          id?: string
          reason?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_justifications_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "attendances"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          accuracy_m: number | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          method: Database["public"]["Enums"]["attendance_method"] | null
          notes: string | null
          occurred_at: string
          status: Database["public"]["Enums"]["attendance_status"] | null
          teacher_id: string
          timetable_id: string | null
          updated_at: string | null
        }
        Insert: {
          accuracy_m?: number | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          method?: Database["public"]["Enums"]["attendance_method"] | null
          notes?: string | null
          occurred_at?: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          teacher_id: string
          timetable_id?: string | null
          updated_at?: string | null
        }
        Update: {
          accuracy_m?: number | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          method?: Database["public"]["Enums"]["attendance_method"] | null
          notes?: string | null
          occurred_at?: string
          status?: Database["public"]["Enums"]["attendance_status"] | null
          teacher_id?: string
          timetable_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendances_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_timetable_id_fkey"
            columns: ["timetable_id"]
            isOneToOne: false
            referencedRelation: "timetables"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_exceptions: {
        Row: {
          availability:
            | Database["public"]["Enums"]["calendar_availability"]
            | null
          created_at: string | null
          date: string
          id: string
          reason: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          availability?:
            | Database["public"]["Enums"]["calendar_availability"]
            | null
          created_at?: string | null
          date: string
          id?: string
          reason?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          availability?:
            | Database["public"]["Enums"]["calendar_availability"]
            | null
          created_at?: string | null
          date?: string
          id?: string
          reason?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_exceptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          capacity: number | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          level: string | null
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          capacity?: number | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          level?: string | null
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          capacity?: number | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          level?: string | null
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          created_at: string | null
          created_by: string
          error: string | null
          finished_at: string | null
          id: string
          params: Json | null
          result: Json | null
          school_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          error?: string | null
          finished_at?: string | null
          id?: string
          params?: Json | null
          result?: Json | null
          school_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          error?: string | null
          finished_at?: string | null
          id?: string
          params?: Json | null
          result?: Json | null
          school_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted: boolean | null
          created_at: string | null
          created_by: string
          email: string
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          token: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string | null
          created_by: string
          email: string
          expires_at: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string
          token: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string | null
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          payload: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          payload?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender"] | null
          id: string
          last_name: string
          matricule: string | null
          phone: string | null
          photo_url: string | null
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id: string
          last_name: string
          matricule?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"] | null
          id?: string
          last_name?: string
          matricule?: string | null
          phone?: string | null
          photo_url?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          building: string | null
          capacity: number | null
          code: string
          created_at: string | null
          description: string | null
          equipment: string[] | null
          floor: string | null
          id: string
          is_available: boolean | null
          name: string
          room_type: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          building?: string | null
          capacity?: number | null
          code: string
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          floor?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          room_type?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          building?: string | null
          capacity?: number | null
          code?: string
          created_at?: string | null
          description?: string | null
          equipment?: string[] | null
          floor?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          room_type?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          attendance_window_after_min: number | null
          attendance_window_before_min: number | null
          created_at: string | null
          geofence_enabled: boolean | null
          geofence_latitude: number | null
          geofence_longitude: number | null
          geofence_radius_m: number | null
          id: string
          school_id: string
          timezone: string | null
          updated_at: string | null
          week_start: number | null
        }
        Insert: {
          attendance_window_after_min?: number | null
          attendance_window_before_min?: number | null
          created_at?: string | null
          geofence_enabled?: boolean | null
          geofence_latitude?: number | null
          geofence_longitude?: number | null
          geofence_radius_m?: number | null
          id?: string
          school_id: string
          timezone?: string | null
          updated_at?: string | null
          week_start?: number | null
        }
        Update: {
          attendance_window_after_min?: number | null
          attendance_window_before_min?: number | null
          created_at?: string | null
          geofence_enabled?: boolean | null
          geofence_latitude?: number | null
          geofence_longitude?: number | null
          geofence_radius_m?: number | null
          id?: string
          school_id?: string
          timezone?: string | null
          updated_at?: string | null
          week_start?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          phone: string | null
          timezone: string | null
          type: Database["public"]["Enums"]["school_type"]
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          phone?: string | null
          timezone?: string | null
          type: Database["public"]["Enums"]["school_type"]
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          timezone?: string | null
          type?: Database["public"]["Enums"]["school_type"]
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      setup_config: {
        Row: {
          created_at: string | null
          first_setup_completed: boolean | null
          id: string
          primary_super_admin_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_setup_completed?: boolean | null
          id?: string
          primary_super_admin_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_setup_completed?: boolean | null
          id?: string
          primary_super_admin_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_availabilities: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          preference:
            | Database["public"]["Enums"]["availability_preference"]
            | null
          start_time: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          preference?:
            | Database["public"]["Enums"]["availability_preference"]
            | null
          start_time: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          preference?:
            | Database["public"]["Enums"]["availability_preference"]
            | null
          start_time?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availabilities_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          created_at: string | null
          id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_unavailabilities: {
        Row: {
          created_at: string | null
          end_at: string
          id: string
          reason: string | null
          start_at: string
          teacher_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_at: string
          id?: string
          reason?: string | null
          start_at: string
          teacher_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_at?: string
          id?: string
          reason?: string | null
          start_at?: string
          teacher_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_unavailabilities_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string | null
          diploma: string | null
          email: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          is_approved: boolean | null
          last_name: string
          matricule: string
          phone: string
          photo_url: string | null
          qualifications: string | null
          school_id: string
          status: Database["public"]["Enums"]["teacher_status"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          diploma?: string | null
          email?: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          is_approved?: boolean | null
          last_name: string
          matricule: string
          phone: string
          photo_url?: string | null
          qualifications?: string | null
          school_id: string
          status: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string | null
          diploma?: string | null
          email?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          is_approved?: boolean | null
          last_name?: string
          matricule?: string
          phone?: string
          photo_url?: string | null
          qualifications?: string | null
          school_id?: string
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      terms: {
        Row: {
          academic_year_id: string
          created_at: string | null
          ends_on: string
          id: string
          name: string
          school_id: string
          starts_on: string
          updated_at: string | null
        }
        Insert: {
          academic_year_id: string
          created_at?: string | null
          ends_on: string
          id?: string
          name: string
          school_id: string
          starts_on: string
          updated_at?: string | null
        }
        Update: {
          academic_year_id?: string
          created_at?: string | null
          ends_on?: string
          id?: string
          name?: string
          school_id?: string
          starts_on?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          label: string | null
          school_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          label?: string | null
          school_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          label?: string | null
          school_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_versions: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          label: string
          school_id: string
          snapshot: Json
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          label: string
          school_id: string
          snapshot: Json
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          label?: string
          school_id?: string
          snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "timetable_versions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          academic_year: string | null
          class_id: string
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          notes: string | null
          room_id: string | null
          school_id: string
          start_time: string
          subject_id: string
          teacher_id: string | null
          updated_at: string | null
        }
        Insert: {
          academic_year?: string | null
          class_id: string
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          notes?: string | null
          room_id?: string | null
          school_id: string
          start_time: string
          subject_id: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_year?: string | null
          class_id?: string
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          notes?: string | null
          room_id?: string | null
          school_id?: string
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetables_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "school_admin" | "teacher"
      attendance_method: "geofence" | "qr" | "nfc" | "manual"
      attendance_status: "present" | "late" | "absent" | "excused"
      availability_preference:
        | "preferred"
        | "available"
        | "if_needed"
        | "unavailable"
      calendar_availability: "open" | "closed" | "half_day"
      gender: "male" | "female" | "other"
      job_status: "queued" | "running" | "succeeded" | "failed" | "cancelled"
      justification_decision: "pending" | "approved" | "rejected"
      school_type:
        | "primary"
        | "middle_school"
        | "high_school"
        | "university"
        | "vocational"
      teacher_status: "permanent" | "contract" | "substitute"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "school_admin", "teacher"],
      attendance_method: ["geofence", "qr", "nfc", "manual"],
      attendance_status: ["present", "late", "absent", "excused"],
      availability_preference: [
        "preferred",
        "available",
        "if_needed",
        "unavailable",
      ],
      calendar_availability: ["open", "closed", "half_day"],
      gender: ["male", "female", "other"],
      job_status: ["queued", "running", "succeeded", "failed", "cancelled"],
      justification_decision: ["pending", "approved", "rejected"],
      school_type: [
        "primary",
        "middle_school",
        "high_school",
        "university",
        "vocational",
      ],
      teacher_status: ["permanent", "contract", "substitute"],
    },
  },
} as const
