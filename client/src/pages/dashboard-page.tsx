import { StatsCards } from "@/components/dashboard/stats-cards";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { Announcements } from "@/components/dashboard/announcements";
import { UpcomingBirthdays } from "@/components/dashboard/upcoming-birthdays";
import { NavHeader } from "@/components/nav-header";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="space-y-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Hallo bro/sis. Selamat datang di Web Management Ranggawatu Bali.
            </p>
          </div>
          <StatsCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecentActivities />
            <Announcements />
          </div>
          <UpcomingBirthdays />
        </div>
      </main>
    </div>
  );
}