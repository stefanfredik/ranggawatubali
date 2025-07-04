import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface AnnouncementsProps {
  showAll?: boolean;
}

export function Announcements({ showAll = false }: AnnouncementsProps) {
  const { data: announcements, isLoading } = useQuery({
    queryKey: ["/api/announcements"],
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

  if (isLoading) {
    return (
      <Card variant="glass">
        <CardHeader>
          <CardTitle>Latest Announcements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl border-l-4">
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

  const displayAnnouncements = showAll ? announcements : announcements?.slice(0, 3);

  return (
    <Card variant="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Latest Announcements</CardTitle>
          {!showAll && (
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!displayAnnouncements?.length ? (
          <p className="text-muted-foreground text-center py-8">
            No announcements found
          </p>
        ) : (
          <div className="space-y-4">
            {displayAnnouncements.map((announcement: any) => {
              const typeColors = getTypeColor(announcement.type);
              return (
                <div
                  key={announcement.id}
                  className={`p-4 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl border-l-4 ${typeColors.split(' ').pop()}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{announcement.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(announcement.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {announcement.content.length > 80
                      ? `${announcement.content.slice(0, 80)}...`
                      : announcement.content}
                  </p>
                  <div className="flex items-center">
                    <Badge className={typeColors.replace('border-l-red-500', '').replace('border-l-green-500', '').replace('border-l-blue-500', '').replace('border-l-gray-500', '')}>
                      {announcement.type}
                    </Badge>
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
