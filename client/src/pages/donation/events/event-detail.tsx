import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandHeart, HandHelping, Coins, ArrowLeft, CalendarIcon, Users, AlertCircle } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function EventDetailPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/donation/:type/event/:eventName");
  
  const donationType = params?.type || "";
  const eventName = params?.eventName ? decodeURIComponent(params.eventName) : "";
  
  // Get icon and color based on donation type
  const getTypeInfo = () => {
    switch (donationType) {
      case "happy":
        return { 
          icon: HandHeart, 
          color: "from-pink-500 to-pink-700",
          title: "Suka",
          path: "/donation/happy",
          eventsPath: "/donation/events/happy"
        };
      case "sad":
        return { 
          icon: HandHelping, 
          color: "from-blue-500 to-blue-700",
          title: "Duka",
          path: "/donation/sad",
          eventsPath: "/donation/events/sad"
        };
      case "fundraising":
        return { 
          icon: Coins, 
          color: "from-amber-500 to-amber-700",
          title: "Penggalangan Dana",
          path: "/donation/fundraising",
          eventsPath: "/donation/events/fundraising"
        };
      default:
        return { 
          icon: HandHeart, 
          color: "from-gray-500 to-gray-700",
          title: "Donasi",
          path: "/donation-page",
          eventsPath: "/donation-page"
        };
    }
  };
  
  const typeInfo = getTypeInfo();
  const TypeIcon = typeInfo.icon;
  
  // Fetch donations data for this event
  const { data: donationsData, isLoading, error } = useQuery<Donation[]>({
    queryKey: [`/api/donations/type/${donationType}`],
    queryFn: async () => {
      const res = await fetch(`/api/donations/type/${donationType}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching donations: ${res.status}`);
      }
      return res.json();
    }
  });
  
  // Filter donations for this event
  const eventDonations = donationsData?.filter(donation => 
    donation.eventName === eventName
  ) || [];
  
  // Calculate event statistics
  const totalAmount = eventDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const targetAmount = eventDonations[0]?.targetAmount || 0;
  const progress = targetAmount > 0 ? Math.min(Math.round((totalAmount / targetAmount) * 100), 100) : 0;
  const pendingDonations = eventDonations.filter(donation => donation.status === "pending");
  const collectedDonations = eventDonations.filter(donation => donation.status === "collected");
  const eventDate = eventDonations[0]?.eventDate ? new Date(eventDonations[0].eventDate) : null;
  
  // Handle back button
  const handleBack = () => {
    navigate(typeInfo.eventsPath);
  };
  
  // Handle create donation
  const handleCreateDonation = () => {
    navigate(typeInfo.path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2" size={16} />
          Kembali ke Daftar Acara
        </Button>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loading variant="dots" text="Memuat data acara..." />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Terjadi kesalahan saat memuat data acara.</p>
            <p className="text-sm">{(error as Error).message}</p>
          </div>
        ) : eventDonations.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Acara tidak ditemukan</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <TypeIcon className={`mr-2 h-8 w-8 text-${donationType === "happy" ? "pink" : donationType === "sad" ? "blue" : "amber"}-600`} />
                  {eventName}
                </h1>
                <div className="flex items-center text-muted-foreground mt-1">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  {eventDate ? eventDate.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }) : "Tanggal tidak tersedia"}
                </div>
              </div>
              <Button 
                onClick={handleCreateDonation} 
                className={`bg-gradient-to-r ${typeInfo.color} text-white hover:opacity-90`}
              >
                Tambah Donasi
              </Button>
            </div>

            {/* Event Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">Rp {totalAmount.toLocaleString("id-ID")}</div>
                  <p className="text-muted-foreground">Total Donasi</p>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 mt-1" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
                      <span>Rp {targetAmount.toLocaleString("id-ID")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{eventDonations.length}</div>
                  <p className="text-muted-foreground">Total Anggota</p>
                  <div className="flex items-center mt-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="ml-1 text-sm text-muted-foreground">
                      {collectedDonations.length} terkumpul, {pendingDonations.length} belum terkumpul
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">
                    {pendingDonations.length === 0 ? (
                      <span className="text-green-600">Selesai</span>
                    ) : (
                      <span className="text-orange-600">Dalam Proses</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">Status Pengumpulan</p>
                  <div className="mt-2">
                    {pendingDonations.length === 0 ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Semua donasi terkumpul
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                        {pendingDonations.length} donasi belum terkumpul
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Members Table */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Daftar Anggota</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Anggota</TableHead>
                      <TableHead>Nominal</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tanggal Pengumpulan</TableHead>
                      <TableHead>Metode</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventDonations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell className="font-medium">{donation.user.fullName}</TableCell>
                        <TableCell>Rp {donation.amount.toLocaleString("id-ID")}</TableCell>
                        <TableCell>
                          {donation.status === "collected" ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                              Terkumpul
                            </Badge>
                          ) : (
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                              Belum Terkumpul
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {donation.collectionDate 
                            ? new Date(donation.collectionDate).toLocaleDateString("id-ID")
                            : "-"}
                        </TableCell>
                        <TableCell>{donation.collectionMethod || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}