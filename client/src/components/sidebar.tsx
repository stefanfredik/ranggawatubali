import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Mountain, Bell, Sun, Moon, LogOut, Users, Megaphone, Calendar, CreditCard, LayoutDashboard, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Section = "dashboard" | "members" | "announcements" | "activities" | "payments";

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
}

export function Sidebar({ currentSection, onSectionChange }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
    { id: "members", label: "Members", icon: Users, adminOnly: true },
    { id: "announcements", label: "Announcements", icon: Megaphone, adminOnly: false },
    { id: "activities", label: "Activities", icon: Calendar, adminOnly: false },
    { id: "payments", label: "Payments", icon: CreditCard, adminOnly: false },
  ];

  const visibleItems = navigationItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSectionChange = (section: Section) => {
    onSectionChange(section);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden fixed top-4 left-4 z-50 glassmorphism-card"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full glassmorphism border-r border-glass-border z-50 transition-all duration-300",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-glass-border">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center")}>
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Mountain className="text-white" size={20} />
                </div>
                {!isCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold">Rangga Watu Bali</h1>
                    <p className="text-xs text-muted-foreground">Organization Management</p>
                  </div>
                )}
              </div>
              {!isMobileOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:flex p-2"
                >
                  <Menu size={16} />
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start transition-all duration-200",
                    isCollapsed ? "px-3" : "px-4",
                    isActive
                      ? "bg-primary/10 text-primary border-r-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  onClick={() => handleSectionChange(item.id as Section)}
                >
                  <Icon size={20} className={cn("flex-shrink-0", !isCollapsed && "mr-3")} />
                  {!isCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Button>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-glass-border p-4 space-y-4">
            {/* Theme Toggle & Notifications */}
            <div className={cn("flex space-x-2", isCollapsed && "flex-col space-x-0 space-y-2")}>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={cn("relative", isCollapsed ? "w-full" : "flex-1")}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                {!isCollapsed && <span className="ml-2">Theme</span>}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className={cn("relative", isCollapsed ? "w-full" : "flex-1")}
              >
                <Bell size={18} />
                {!isCollapsed && <span className="ml-2">Notifications</span>}
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </Button>
            </div>

            {/* User Profile */}
            <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center")}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">
                  {user?.fullName ? getUserInitials(user.fullName) : "U"}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {user?.role || "member"}
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-muted-foreground hover:text-destructive p-2"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}