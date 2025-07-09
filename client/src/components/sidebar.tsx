import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Sun, Moon, LogOut, Users, Megaphone, Calendar, CreditCard, LayoutDashboard, Menu, X, Wallet, DollarSign, PiggyBank, Receipt, ArrowDownCircle, ArrowUpCircle, Gift, HandHeart, HandHelping, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";

type Section = "dashboard" | "members" | "announcements" | "activities" | "payments" | "finance" | "finance-wallet" | "finance-income" | "finance-expense" | "finance-dues" | "finance-initial" | "donation" | "donation-happy" | "donation-sad" | "donation-fundraising";

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
    { id: "members", label: "Anggota", icon: Users, adminOnly: true },
    { id: "announcements", label: "Informasi", icon: Megaphone, adminOnly: false },
    { id: "activities", label: "Kegiatan", icon: Calendar, adminOnly: false },
    { id: "payments", label: "Pembayaran", icon: CreditCard, adminOnly: false },
    { 
      id: "finance", 
      label: "Keuangan", 
      icon: DollarSign, 
      adminOnly: false,
      submenu: [
        { id: "finance-wallet", label: "Dompet Saldo", icon: Wallet, adminOnly: false },
        { id: "finance-income", label: "Pemasukan", icon: ArrowDownCircle, adminOnly: false },
        { id: "finance-expense", label: "Pengeluaran", icon: ArrowUpCircle, adminOnly: false },
        { id: "finance-dues", label: "Iuran", icon: Receipt, adminOnly: false },
        { id: "finance-initial", label: "Uang Pangkal", icon: PiggyBank, adminOnly: false },
      ]
    },
    { 
      id: "donation", 
      label: "Donasi", 
      icon: Gift, 
      adminOnly: false,
      submenu: [
        { id: "donation-happy", label: "Suka", icon: HandHeart, adminOnly: false },
        { id: "donation-sad", label: "Duka", icon: HandHelping, adminOnly: false },
        { id: "donation-fundraising", label: "Penggalangan Dana", icon: Coins, adminOnly: false },
      ]
    }
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

  const [location, navigate] = useLocation();
  
  const handleSectionChange = (section: Section) => {
    onSectionChange(section);
    setIsMobileOpen(false);
    
    // Navigate to the corresponding route
    if (section === "dashboard") {
      navigate("/dashboard");
    } else if (section.startsWith("finance-")) {
      // Handle finance submenu navigation
      const subSection = section.replace("finance-", "");
      navigate(`/finance/${subSection}`);
    } else if (section === "finance") {
      // Navigate to main finance page
      navigate("/finance");
    } else if (section.startsWith("donation-")) {
      // Handle donation submenu navigation
      const subSection = section.replace("donation-", "");
      navigate(`/donation/${subSection}`);
    } else if (section === "donation") {
      // Navigate to main donation page
      navigate("/donation");
    } else {
      navigate(`/${section}`);
    }
  };
  
  // Update current section based on location
  useEffect(() => {
    const path = location.split("/")[1] || "dashboard";
    if (path === "") return;
    
    const newSection = path as Section;
    if (navigationItems.some(item => item.id === newSection)) {
      onSectionChange(newSection);
    }
  }, [location, onSectionChange]);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "md:hidden fixed top-4 left-3 z-50 bg-background bg-opacity-50 backdrop-blur-sm border border-border border-opacity-50 shadow-sm transition-all duration-300 shadow-lg hover:shadow-xl"
        )}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? 
          <X size={20} className="text-destructive animate-fadeIn" /> : 
          <Menu size={20} className="text-primary animate-fadeIn" />
        }
      </Button>
      
      {/* Sidebar Toggle Button (Always Visible) */}
      <Button
        variant="neomorphic"
        size="sm"
        className={cn(
          "fixed top-4 left-4 z-50 bg-background bg-opacity-50 backdrop-blur-sm border border-border border-opacity-50 shadow-sm transition-all duration-300 shadow-lg hover:shadow-xl",
          isMobileOpen ? "hidden" : "hidden md:flex"
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <Menu size={16} className={cn("transition-transform duration-300", isCollapsed ? "rotate-180" : "rotate-0")} />
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 transition-all duration-300 shadow-xl",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "neumorphism border-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-glass-border bg-gradient-to-r from-transparent to-primary/10 shadow-sm">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center space-x-3", isCollapsed && "justify-center")}>                
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">RWB</span>
                </div>
                {!isCollapsed && (
                  <div>
                    <h1 className="text-lg font-bold">Rangga Watu Bali</h1>
                    <p className="text-xs text-muted-foreground">Organization Management</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentSection === item.id || (item.submenu && item.submenu.some(subItem => currentSection === subItem.id));
              const [isSubmenuOpen, setIsSubmenuOpen] = useState(isActive);
              
              return (
                <div key={item.id}>
                  <Button
                    variant={isActive ? "glass" : "flat"}
                    className={cn(
                      "w-full justify-start transition-all duration-300 rounded-lg my-1",
                      isCollapsed ? "px-3" : "px-4",
                      isActive
                        ? "text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                    )}
                    onClick={() => {
                      if (item.submenu) {
                        setIsSubmenuOpen(!isSubmenuOpen);
                      } else {
                        handleSectionChange(item.id as Section);
                      }
                    }}
                  >
                    <Icon size={20} className={cn("flex-shrink-0", !isCollapsed && "mr-3")} />
                    {!isCollapsed && (
                      <div className="flex justify-between items-center w-full">
                        <span className="font-medium">{item.label}</span>
                        {item.submenu && (
                          <span className={cn("transition-transform", isSubmenuOpen ? "rotate-180" : "")}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        )}
                      </div>
                    )}
                  </Button>
                  
                  {/* Submenu */}
                  {!isCollapsed && item.submenu && isSubmenuOpen && (
                    <div className="ml-6 mt-2 mb-3 space-y-1 pl-1 border-l border-glass-border/50 animate-fadeIn">
                      {item.submenu.map((subItem) => {
                        const isSubActive = currentSection === subItem.id;
                        const SubIcon = subItem.icon || (() => <div className="w-2 h-2 rounded-full bg-current" />);
                        return (
                          <Button
                            key={subItem.id}
                            variant={isSubActive ? "glass" : "flat"}
                            className={cn(
                              "w-full justify-start transition-all duration-300 pl-6 rounded-lg my-1",
                              isSubActive
                                ? "text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground hover:translate-x-1"
                            )}
                            onClick={() => handleSectionChange(subItem.id as Section)}
                          >
                            {subItem.icon ? (
                              <SubIcon size={16} className="mr-3" />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-current mr-3" />
                            )}
                            <span className="font-medium">{subItem.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Bottom Section */}
          <div className="border-t border-glass-border p-4 space-y-4 bg-gradient-to-r from-transparent to-primary/5 shadow-inner">
            {/* Theme Toggle & Notifications */}
            <div className={cn("flex space-x-2", isCollapsed && "flex-col space-x-0 space-y-2")}>
              <Button
                variant="neomorphic"
                size="sm"
                onClick={toggleTheme}
                className={cn(
                  "relative transition-all duration-300 hover:text-primary", 
                  isCollapsed ? "w-full" : "flex-1"
                )}
              >
                {theme === "dark" ? 
                  <Sun size={18} className="text-amber-400 hover:rotate-45 transition-transform duration-300" /> : 
                  <Moon size={18} className="text-indigo-400 hover:rotate-12 transition-transform duration-300" />
                }
                {!isCollapsed && <span className="ml-2">Theme</span>}
              </Button>
              

            </div>

            {/* User Profile */}
            <div className={cn(
              "flex items-center space-x-3 p-2 rounded-lg transition-all duration-300",
              isCollapsed && "justify-center"
            )}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
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
                variant="glass"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="text-muted-foreground hover:text-destructive p-2 transition-all duration-300"
              >
                <LogOut size={16} className="hover:rotate-12 transition-transform duration-300" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}