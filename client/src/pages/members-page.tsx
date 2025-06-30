import { MembersTable } from "@/components/members/members-table";
import { NavHeader } from "@/components/nav-header";

export default function MembersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage your organization members here.
          </p>
        </div>
        <MembersTable />
      </main>
    </div>
  );
}