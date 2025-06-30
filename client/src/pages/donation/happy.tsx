import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HandHeart, Plus, Filter, Download, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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

interface Wallet {
  id: number;
  name: string;
  balance: string;
  description: string | null;
}

export default function HappyDonationPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");
  
  // State for collection form
  const [collectionDate, setCollectionDate] = useState<Date | undefined>(new Date());
  const [collectionMethod, setCollectionMethod] = useState("Transfer Bank");
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  
  // State for create donation form
  const [donationAmount, setDonationAmount] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch donations data (placeholder - API endpoint needs to be implemented)
  const { data: donationsData, isLoading: isLoadingDonations, error: donationsError } = useQuery<Donation[]>({
    queryKey: ["/api/donations/happy"],
    queryFn: async () => {
      // This is a placeholder. The actual API endpoint needs to be implemented.
      const res = await fetch("/api/donations/happy", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching donations: ${res.status}`);
      }
      return res.json();
    },
    enabled: false // Disable this query until the API endpoint is implemented
  });

  // Fetch wallets for collection form
  const { data: wallets, isLoading: isLoadingWallets } = useQuery<Wallet[]>({
    queryKey: ["/api/wallets"],
    queryFn: async () => {
      const res = await fetch("/api/wallets", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching wallets: ${res.status}`);
      }
      return res.json();
    }
  });

  // Fetch members for create donation form
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["/api/members"],
    queryFn: async () => {
      const res = await fetch("/api/members", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching members: ${res.status}`);
      }
      return res.json();
    }
  });

  // Placeholder data for development
  const placeholderDonations: Donation[] = [
    {
      id: 1,
      userId: 1,
      amount: 100000,
      eventName: "Pernikahan Anggota",
      eventDate: "2023-06-15",
      status: "collected",
      collectionDate: "2023-06-10",
      collectionMethod: "Transfer Bank",
      walletId: 1,
      notes: "Donasi untuk acara pernikahan",
      createdAt: "2023-06-01T00:00:00Z",
      updatedAt: "2023-06-10T00:00:00Z",
      user: {
        id: 1,
        fullName: "Budi Santoso",
        email: "budi@example.com",
        username: "budi",
        role: "member"
      }
    },
    {
      id: 2,
      userId: 2,
      amount: 150000,
      eventName: "Kelahiran Anak",
      eventDate: "2023-07-20",
      status: "pending",
      collectionDate: null,
      collectionMethod: null,
      walletId: null,
      notes: null,
      createdAt: "2023-07-01T00:00:00Z",
      updatedAt: "2023-07-01T00:00:00Z",
      user: {
        id: 2,
        fullName: "Ani Wijaya",
        email: "ani@example.com",
        username: "ani",
        role: "member"
      }
    }
  ];

  // Reset form functions
  const resetCollectionForm = () => {
    setCollectionDate(new Date());
    setCollectionMethod("Transfer Bank");
    setSelectedWalletId(null);
    setNotes("");
  };

  const resetCreateForm = () => {
    setDonationAmount("");
    setEventName("");
    setEventDate(new Date());
    setSelectedUserIds([]);
    setSelectAll(false);
  };

  // Handle opening the collection dialog
  const handleOpenCollectionDialog = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsDialogOpen(true);
  };

  // Handle opening the detail dialog
  const handleOpenDetailDialog = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsDetailDialogOpen(true);
  };

  // Handle select all members
  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && members) {
      setSelectedUserIds(members.map((member: any) => member.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  // Handle select individual member
  const handleSelectMember = (checked: boolean, userId: number) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, userId]);
    } else {
      setSelectedUserIds(prev => prev.filter(id => id !== userId));
    }
  };

  // Filter donations based on search term and filters
  const filteredDonations = placeholderDonations.filter(donation => {
    const matchesSearch = donation.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || donation.status === statusFilter;
    const matchesEvent = eventFilter === "all" || donation.eventName === eventFilter;
    
    return matchesSearch && matchesStatus && matchesEvent;
  });

  // Calculate statistics
  const totalDonations = placeholderDonations.length;
  const collectedDonations = placeholderDonations.filter(d => d.status === "collected").length;
  const pendingDonations = placeholderDonations.filter(d => d.status === "pending").length;
  const collectionRate = totalDonations > 0 ? (collectedDonations / totalDonations) * 100 : 0;
  const totalAmount = placeholderDonations.reduce((sum, d) => sum + d.amount, 0);
  const collectedAmount = placeholderDonations
    .filter(d => d.status === "collected")
    .reduce((sum, d) => sum + d.amount, 0);

  // Get unique event names for filter
  const uniqueEvents = Array.from(new Set(placeholderDonations.map(d => d.eventName)));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-red-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <HandHeart className="mr-2 text-pink-500" />
              Donasi Suka
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola donasi untuk acara suka seperti pernikahan, kelahiran, dll.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800"
          >
            <Plus className="mr-2" size={16} />
            Buat Donasi Baru
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Donasi</p>
                  <h3 className="text-2xl font-bold">{totalDonations}</h3>
                </div>
                <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-full">
                  <HandHeart className="text-pink-500" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Terkumpul</p>
                  <h3 className="text-2xl font-bold">{collectedDonations}</h3>
                </div>
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                  <CheckCircle className="text-green-500" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Belum Terkumpul</p>
                  <h3 className="text-2xl font-bold">{pendingDonations}</h3>
                </div>
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <AlertCircle className="text-orange-500" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Nominal</p>
                  <h3 className="text-2xl font-bold">Rp {totalAmount.toLocaleString('id-ID')}</h3>
                </div>
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <HandHeart className="text-blue-500" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Progres Pengumpulan</h3>
              <Badge variant="outline">{collectionRate.toFixed(0)}%</Badge>
            </div>
            <Progress value={collectionRate} className="h-2" />
            <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
              <span>Terkumpul: Rp {collectedAmount.toLocaleString('id-ID')}</span>
              <span>Target: Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari nama anggota atau acara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="collected">Terkumpul</SelectItem>
                    <SelectItem value="pending">Belum Terkumpul</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-48">
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter Acara" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Acara</SelectItem>
                    {uniqueEvents.map(event => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full md:w-auto">
                <Filter className="mr-2" size={16} />
                Reset Filter
              </Button>
              <Button variant="outline" className="w-full md:w-auto">
                <Download className="mr-2" size={16} />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Donations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anggota</TableHead>
                  <TableHead>Acara</TableHead>
                  <TableHead>Tanggal Acara</TableHead>
                  <TableHead>Nominal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDonations.length > 0 ? (
                  filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{donation.user.fullName}</TableCell>
                      <TableCell>{donation.eventName}</TableCell>
                      <TableCell>{new Date(donation.eventDate).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>Rp {donation.amount.toLocaleString('id-ID')}</TableCell>
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
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetailDialog(donation)}
                          >
                            Detail
                          </Button>
                          {donation.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                              onClick={() => handleOpenCollectionDialog(donation)}
                            >
                              Kumpulkan
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data donasi yang sesuai dengan filter
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Collection Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kumpulkan Donasi</DialogTitle>
              <DialogDescription>
                Masukkan detail pengumpulan donasi dari {selectedDonation?.user.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Nominal
                </Label>
                <div className="col-span-3">
                  <Input
                    id="amount"
                    placeholder="Masukkan nominal donasi sesuai keinginan"
                    defaultValue={selectedDonation?.amount.toString()}
                    onChange={(e) => {
                      if (selectedDonation) {
                        setSelectedDonation({
                          ...selectedDonation,
                          amount: parseInt(e.target.value) || 0
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="collection-date" className="text-right">
                  Tanggal Pengumpulan
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !collectionDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {collectionDate ? format(collectionDate, "PPP") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={collectionDate}
                        onSelect={setCollectionDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="collection-method" className="text-right">
                  Metode Pengumpulan
                </Label>
                <div className="col-span-3">
                  <Select value={collectionMethod} onValueChange={setCollectionMethod}>
                    <SelectTrigger id="collection-method">
                      <SelectValue placeholder="Pilih metode pengumpulan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                      <SelectItem value="Tunai">Tunai</SelectItem>
                      <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="wallet" className="text-right">
                  Dompet Tujuan
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={selectedWalletId?.toString() || ""} 
                    onValueChange={(value) => setSelectedWalletId(Number(value))}
                  >
                    <SelectTrigger id="wallet">
                      <SelectValue placeholder="Pilih dompet tujuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingWallets ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Memuat...
                        </SelectItem>
                      ) : wallets && wallets.length > 0 ? (
                        wallets.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id.toString()}>
                            {wallet.name} (Rp {parseInt(wallet.balance).toLocaleString('id-ID')})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>
                          Tidak ada dompet tersedia
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Catatan
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="notes"
                    placeholder="Catatan tambahan (opsional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                className="bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800"
                onClick={() => {
                  if (!selectedDonation) return;
                  if (!collectionDate) {
                    toast({
                      title: "Error",
                      description: "Tanggal pengumpulan harus diisi",
                      variant: "destructive"
                    });
                    return;
                  }
                  if (!selectedWalletId) {
                    toast({
                      title: "Error",
                      description: "Dompet tujuan harus dipilih",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Simulasi API call untuk mengumpulkan donasi
                  toast({
                    title: "Berhasil",
                    description: `Donasi dari ${selectedDonation.user.fullName} sebesar Rp ${selectedDonation.amount.toLocaleString('id-ID')} berhasil dikumpulkan`,
                  });
                  
                  setIsDialogOpen(false);
                  resetCollectionForm();
                }}
              >
                Konfirmasi Pengumpulan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Donation Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Donasi Baru</DialogTitle>
              <DialogDescription>
                Buat donasi baru untuk acara suka
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-name" className="text-right">
                  Nama Acara
                </Label>
                <div className="col-span-3">
                  <Input
                    id="event-name"
                    placeholder="Contoh: Pernikahan Anggota"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="event-date" className="text-right">
                  Tanggal Acara
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !eventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventDate ? format(eventDate, "PPP") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={setEventDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Nominal Donasi
                </Label>
                <div className="col-span-3">
                  <Input
                    id="amount"
                    placeholder="Masukkan nominal donasi sesuai keinginan"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Pilih Anggota
                </Label>
                <div className="col-span-3 border rounded-md p-4 max-h-60 overflow-y-auto">
                  <div className="flex items-center space-x-2 mb-4 pb-2 border-b">
                    <Checkbox 
                      id="select-all" 
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                    <Label htmlFor="select-all">Pilih Semua</Label>
                  </div>
                  {isLoadingMembers ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">Memuat anggota...</span>
                    </div>
                  ) : members && members.length > 0 ? (
                    <div className="space-y-2">
                      {members.map((member: any) => (
                        <div key={member.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`member-${member.id}`} 
                            checked={selectedUserIds.includes(member.id)}
                            onCheckedChange={(checked) => 
                              handleSelectMember(checked as boolean, member.id)
                            }
                          />
                          <Label htmlFor={`member-${member.id}`}>{member.fullName}</Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      Tidak ada anggota tersedia
                    </p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                className="bg-gradient-to-r from-pink-500 to-pink-700 hover:from-pink-600 hover:to-pink-800"
                // onClick={handleCreateDonation}
                disabled={!eventName || !eventDate || !donationAmount || selectedUserIds.length === 0}
              >
                Buat Donasi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Donasi</DialogTitle>
            </DialogHeader>
            {selectedDonation && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Anggota</p>
                    <p className="font-medium">{selectedDonation.user.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Acara</p>
                    <p className="font-medium">{selectedDonation.eventName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tanggal Acara</p>
                    <p className="font-medium">{new Date(selectedDonation.eventDate).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Nominal</p>
                    <p className="font-medium">Rp {selectedDonation.amount.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={selectedDonation.status === "collected" ? 
                      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : 
                      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"}>
                      {selectedDonation.status === "collected" ? "Terkumpul" : "Belum Terkumpul"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
                    <p className="font-medium">{new Date(selectedDonation.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>

                {selectedDonation.status === "collected" && (
                  <>
                    <div className="pt-2 border-t">
                      <h4 className="font-medium mb-2">Informasi Pengumpulan</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Tanggal Pengumpulan</p>
                          <p className="font-medium">{selectedDonation.collectionDate && 
                            new Date(selectedDonation.collectionDate).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Metode Pengumpulan</p>
                          <p className="font-medium">{selectedDonation.collectionMethod}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Dompet</p>
                          <p className="font-medium">{wallets?.find(w => w.id === selectedDonation.walletId)?.name || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {selectedDonation.notes && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Catatan</p>
                        <p className="font-medium">{selectedDonation.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailDialogOpen(false)}>
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}