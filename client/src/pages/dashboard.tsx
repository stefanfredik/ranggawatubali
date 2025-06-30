import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { Announcements } from "@/components/dashboard/announcements";
import { UpcomingBirthdays } from "@/components/dashboard/upcoming-birthdays";
import { MembersTable } from "@/components/members/members-table";
import { PaymentCards } from "@/components/payments/payment-cards";
import { useLocation } from "wouter";

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
  | "finance-initial";

export default function Dashboard() {
  const [currentSection, setCurrentSection] = useState<Section>("dashboard");
  const [location, navigate] = useLocation();
  
  // Redirect to the appropriate page based on the current section
  useEffect(() => {
    if (location === "/") {
      navigate("/dashboard");
    }
    
    // Handle finance section redirects
    if (currentSection === "finance") {
      navigate("/finance");
    } else if (currentSection === "finance-wallet") {
      navigate("/finance/wallet");
    } else if (currentSection === "finance-income") {
      navigate("/finance/income");
    } else if (currentSection === "finance-expense") {
      navigate("/finance/expense");
    } else if (currentSection === "finance-dues") {
      navigate("/finance/dues");
    } else if (currentSection === "finance-initial") {
      navigate("/finance/initial");
    }
  }, [location, navigate, currentSection]);

  const renderSection = () => {
    switch (currentSection) {
      case "dashboard":
        return (
          <div className="space-y-8">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back! Here's what's happening in your organization.
              </p>
            </div>
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentActivities />
              <Announcements />
            </div>
            <UpcomingBirthdays />
          </div>
        );
      case "members":
        return <MembersTable />;
      case "payments":
        return <PaymentCards />;
      case "announcements":
        return <Announcements showAll />;
      case "activities":
        return <RecentActivities showAll />;
      default:
        return <div>Section not implemented yet</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <Sidebar currentSection={currentSection} onSectionChange={setCurrentSection} />
      
      <main className="md:ml-64 transition-all duration-300">
        <div className="p-4 md:p-8 pt-20 md:pt-8">
          {renderSection()}
        </div>
      </main>
    </div>
  );
}
