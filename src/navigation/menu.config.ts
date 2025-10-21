// src/navigation/menu.config.ts
import {
  LayoutDashboard, CalendarRange, CalendarCheck, Fingerprint, Megaphone, User,
  Building2, Users, Shield, School, DoorOpen, BookOpen, Calendar, CalendarDays, Clock, Settings,
  type Icon as LucideIcon
} from "lucide-react";

export type Role = "super_admin" | "school_admin" | "teacher";

export interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
  roles: Role[];
}

export const MENU_CONFIG: MenuItem[] = [
  { title: "Tableau de bord", url: "/dashboard", icon: LayoutDashboard, roles: ["super_admin","school_admin","teacher"] },

  // ------- Teacher
  { title: "Mon emploi du temps", url: "/my-timetable", icon: CalendarRange, roles: ["teacher"] },
  { title: "Disponibilités", url: "/my-availability", icon: CalendarCheck, roles: ["teacher"] },
  { title: "Présences", url: "/my-attendance", icon: Fingerprint, roles: ["teacher"] },
  { title: "Annonces", url: "/announcements", icon: Megaphone, roles: ["teacher"] },
  { title: "Mon profil", url: "/profile", icon: User, roles: ["teacher"] },

  // ------- School Admin
  { title: "Professeurs", url: "/teachers", icon: Users, roles: ["school_admin","super_admin"] },
  { title: "Établissements", url: "/schools", icon: Building2, roles: ["super_admin"] },
  { title: "Administrateurs", url: "/admins", icon: Shield, roles: ["super_admin"] },
  { title: "Classes", url: "/classes", icon: School, roles: ["school_admin"] },
  { title: "Salles", url: "/rooms", icon: DoorOpen, roles: ["school_admin"] },
  { title: "Matières", url: "/subjects", icon: BookOpen, roles: ["school_admin"] },
  { title: "Emplois du temps", url: "/timetables", icon: Calendar, roles: ["school_admin"] },
  { title: "Années scolaires", url: "/academic-years", icon: CalendarDays, roles: ["school_admin"] },
  { title: "Créneaux horaires", url: "/time-slots", icon: Clock, roles: ["school_admin"] },
  { title: "Annonces", url: "/announcements", icon: Megaphone, roles: ["school_admin"] },
  { title: "Paramètres", url: "/school-settings", icon: Settings, roles: ["school_admin"] },
];

