import { Announcements } from "@/components/dashboard/announcements";
import { AnnouncementManagement } from "@/components/dashboard/announcement-management";
import { NavHeader } from "@/components/nav-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Informasi</h1>
          <p className="text-muted-foreground mt-1">
            Lihat dan kelola informasi organisasi di sini.
          </p>
        </div>
        
        {isAdmin ? (
          <Tabs defaultValue="view" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="view">Lihat Informasi</TabsTrigger>
              <TabsTrigger value="manage">Kelola Informasi</TabsTrigger>
            </TabsList>
            <TabsContent value="view">
              <Announcements showAll />
            </TabsContent>
            <TabsContent value="manage">
              <AnnouncementManagement />
            </TabsContent>
          </Tabs>
        ) : (
          <Announcements showAll />
        )}
      </main>
    </div>
  );
}