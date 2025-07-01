import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Coins, Plus, Filter, Download, CheckCircle, AlertCircle, Loader2, Pencil, Trash2 } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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

interface Wallet {
  id: number;
  name: string;
  balance: string;
  description: string | null;
}

export default function FundraisingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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
  const [targetAmount, setTargetAmount] = useState("1000000");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [description, setDescription] = useState("");
  
  // State for edit donation form
  const [editAmount, setEditAmount] = useState("");
  const [editTargetAmount, setEditTargetAmount] = useState("");
  const [editEventName, setEditEventName] = useState("");
  const [editEventDate, setEditEventDate] = useState<Date | undefined>(new Date());
  const [editNotes, setEditNotes] = useState("");

  // Fetch donations data
  const { data: donationsData, isLoading: isLoadingDonations, error: donationsError, refetch } = useQuery<Donation[]>({
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

  // Create donation mutation
  const createDonationMutation = useMutation({
    mutationFn: async (donationData: any) => {
      const response = await fetch('/api/donations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(donationData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create donation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations/type/fundraising"] });
      toast({
        title: "Berhasil",
        description: "Donasi baru berhasil dibuat",
      });
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal membuat donasi",
        variant: "destructive",
      });
    },
  });
  
  // Collect donation mutation
  const collectDonationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/donations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to collect donation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations/type/fundraising"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Berhasil",
        description: `Donasi berhasil dikumpulkan`,
      });
      setIsDialogOpen(false);
      resetCollectionForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal mengumpulkan donasi",
        variant: "destructive",
      });
    },
  });
  
  // Update donation mutation
  const updateDonationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/donations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update donation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations/type/fundraising"] });
      toast({
        title: "Berhasil",
        description: `Donasi berhasil diperbarui`,
      });
      setIsEditDialogOpen(false);
      resetEditForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui donasi",
        variant: "destructive",
      });
    },
  });
  
  // Delete donation mutation
  const deleteDonationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/donations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete donation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/donations/type/fundraising"] });
      toast({
        title: "Berhasil",
        description: `Donasi berhasil dihapus`,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus donasi",
        variant: "destructive",
      });
    },
  });

  // Reset form functions
  const resetCollectionForm = () => {
    setCollectionDate(new Date());
    setCollectionMethod("Transfer Bank");
    setSelectedWalletId(null);
    setNotes("");
  };

  const resetCreateForm = () => {
    setDonationAmount("");
    setTargetAmount("1000000");
    setEventName("");
    setEventDate(new Date());
    setSelectedUserIds([]);
    setSelectAll(false);
    setDescription("");
  };
  
  const resetEditForm = () => {
    setEditAmount("");
    setEditTargetAmount("");
    setEditEventName("");
    setEditEventDate(new Date());
    setEditNotes("");
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
  
  // Handle opening the edit dialog
  const handleOpenEditDialog = (donation: Donation) => {
    setSelectedDonation(donation);
    setEditAmount(donation.amount.toString());
    setEditTargetAmount(donation.targetAmount ? donation.targetAmount.toString() : "");
    setEditEventName(donation.eventName);
    setEditEventDate(donation.eventDate ? new Date(donation.eventDate) : new Date());
    setEditNotes(donation.notes || "");
    setIsEditDialogOpen(true);
  };
  
  // Handle opening the delete dialog
  const handleOpenDeleteDialog = (donation: Donation) => {
    setSelectedDonation(donation);
    setIsDeleteDialogOpen(true);
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
  const filteredDonations = donationsData ? donationsData.filter(donation => {
    const matchesSearch = donation.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         donation.eventName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || donation.status === statusFilter;
    const matchesEvent = eventFilter === "all" || donation.eventName === eventFilter;
    
    return matchesSearch && matchesStatus && matchesEvent;
  }) : [];

  // Calculate statistics
  const totalDonations = donationsData ? donationsData.length : 0;
  const collectedDonations = donationsData ? donationsData.filter(d => d.status === "collected").length : 0;
  const pendingDonations = donationsData ? donationsData.filter(d => d.status === "pending").length : 0;
  const collectionRate = totalDonations > 0 ? (collectedDonations / totalDonations) * 100 : 0;
  const totalAmount = donationsData ? donationsData.reduce((sum, d) => sum + d.amount, 0) : 0;
  const collectedAmount = donationsData
    ? donationsData.filter(d => d.status === "collected").reduce((sum, d) => sum + d.amount, 0)
    : 0;
  const totalTargetAmount = donationsData ? donationsData.reduce((sum, d) => sum + (d.targetAmount || 0), 0) : 0;
  const progressRate = totalTargetAmount > 0 ? (totalAmount / totalTargetAmount) * 100 : 0;

  // Get unique event names for filter
  const uniqueEvents = donationsData ? Array.from(new Set(donationsData.map(d => d.eventName))) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Coins className="mr-2 text-amber-500" />
              Penggalangan Dana
            </h1>
            <p className="text-muted-foreground mt-1">
              Kelola penggalangan dana untuk berbagai kebutuhan organisasi.
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="mt-4 md:mt-0 bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
          >
            <Plus className="mr-2" size={16} />
            Buat Penggalangan Dana Baru
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Penggalangan</p>
                  <h3 className="text-2xl font-bold">{totalDonations}</h3>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                  <Coins className="text-amber-500" size={20} />
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
                  <p className="text-sm font-medium text-muted-foreground">Total Terkumpul</p>
                  <h3 className="text-2xl font-bold">Rp {totalAmount.toLocaleString('id-ID')}</h3>
                </div>
                <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-full">
                  <Coins className="text-amber-500" size={20} />
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
              <Badge variant="outline">{progressRate.toFixed(0)}%</Badge>
            </div>
            <Progress value={progressRate} className="h-2" />
            <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
              <span>Terkumpul: Rp {totalAmount.toLocaleString('id-ID')}</span>
              <span>Target: Rp {totalTargetAmount ? totalTargetAmount.toLocaleString('id-ID') : '0'}</span>
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
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingDonations ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <span className="ml-2">Memuat data donasi...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : donationsError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-center py-8 text-red-500">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Terjadi kesalahan saat memuat data donasi.</p>
                        <p className="text-sm">{donationsError.message}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredDonations.length > 0 ? (
                  filteredDonations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell className="font-medium">{donation.user.fullName}</TableCell>
                      <TableCell>{donation.eventName}</TableCell>
                      <TableCell>{new Date(donation.eventDate).toLocaleDateString('id-ID')}</TableCell>
                      <TableCell>Rp {donation.amount.toLocaleString('id-ID')}</TableCell>
                      <TableCell>Rp {donation.targetAmount ? donation.targetAmount.toLocaleString('id-ID') : '0'}</TableCell>
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
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                onClick={() => handleOpenCollectionDialog(donation)}
                              >
                                Kumpulkan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                onClick={() => handleOpenEditDialog(donation)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleOpenDeleteDialog(donation)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {donation.status === "collected" && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                onClick={() => handleOpenEditDialog(donation)}
                                disabled
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => handleOpenDeleteDialog(donation)}
                                disabled
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data penggalangan dana yang sesuai dengan filter
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
                className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
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
                  
                  const collectionData = {
                    status: "collected",
                    collectionDate: collectionDate.toISOString(),
                    collectionMethod,
                    walletId: selectedWalletId,
                    notes
                  };
                  
                  collectDonationMutation.mutate({ id: selectedDonation.id, data: collectionData });
                }}
                disabled={collectDonationMutation.isPending}
              >
                {collectDonationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi Pengumpulan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Donation Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Buat Penggalangan Dana Baru</DialogTitle>
              <DialogDescription>
                Buat penggalangan dana baru untuk kebutuhan organisasi
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
                    placeholder="Contoh: Pembangunan Balai"
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
                <Label htmlFor="target-amount" className="text-right">
                  Target Dana
                </Label>
                <div className="col-span-3">
                  <Input
                    id="target-amount"
                    placeholder="Target dana yang ingin dikumpulkan"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                  />
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
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Deskripsi
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="description"
                    placeholder="Deskripsi penggalangan dana"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
                onClick={() => {
                  if (!eventName || !eventDate || !donationAmount || !targetAmount || selectedUserIds.length === 0) return;
                  
                  const donationData = {
                    type: "fundraising",
                    eventName,
                    eventDate: eventDate?.toISOString(),
                    amount: parseInt(donationAmount),
                    targetAmount: parseInt(targetAmount),
                    notes: description, // Menggunakan description sebagai notes
                    userIds: selectedUserIds
                  };
                  
                  createDonationMutation.mutate(donationData);
                }}
                disabled={!eventName || !eventDate || !donationAmount || !targetAmount || selectedUserIds.length === 0 || createDonationMutation.isPending}
              >
                {createDonationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Buat Penggalangan Dana"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Penggalangan Dana</DialogTitle>
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
                    <p className="text-sm text-muted-foreground">Target</p>
                    <p className="font-medium">Rp {selectedDonation.targetAmount ? selectedDonation.targetAmount.toLocaleString('id-ID') : '0'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge className={selectedDonation.status === "collected" ? 
                      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : 
                      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"}>
                      {selectedDonation.status === "collected" ? "Terkumpul" : "Belum Terkumpul"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Tanggal Dibuat</p>
                  <p className="font-medium">{new Date(selectedDonation.createdAt).toLocaleDateString('id-ID')}</p>
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
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Penggalangan Dana</DialogTitle>
              <DialogDescription>
                Edit detail penggalangan dana untuk {selectedDonation?.user.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-event-name" className="text-right">
                  Nama Acara
                </Label>
                <div className="col-span-3">
                  <Input
                    id="edit-event-name"
                    placeholder="Contoh: Pembangunan Balai"
                    value={editEventName}
                    onChange={(e) => setEditEventName(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-event-date" className="text-right">
                  Tanggal Acara
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editEventDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editEventDate ? format(editEventDate, "PPP") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={editEventDate}
                        onSelect={setEditEventDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-target-amount" className="text-right">
                  Target Dana
                </Label>
                <div className="col-span-3">
                  <Input
                    id="edit-target-amount"
                    placeholder="Target dana yang ingin dikumpulkan"
                    value={editTargetAmount}
                    onChange={(e) => setEditTargetAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-amount" className="text-right">
                  Nominal Donasi
                </Label>
                <div className="col-span-3">
                  <Input
                    id="edit-amount"
                    placeholder="Masukkan nominal donasi sesuai keinginan"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-notes" className="text-right">
                  Catatan
                </Label>
                <div className="col-span-3">
                  <Textarea
                    id="edit-notes"
                    placeholder="Catatan tambahan (opsional)"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
                onClick={() => {
                  if (!selectedDonation) return;
                  if (!editEventName || !editEventDate || !editAmount) {
                    toast({
                      title: "Error",
                      description: "Semua field wajib harus diisi",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  const updateData = {
                    eventName: editEventName,
                    eventDate: editEventDate.toISOString(),
                    amount: parseInt(editAmount),
                    targetAmount: editTargetAmount ? parseInt(editTargetAmount) : undefined,
                    notes: editNotes || null
                  };
                  
                  updateDonationMutation.mutate({ id: selectedDonation.id, data: updateData });
                }}
                disabled={updateDonationMutation.isPending}
              >
                {updateDonationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Penggalangan Dana</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus penggalangan dana ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  if (!selectedDonation) return;
                  deleteDonationMutation.mutate(selectedDonation.id);
                }}
                disabled={deleteDonationMutation.isPending}
              >
                {deleteDonationMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Hapus"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}