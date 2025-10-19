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
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
