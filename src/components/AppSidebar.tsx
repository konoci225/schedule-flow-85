import { useLocation, useNavigate } from "react-router-dom";
import { School, Building2, Users, Shield, LayoutDashboard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface AppSidebarProps {
  userRole: string | null;
}

export function AppSidebar({ userRole }: AppSidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const collapsed = state === "collapsed";

  const menuItems = [
    {
      title: "Tableau de bord",
      url: "/dashboard",
      icon: LayoutDashboard,
      roles: ["super_admin", "school_admin", "teacher"],
    },
    {
      title: "Établissements",
      url: "/schools",
      icon: Building2,
      roles: ["super_admin"],
    },
    {
      title: "Professeurs",
      url: "/teachers",
      icon: Users,
      roles: ["super_admin", "school_admin"],
    },
    {
      title: "Administrateurs",
      url: "/admins",
      icon: Shield,
      roles: ["super_admin"],
    },
  ];

  const filteredItems = menuItems.filter(item => 
    userRole && item.roles.includes(userRole)
  );

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.url)}
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
