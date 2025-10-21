import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Setup from "./pages/Setup";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Schools from "./pages/Schools";
import Teachers from "./pages/Teachers";
import Admins from "./pages/Admins";
import MigrationInvitations from "./pages/MigrationInvitations";
import TeacherRegistration from "./pages/TeacherRegistration";
import SetPassword from "./pages/SetPassword";
import Classes from "./pages/Classes";
import Rooms from "./pages/Rooms";
import Subjects from "./pages/Subjects";
import Timetables from "./pages/Timetables";
import SchoolSettings from "./pages/SchoolSettings";
import AcademicYears from "./pages/AcademicYears";
import TimeSlots from "./pages/TimeSlots";
import Announcements from "./pages/Announcements";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/setup/super-admin" element={<Setup />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schools" element={<Schools />} />
          <Route path="/teachers" element={<Teachers />} />
          <Route path="/admins" element={<Admins />} />
          <Route path="/migration-invitations" element={<MigrationInvitations />} />
          <Route path="/register-teacher" element={<TeacherRegistration />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/subjects" element={<Subjects />} />
          <Route path="/timetables" element={<Timetables />} />
          <Route path="/school-settings" element={<SchoolSettings />} />
          <Route path="/academic-years" element={<AcademicYears />} />
          <Route path="/time-slots" element={<TimeSlots />} />
          <Route path="/announcements" element={<Announcements />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
