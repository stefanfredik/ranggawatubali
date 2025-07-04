import { useState } from "react";
import { EventCard } from "./event-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, AlertCircle } from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface Event {
  id: number;
  eventName: string;
  eventDate: string;
  amount: number;
  targetAmount: number;
  status: "collected" | "pending";
  type: "happy" | "sad" | "fundraising";
}

interface EventGridProps {
  events: Event[];
  isLoading: boolean;
  error: Error | null;
  onEventClick: (event: Event) => void;
  donationType: "happy" | "sad" | "fundraising";
}

export function EventGrid({
  events,
  isLoading,
  error,
  onEventClick,
  donationType,
}: EventGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter events based on search term and status filter
  const filteredEvents = events?.filter((event) => {
    const matchesSearch = event.eventName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "collected" && event.status === "collected") ||
      (statusFilter === "pending" && event.status === "pending");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Cari acara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="collected">Terkumpul</SelectItem>
              <SelectItem value="pending">Belum Terkumpul</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" onClick={() => {
          setSearchTerm("");
          setStatusFilter("all");
        }}>
          <Filter className="mr-2" size={16} />
          Reset Filter
        </Button>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loading variant="dots" text="Memuat data acara..." />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>Terjadi kesalahan saat memuat data acara.</p>
          <p className="text-sm">{error.message}</p>
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                eventName={event.eventName}
                eventDate={event.eventDate}
                amount={event.amount}
                targetAmount={event.targetAmount}
                status={event.status}
                type={donationType}
                onClick={() => onEventClick(event)}
              />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Tidak ada acara yang sesuai dengan filter
        </div>
      )}
    </div>
  );
}