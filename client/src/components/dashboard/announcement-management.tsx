import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { AnnouncementForm } from "./announcement-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export function AnnouncementManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  const { data: announcements, isLoading } = useQuery({
    queryKey: ["/api/announcements"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/announcements/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast.success("Pengumuman berhasil dihapus");
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
    onError: (error: any) => {
      toast.error(
        error.message || "Gagal menghapus pengumuman. Silakan coba lagi."
      );
    },
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case "important":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-l-red-500";
      case "event":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-l-green-500";
      case "system":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 border-l-blue-500";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-l-gray-500";
    }
  };

  const handleEdit = (announcement: any) => {
    setSelectedAnnouncement(announcement);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setSelectedAnnouncement(null);
  };

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Pengumuman</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl border-l-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-3 w-full mb-3" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kelola Pengumuman</CardTitle>
          {isAdmin && (
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={() => setSelectedAnnouncement(null)}
                >
                  <Plus size={16} />
                  <span>Tambah</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {selectedAnnouncement
                      ? "Edit Pengumuman"
                      : "Tambah Pengumuman"}
                  </DialogTitle>
                </DialogHeader>
                <AnnouncementForm
                  announcement={selectedAnnouncement}
                  onSuccess={handleFormClose}
                  onCancel={handleFormClose}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!announcements?.length ? (
          <p className="text-muted-foreground text-center py-8">
            Tidak ada pengumuman ditemukan
          </p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement: any) => {
              const typeColors = getTypeColor(announcement.type);
              return (
                <div
                  key={announcement.id}
                  className={`p-4 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl border-l-4 ${typeColors
                    .split(" ")
                    .pop()}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{announcement.title}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(announcement.createdAt), {
                          addSuffix: true,
                        })
                          .replace("about ", "sekitar ")
                          .replace(
                            "less than a minute ago",
                            "kurang dari semenit yang lalu"
                          )
                          .replace("minutes ago", "menit yang lalu")
                          .replace("minute ago", "menit yang lalu")
                          .replace("hours ago", "jam yang lalu")
                          .replace("hour ago", "jam yang lalu")
                          .replace("days ago", "hari yang lalu")
                          .replace("day ago", "hari yang lalu")
                          .replace("months ago", "bulan yang lalu")
                          .replace("month ago", "bulan yang lalu")
                          .replace("years ago", "tahun yang lalu")
                          .replace("year ago", "tahun yang lalu")
                          .replace("in ", "dalam ")}
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEdit(announcement)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Hapus Pengumuman
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus pengumuman
                                  ini? Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDelete(announcement.id)
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3 prose dark:prose-invert max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge
                      className={typeColors
                        .replace("border-l-red-500", "")
                        .replace("border-l-green-500", "")
                        .replace("border-l-blue-500", "")
                        .replace("border-l-gray-500", "")}
                    >
                      {announcement.type === "important"
                        ? "Penting"
                        : announcement.type === "event"
                        ? "Acara"
                        : announcement.type === "system"
                        ? "Sistem"
                        : "Umum"}
                    </Badge>
                    <div className="text-xs text-muted-foreground">
                      Oleh: {announcement.author?.fullName || "Admin"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}