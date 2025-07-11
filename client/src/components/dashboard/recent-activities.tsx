import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mountain, Utensils, HandHeart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useMemo } from "react";

interface Activity {
  id: string;
  title: string;
  date: string;
  participantCount: number;
  status: "active" | "upcoming" | "completed";
}

interface RecentActivitiesProps {
  showAll?: boolean;
}

export function RecentActivities({ showAll = false }: RecentActivitiesProps) {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const getActivityIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("hiking") || lowerTitle.includes("mount")) {
      return Mountain;
    }
    if (lowerTitle.includes("food") || lowerTitle.includes("festival")) {
      return Utensils;
    }
    return HandHeart;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "active":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "upcoming":
        return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100";
      case "completed":
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case "active":
        return "Aktif";
      case "upcoming":
        return "Akan Datang";
      case "completed":
        return "Selesai";
      default:
        return status;
    }
  };

  const formatIndonesianDate = (dateString: string): string => {
    return format(new Date(dateString), "d MMMM yyyy")
      .replace(/January/g, "Januari")
      .replace(/February/g, "Februari")
      .replace(/March/g, "Maret")
      .replace(/April/g, "April")
      .replace(/May/g, "Mei")
      .replace(/June/g, "Juni")
      .replace(/July/g, "Juli")
      .replace(/August/g, "Agustus")
      .replace(/September/g, "September")
      .replace(/October/g, "Oktober")
      .replace(/November/g, "November")
      .replace(/December/g, "Desember");
  };

  // Always call useMemo to ensure consistent hook behavior
  const displayActivities = useMemo(() => {
    if (!activities) return [];
    return showAll ? activities : activities.slice(0, 3);
  }, [activities, showAll]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start space-x-4 p-4 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </CardContent>
      );
    }

    if (!displayActivities?.length) {
      return (
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Tidak ada kegiatan ditemukan
          </p>
        </CardContent>
      );
    }

    return (
      <CardContent>
        <div className="space-y-4">
          {displayActivities.map((activity: Activity) => {
            const Icon = getActivityIcon(activity.title);
            return (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="text-white" size={16} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{activity.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatIndonesianDate(activity.date)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activity.participantCount} peserta
                  </p>
                </div>
                <Badge className={getStatusColor(activity.status)}>
                  {getStatusLabel(activity.status)}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    );
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Kegiatan Terbaru</CardTitle>
          {!showAll && (
            <Button variant="ghost" size="sm" className="text-primary">
              Lihat Semua
            </Button>
          )}
        </div>
      </CardHeader>
      {renderContent()}
    </Card>
  );
}