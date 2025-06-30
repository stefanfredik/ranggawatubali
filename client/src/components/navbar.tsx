import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Mountain, Sun, Moon, LogOut, Users, Megaphone, Calendar, CreditCard, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "dashboard" | "members" | "announcements" | "activities" | "payments";

interface NavbarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
}

export function Navbar({ currentSection, onSectionChange }: NavbarProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "members", label: "Members", icon: Users, adminOnly: true },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "activities", label: "Activities", icon: Calendar },
    { id: "payments", label: "Payments", icon: CreditCard },
  ] as const;

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

  return (
    <nav className="glassmorphism sticky top-0 z-50 border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <Mountain className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold">Rangga Watu Bali</h1>
              <p className="text-xs text-muted-foreground">Organization Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "transition-colors font-medium",
                    currentSection === item.id
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => onSectionChange(item.id as Section)}
                >
                  <Icon size={16} className="mr-2" />
                  {item.label}
                </Button>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-2">

            {/* Theme Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </Button>

            {/* User Profile */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">
                  {user?.fullName ? getUserInitials(user.fullName) : "U"}
                </span>
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user?.fullName || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role || "member"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-glass-border px-4 py-2">
        <div className="flex space-x-1 overflow-x-auto">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "flex-shrink-0 transition-colors",
                  currentSection === item.id
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onSectionChange(item.id as Section)}
              >
                <Icon size={16} className="mr-1" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
