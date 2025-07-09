import { useState } from "react";
import { NavHeader } from "@/components/nav-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventGrid } from "@/components/donation/event-grid";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CalendarIcon, Users, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Event {
  id: number;
  userId: number;
  amount: number;
  eventName: string;
  eventDate: string;
  targetAmount: number;
  status: "collected" | "pending";
  type: "happy" | "sad" | "fundraising";
  collectionDate: string | null;
  collectionMethod: string | null;
  walletId: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    username: string;
    role: string;
  };
}

export default function DonationListPage() {
  const [activeTab, setActiveTab] = useState<"happy" | "sad" | "fundraising">("happy");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Fetch donations data based on active tab
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: [`/api/donations/type/${activeTab}`],
    queryFn: async () => {
      const res = await fetch(`/api/donations/type/${activeTab}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching donations: ${res.status}`);
      }
      return res.json();
    },
  });

  // Handle event click to show details
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailDialogOpen(true);
  };

  // Get color based on donation type
  const getColorClass = (type: "happy" | "sad" | "fundraising") => {
    switch (type) {
      case "happy":
        return "from-pink-500 to-pink-700";
      case "sad":
        return "from-blue-500 to-blue-700";
      case "fundraising":
        return "from-amber-500 to-amber-700";
      default:
        return "from-gray-500 to-gray-700";
    }
  };

  // Get icon based on donation type
  const getTypeLabel = (type: "happy" | "sad" | "fundraising") => {
    switch (type) {
      case "happy":
        return "Suka";
      case "sad":
        return "Duka";
      case "fundraising":
        return "Penggalangan Dana";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Daftar Donasi</h1>
            <p className="text-muted-foreground mt-1">
              Daftar donasi suka, duka, dan penggalangan dana berdasarkan acara
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="happy"
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "happy" | "sad" | "fundraising")}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="happy" className="py-3">
              Suka
            </TabsTrigger>
            <TabsTrigger value="sad" className="py-3">
              Duka
            </TabsTrigger>
            <TabsTrigger value="fundraising" className="py-3">
              Penggalangan Dana
            </TabsTrigger>
          </TabsList>

          <TabsContent value="happy" className="space-y-4">
            <EventGrid
              events={events || []}
              isLoading={isLoading}
              error={error as Error}
              onEventClick={handleEventClick}
              donationType="happy"
            />
          </TabsContent>

          <TabsContent value="sad" className="space-y-4">
            <EventGrid
              events={events || []}
              isLoading={isLoading}
              error={error as Error}
              onEventClick={handleEventClick}
              donationType="sad"
            />
          </TabsContent>

          <TabsContent value="fundraising" className="space-y-4">
            <EventGrid
              events={events || []}
              isLoading={isLoading}
              error={error as Error}
              onEventClick={handleEventClick}
              donationType="fundraising"
            />
          </TabsContent>
        </Tabs>

        {/* Event Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedEvent && (
              <>
                <div className={`h-2 bg-gradient-to-r ${getColorClass(selectedEvent.type)}`} />
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedEvent.eventName}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2">
                    <Badge className={`bg-gradient-to-r ${getColorClass(selectedEvent.type)} text-white`}>
                      {getTypeLabel(selectedEvent.type)}
                    </Badge>
                    <span className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {new Date(selectedEvent.eventDate).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Progress</span>
                      <span className="text-sm font-medium">
                        {selectedEvent.targetAmount > 0
                          ? Math.min(Math.round((selectedEvent.amount / selectedEvent.targetAmount) * 100), 100)
                          : 0}%
                      </span>
                    </div>
                    <Progress
                      value={
                        selectedEvent.targetAmount > 0
                          ? Math.min(Math.round((selectedEvent.amount / selectedEvent.targetAmount) * 100), 100)
                          : 0
                      }
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm pt-1">
                      <span>Rp {selectedEvent.amount.toLocaleString("id-ID")}</span>
                      <span className="text-muted-foreground">
                        dari Rp {selectedEvent.targetAmount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    {selectedEvent.status === "collected" ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Terkumpul
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                        Belum Terkumpul
                      </Badge>
                    )}
                  </div>

                  {/* Collection Details */}
                  {selectedEvent.status === "collected" && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Detail Pengumpulan:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Tanggal Pengumpulan:</span>
                        <span>
                          {selectedEvent.collectionDate
                            ? new Date(selectedEvent.collectionDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "-"}
                        </span>
                        <span className="text-muted-foreground">Metode Pengumpulan:</span>
                        <span>{selectedEvent.collectionMethod || "-"}</span>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedEvent.notes && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Catatan:</h4>
                      <p className="text-sm whitespace-pre-wrap p-3 bg-muted rounded-md">
                        {selectedEvent.notes}
                      </p>
                    </div>
                  )}

                  {/* Created By */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dibuat oleh:</span>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{selectedEvent.user.fullName}</span>
                    </div>
                  </div>

                  {/* Created At */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Dibuat pada:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(selectedEvent.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={() => setIsDetailDialogOpen(false)}
                    className={`bg-gradient-to-r ${getColorClass(selectedEvent.type)} text-white hover:opacity-90`}
                  >
                    Tutup
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}