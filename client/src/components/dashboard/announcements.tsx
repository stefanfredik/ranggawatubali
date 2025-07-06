import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { ChevronRight, Info, Search, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Author {
  fullName: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "important" | "event" | "system" | string;
  createdAt: string;
  author?: Author;
}

interface AnnouncementsProps {
  showAll?: boolean;
}

export function Announcements({ showAll = false }: AnnouncementsProps) {
  // Always define the same hooks in the same order regardless of props
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/announcements");
      return response.json();
    },
    // Ensure consistent hook behavior regardless of props
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
  
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "important" | "event" | "system">("all");

  const getTypeColor = (type: string): string => {
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

  const getBorderColor = (type: string): string => {
    switch (type) {
      case "important":
        return "border-l-red-500";
      case "event":
        return "border-l-green-500";
      case "system":
        return "border-l-blue-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case "important":
        return "Penting";
      case "event":
        return "Acara";
      case "system":
        return "Sistem";
      default:
        return type;
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
      .replace('about ', 'sekitar ')
      .replace('less than a minute ago', 'kurang dari semenit yang lalu')
      .replace('minutes ago', 'menit yang lalu')
      .replace('minute ago', 'menit yang lalu')
      .replace('hours ago', 'jam yang lalu')
      .replace('hour ago', 'jam yang lalu')
      .replace('days ago', 'hari yang lalu')
      .replace('day ago', 'hari yang lalu')
      .replace('months ago', 'bulan yang lalu')
      .replace('month ago', 'bulan yang lalu')
      .replace('years ago', 'tahun yang lalu')
      .replace('year ago', 'tahun yang lalu')
      .replace('in ', 'dalam ');
  };

  const handleOpenDetail = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDetailOpen(true);
  };

  // Loading state - render UI dengan skeleton
  const renderContent = () => {
    if (isLoading) {
      return (
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
      );
    }

    if (!displayAnnouncements?.length) {
      return (
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Tidak ada pengumuman ditemukan
          </p>
        </CardContent>
      );
    }

    return (
      <CardContent>
        <div className="space-y-6">
          {/* Informasi terbaru dalam bentuk full */}
          {displayAnnouncements.length > 0 && (
            <div className={`p-5 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-md rounded-xl border-l-4 ${getBorderColor(displayAnnouncements[0].type)}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">{displayAnnouncements[0].title}</h3>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(displayAnnouncements[0].createdAt)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-4 prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: displayAnnouncements[0].content }} />
              </div>
              <div className="flex items-center justify-between">
                <Badge className={getTypeColor(displayAnnouncements[0].type)}>
                  {getTypeLabel(displayAnnouncements[0].type)}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Oleh: {displayAnnouncements[0].author?.fullName || "Admin"}
                </div>
              </div>
            </div>
          )}
          
          {/* Informasi lainnya dalam bentuk list dengan 2 baris */}
          {displayAnnouncements.slice(1).map((announcement: Announcement) => (
            <div
              key={announcement.id}
              className={`p-4 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-xl border-l-4 ${getBorderColor(announcement.type)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{announcement.title}</h4>
                <span className="text-xs text-muted-foreground">
                  {formatTimeAgo(announcement.createdAt)}
                </span>
              </div>
              <div className="text-sm text-muted-foreground mb-3 prose dark:prose-invert max-w-none line-clamp-2">
                <div dangerouslySetInnerHTML={{ __html: announcement.content }} />
              </div>
              <div className="flex items-center justify-between">
                <Badge className={getTypeColor(announcement.type)}>
                  {getTypeLabel(announcement.type)}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs flex items-center gap-1"
                  onClick={() => handleOpenDetail(announcement)}
                >
                  <Info size={12} />
                  <span>Detail</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    );
  };

  // Always define all hooks and memoized values regardless of props
  // Filter announcements based on search term and type filter
  const filteredAnnouncements = useMemo(() => {
    if (!announcements) return [];
    
    return announcements.filter((announcement: Announcement) => {
      const matchesSearch = 
        announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = 
        typeFilter === "all" || announcement.type === typeFilter;
      
      return matchesSearch && matchesType;
    });
  }, [announcements, searchTerm, typeFilter]);
  
  // Always compute this value in the same way regardless of render path
  // This ensures consistent hook behavior across renders
  const displayAnnouncements = useMemo(() => {
    if (!filteredAnnouncements) return [];
    return showAll ? filteredAnnouncements : filteredAnnouncements.slice(0, 3);
  }, [showAll, filteredAnnouncements]);

  return (
    <>
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pengumuman Terbaru</CardTitle>
            {!showAll && (
              <Link href="/announcements">
                <Button variant="ghost" size="sm" className="text-primary flex items-center gap-1">
                  <span>Lihat Semua</span>
                  <ChevronRight size={16} />
                </Button>
              </Link>
            )}
          </div>
          
          {/* Always render the search and filter UI, but conditionally show/hide with CSS */}
          <div className={`mt-4 space-y-4 ${showAll ? 'block' : 'hidden'}`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari informasi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  variant="glass"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={(value: "all" | "important" | "event" | "system") => setTypeFilter(value)}>
                  <SelectTrigger className="w-[180px]" variant="glass">
                    <SelectValue placeholder="Filter Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="important">Penting</SelectItem>
                    <SelectItem value="event">Acara</SelectItem>
                    <SelectItem value="system">Sistem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        {renderContent()}
      </Card>

      {/* Dialog untuk menampilkan detail informasi */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[700px] md:max-w-[800px] lg:max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedAnnouncement?.title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <Badge className={selectedAnnouncement ? getTypeColor(selectedAnnouncement.type) : ''}>
                {selectedAnnouncement ? getTypeLabel(selectedAnnouncement.type) : ''}
              </Badge>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Oleh: {selectedAnnouncement?.author?.fullName || "Admin"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {selectedAnnouncement && formatTimeAgo(selectedAnnouncement.createdAt)}
                </span>
              </div>
            </div>
            
            <div className="bg-background/50 backdrop-blur-sm border border-border/50 rounded-lg p-5 prose dark:prose-invert max-w-none">
              {selectedAnnouncement && (
                <div dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }} />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}