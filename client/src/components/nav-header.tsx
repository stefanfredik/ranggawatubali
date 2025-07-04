import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Bell, Sun, Moon, LogOut, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/sidebar";

type Section = 
  | "dashboard" 
  | "members" 
  | "announcements" 
  | "activities" 
  | "payments"
  | "finance"
  | "finance-wallet"
  | "finance-income"
  | "finance-expense"
  | "finance-dues"
  | "finance-initial"
  | "donation"
  | "donation-happy"
  | "donation-sad"
  | "donation-fundraising";

export function NavHeader() {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  
  // Determine current section from URL
  const getCurrentSection = (): Section => {
    if (location.includes("/dashboard")) return "dashboard";
    if (location.includes("/members")) return "members";
    if (location.includes("/announcements")) return "announcements";
    if (location.includes("/activities")) return "activities";
    if (location.includes("/payments")) return "payments";
    
    // Finance sections
    if (location.includes("/finance/wallet")) return "finance-wallet";
    if (location.includes("/finance/income")) return "finance-income";
    if (location.includes("/finance/expense")) return "finance-expense";
    if (location.includes("/finance/dues")) return "finance-dues";
    if (location.includes("/finance/initial")) return "finance-initial";
    if (location.includes("/finance")) return "finance";
    
    // Donation sections
    if (location.includes("/donation/happy")) return "donation-happy";
    if (location.includes("/donation/sad")) return "donation-sad";
    if (location.includes("/donation/fundraising")) return "donation-fundraising";
    if (location.includes("/donation-page")) return "donation";
    if (location.includes("/donation")) return "donation";
    
    return "dashboard";
  };

  const [currentSection, setCurrentSection] = useState<Section>(getCurrentSection());
  
  // Update current section when location changes
  useEffect(() => {
    setCurrentSection(getCurrentSection());
  }, [location]);

  const handleSectionChange = (section: Section) => {
    setCurrentSection(section);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-16 bg-background bg-opacity-50 backdrop-blur-sm border border-border border-opacity-50 shadow-sm border-b z-40 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden mr-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={20} />
          </Button>
          <h1 className="text-xl font-bold">Rangga Watu Bali</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="relative"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="relative"
          >
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </Button>
          
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
      </header>
      
      <Sidebar 
        currentSection={currentSection} 
        onSectionChange={handleSectionChange} 
      />
    </>
  );
}