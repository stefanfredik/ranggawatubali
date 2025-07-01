import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { EventGrid } from "@/components/donation/event-grid";

interface Donation {
  id: number;
  userId: number;
  amount: number;
  eventName: string;
  eventDate: string;
  targetAmount: number;
  status: "collected" | "pending";
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

// Function to group donations by event name
function groupDonationsByEvent(donations: Donation[]) {
  const eventMap = new Map();
  
  donations?.forEach((donation) => {
    const eventKey = donation.eventName;
    
    if (!eventMap.has(eventKey)) {
      eventMap.set(eventKey, {
        id: donation.id, // Using first donation's ID as event ID
        eventName: donation.eventName,
        eventDate: donation.eventDate,
        amount: 0,
        targetAmount: donation.targetAmount || 0,
        status: donation.status,
        type: "fundraising" as const,
        donations: [],
      });
    }
    
    const event = eventMap.get(eventKey);
    event.amount += donation.amount;
    event.donations.push(donation);
    
    // If any donation is pending, the event is pending
    if (donation.status === "pending") {
      event.status = "pending";
    }
  });
  
  return Array.from(eventMap.values());
}

export default function FundraisingEventsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch donations data
  const { data: donationsData, isLoading, error } = useQuery<Donation[]>({
    queryKey: ["/api/donations/type/fundraising"],
    queryFn: async () => {
      const res = await fetch("/api/donations/type/fundraising", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching donations: ${res.status}`);
      }
      return res.json();
    }
  });
  
  // Group donations by event
  const events = groupDonationsByEvent(donationsData || []);
  
  // Handle event click
  const handleEventClick = (event: any) => {
    // Navigate to event detail page or members list page
    navigate(`/donation/fundraising/event/${event.eventName}`);
  };
  
  // Handle create new donation event
  const handleCreateEvent = () => {
    navigate("/donation/fundraising");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Coins className="mr-2 h-8 w-8 text-amber-600" />
              Acara Penggalangan Dana
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola dan lihat semua acara penggalangan dana
            </p>
          </div>
          <Button onClick={handleCreateEvent} className="bg-gradient-to-r from-amber-500 to-amber-700 text-white hover:opacity-90">
            <Plus className="mr-2" size={16} />
            Buat Penggalangan Dana Baru
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Daftar Acara Penggalangan Dana</CardTitle>
          </CardHeader>
          <CardContent>
            <EventGrid
              events={events}
              isLoading={isLoading}
              error={error as Error}
              onEventClick={handleEventClick}
              donationType="fundraising"
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}