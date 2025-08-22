import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Database,
  Shield,
  Workflow,
  Key,
  FileText,
  Settings,
  HelpCircle,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Datasets", href: "/datasets", icon: Database },
  { name: "Streams", href: "/streams", icon: Workflow },
  { name: "Rules", href: "/rules", icon: Shield },
  { name: "Tokens", href: "/tokens", icon: Key },
  { name: "Audit", href: "/audit", icon: FileText },
];

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const active = isActive(item.href);
    
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild className={cn(
          "transition-all duration-200",
          active && "bg-gradient-cyber text-primary-foreground shadow-cyber"
        )}>
          <NavLink to={item.href} className="flex items-center gap-3">
            <item.icon className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              active ? "text-primary-foreground" : "text-sidebar-foreground/70"
            )} />
            {!isCollapsed && (
              <span className={cn(
                "transition-colors font-medium",
                active ? "text-primary-foreground" : "text-sidebar-foreground"
              )}>
                {item.name}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className="border-r border-border/50 bg-gradient-surface">
      <SidebarHeader className="border-b border-border/50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-glow">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold bg-gradient-primary bg-clip-text text-transparent">
                DataGuardian
              </span>
              <span className="text-xs text-muted-foreground">Privacy Shield</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className={cn(
            "text-xs font-semibold text-muted-foreground mb-2",
            isCollapsed && "sr-only"
          )}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-8">
          <SidebarGroupLabel className={cn(
            "text-xs font-semibold text-muted-foreground mb-2",
            isCollapsed && "sr-only"
          )}>
            Other
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {secondaryNavigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/50 p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full justify-center hover:bg-sidebar-accent"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Collapse
            </>
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}