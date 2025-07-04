import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Receipt, Plus, Filter, Download, CheckCircle, AlertCircle } from "lucide-react";
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
import { Loading } from "@/components/ui/loading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Dues {
  id: number;
  userId: number;
  amount: number;
  dueDate: string;
  period: string;
  status: "paid" | "unpaid";
  paymentDate: string | null;
  paymentMethod: string | null;
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

export default function FinanceDuesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDues, setSelectedDues] = useState<Dues | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  
  // State for payment form
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  
  // State for create dues form
  const [dueAmount, setDueAmount] = useState("100000");
  const [duePeriod, setDuePeriod] = useState(format(new Date(), "yyyy-MM"));
  const [dueDate, setDueDate] = useState<Date | undefined>(new Date());
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Fetch dues data
  const { data: duesData, isLoading: isLoadingDues, error: duesError } = useQuery<Dues[]>({
    queryKey: ["/api/dues"],
    queryFn: async () => {
      const res = await fetch("/api/dues", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching dues: ${res.status}`);
      }
      return res.json();
    }
  });

  // Fetch wallets for payment form
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

  // Fetch members for create dues form
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

  // Mutation for updating dues status
  const updateDuesStatusMutation = useMutation({
    mutationFn: async ({ id, status, paymentDate, paymentMethod, walletId, notes }: {
      id: number;
      status: string;
      paymentDate?: Date;
      paymentMethod?: string;
      walletId?: number;
      notes?: string;
    }) => {
      const res = await apiRequest("PUT", `/api/dues/${id}/status`, {
        status,
        paymentDate: paymentDate ? format(paymentDate, "yyyy-MM-dd") : undefined,
        paymentMethod,
        walletId,
        notes
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dues"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Status iuran berhasil diperbarui",
        description: "Status pembayaran iuran telah diperbarui",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui status iuran",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for creating dues
  const createDuesMutation = useMutation({
    mutationFn: async (data: {
      userId: number;
      amount: string; // Mengubah tipe data dari number menjadi string
      dueDate: string;
      period: string;
    }) => {
      const res = await apiRequest("POST", "/api/dues", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dues"] });
      toast({
        title: "Iuran berhasil dibuat",
        description: "Tagihan iuran baru telah dibuat",
      });
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error) => {
      toast({
        title: "Gagal membuat iuran",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle create dues for multiple users
  const handleCreateDues = async () => {
    if (!dueDate) {
      toast({
        title: "Tanggal jatuh tempo diperlukan",
        description: "Silakan pilih tanggal jatuh tempo",
        variant: "destructive",
      });
      return;
    }

    if (selectedUserIds.length === 0) {
      toast({
        title: "Pilih anggota",
        description: "Silakan pilih minimal satu anggota",
        variant: "destructive",
      });
      return;
    }

    // Create dues for each selected user
    const amountValue = parseFloat(dueAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Jumlah iuran tidak valid",
        description: "Silakan masukkan jumlah iuran yang valid",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create dues for each selected user
      for (const userId of selectedUserIds) {
        await createDuesMutation.mutateAsync({
          userId,
          amount: dueAmount, // Kirim sebagai string, bukan number
          dueDate: format(dueDate, "yyyy-MM-dd"),
          period: duePeriod,
        });
      }
    } catch (error) {
      console.error("Error creating dues:", error);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setDueAmount("100000");
    setDuePeriod(format(new Date(), "yyyy-MM"));
    setDueDate(new Date());
    setSelectedUserIds([]);
    setSelectAll(false);
  };

  // Handle mark as paid
  const handleMarkAsPaid = () => {
    if (!selectedDues) return;
    
    if (!selectedWalletId) {
      toast({
        title: "Pilih dompet",
        description: "Silakan pilih dompet untuk menyimpan pembayaran",
        variant: "destructive",
      });
      return;
    }

    updateDuesStatusMutation.mutate({
      id: selectedDues.id,
      status: "paid",
      paymentDate,
      paymentMethod,
      walletId: selectedWalletId,
      notes
    });
  };

  // Handle opening payment dialog
  const openPaymentDialog = (dues: Dues) => {
    setSelectedDues(dues);
    setPaymentDate(new Date());
    setPaymentMethod("Transfer Bank");
    setSelectedWalletId(wallets && wallets.length > 0 ? wallets[0].id : null);
    setNotes("");
    setIsDialogOpen(true);
  };

  // Handle opening detail dialog
  const openDetailDialog = (dues: Dues) => {
    setSelectedDues(dues);
    setIsDetailDialogOpen(true);
  };

  // Calculate summary data
  const calculateSummary = () => {
    if (!duesData) return {
      currentMonth: format(new Date(), "MMMM yyyy"),
      totalMembers: 0,
      paidMembers: 0,
      unpaidMembers: 0,
      dueAmount: 0,
      totalCollected: 0,
      targetAmount: 0,
      collectionRate: 0,
      totalTarget: 0,
    };

    // Get unique periods
    const periods = Array.from(new Set(duesData.map(dues => dues.period)));
    const currentPeriod = periodFilter !== "all" ? periodFilter : (periods.length > 0 ? periods.sort().reverse()[0] : format(new Date(), "yyyy-MM"));
    
    // Filter dues for current period or selected period
    const filteredDuesData = statusFilter !== "all" ? duesData.filter(dues => dues.status === statusFilter) : duesData;
    const currentPeriodDues = periodFilter !== "all" 
      ? filteredDuesData.filter(dues => dues.period === currentPeriod)
      : filteredDuesData;
    
    // Calculate statistics
    const totalMembers = currentPeriodDues.length;
    const paidMembers = currentPeriodDues.filter(dues => dues.status === "paid").length;
    const unpaidMembers = currentPeriodDues.filter(dues => dues.status === "unpaid").length;
    
    // Get due amount (assuming all dues in a period have the same amount)
    const dueAmount = currentPeriodDues.length > 0 ? Number(currentPeriodDues[0].amount) : 0;
    
    // Calculate total collected and target
    const totalCollected = currentPeriodDues.reduce((sum, dues) => 
      dues.status === "paid" ? sum + Number(dues.amount) : sum, 0);
    
    // Calculate total target amount for all periods
    const totalTarget = duesData.reduce((sum, dues) => sum + Number(dues.amount), 0);
    
    // Calculate target amount for current period
    const targetAmount = currentPeriodDues.reduce((sum, dues) => sum + Number(dues.amount), 0);
    
    // Calculate collection rate
    const collectionRate = targetAmount > 0 ? Math.round((totalCollected / targetAmount) * 100) : 0;
    
    // Format current month for display
    let currentMonth = "Semua Periode";
    if (currentPeriod !== "all" && currentPeriod.includes("-")) {
      const [year, month] = currentPeriod.split("-");
      const monthNames = [
        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
      ];
      currentMonth = `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    
    return {
      currentMonth,
      totalMembers,
      paidMembers,
      unpaidMembers,
      dueAmount,
      totalCollected,
      targetAmount,
      collectionRate,
      totalTarget,
    };
  };

  // Get filtered dues
  const getFilteredDues = () => {
    if (!duesData) return [];
    
    return duesData.filter(dues => {
      // Apply search filter
      const matchesSearch = searchTerm === "" || 
        dues.user.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const matchesStatus = statusFilter === "all" || dues.status === statusFilter;
      
      // Apply period filter
      const matchesPeriod = periodFilter === "all" || dues.period === periodFilter;
      
      return matchesSearch && matchesStatus && matchesPeriod;
    });
  };

  // Get unique periods from dues data
  const getUniquePeriods = () => {
    if (!duesData) return [];
    
    const periods = [...new Set(duesData.map(dues => dues.period))];
    return periods.sort().reverse(); // Sort in descending order (newest first)
  };

  // Toggle select all users
  useEffect(() => {
    if (members && selectAll) {
      setSelectedUserIds(members.map((member: { id: number }) => member.id));
    } else if (!selectAll) {
      setSelectedUserIds([]);
    }
  }, [selectAll, members]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-green-500">Lunas</Badge>;
      case "unpaid":
        return <Badge className="bg-red-500">Belum Lunas</Badge>;
      case "partial":
        return <Badge className="bg-yellow-500">Sebagian</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Get summary data
  const summary = calculateSummary();
  const filteredDues = getFilteredDues();
  const uniquePeriods = getUniquePeriods();

  // Fungsi untuk mengekspor data iuran ke CSV (dapat dibuka di Excel)
  const handleExportToExcel = () => {
    if (!duesData || duesData.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data iuran untuk diekspor",
        variant: "destructive",
      });
      return;
    }

    // Membuat header CSV
    const headers = [
      "Nama Anggota",
      "Tanggal Jatuh Tempo",
      "Jumlah",
      "Status",
      "Tanggal Pembayaran",
      "Metode Pembayaran",
      "Catatan"
    ];

    // Mengubah data iuran menjadi format CSV
    const csvData = duesData.map(dues => [
      dues.user.fullName,
      formatDate(dues.dueDate),
      Number(dues.amount),
      dues.status === "paid" ? "Lunas" : "Belum Lunas",
      dues.paymentDate ? formatDate(dues.paymentDate) : "-",
      dues.paymentMethod || "-",
      dues.notes || "-"
    ]);

    // Menggabungkan header dan data
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    // Membuat blob dan link untuk download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `iuran_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Ekspor berhasil",
      description: "Data iuran berhasil diekspor ke CSV",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Iuran</h1>
            <p className="text-muted-foreground mt-1">
              Kelola iuran anggota organisasi di sini.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Buat Tagihan Iuran
            </Button>
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="mr-2 h-4 w-4" /> Ekspor Data
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Iuran {summary.currentMonth}</h3>
                <Receipt className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold mb-2">{formatCurrency(summary.dueAmount)}</p>
              <p className="text-purple-100">per anggota</p>
              <div className="mt-2 pt-2 border-t border-purple-400">
                <p className="text-sm text-purple-100">Target: {formatCurrency(summary.targetAmount)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Total Terkumpul</h3>
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold mb-2">{formatCurrency(summary.totalCollected)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{summary.collectionRate}%</span>
                </div>
                <Progress value={summary.collectionRate} className="h-2 bg-blue-300" />
              </div>
              <div className="mt-2 pt-2 border-t border-blue-400">
                <p className="text-sm text-blue-100">Dari {formatCurrency(summary.targetAmount)}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-500 to-amber-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Status Pembayaran</h3>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{summary.paidMembers}</p>
                  <p className="text-amber-100">Lunas</p>
                </div>
                <div className="text-4xl font-light mx-4">/</div>
                <div>
                  <p className="text-3xl font-bold">{summary.unpaidMembers}</p>
                  <p className="text-amber-100">Belum Lunas</p>
                </div>
                <div className="text-4xl font-light mx-4">/</div>
                <div>
                  <p className="text-3xl font-bold">{summary.totalMembers}</p>
                  <p className="text-amber-100">Total</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-amber-400">
                <div className="flex justify-between text-sm">
                  <span>Persentase Lunas</span>
                  <span>{summary.totalMembers > 0 ? Math.round((summary.paidMembers / summary.totalMembers) * 100) : 0}%</span>
                </div>
                <Progress value={summary.totalMembers > 0 ? (summary.paidMembers / summary.totalMembers) * 100 : 0} className="h-2 bg-amber-300 mt-1" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Cari anggota..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select 
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="unpaid">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
                <Select 
                  value={periodFilter}
                  onValueChange={setPeriodFilter}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Periode</SelectItem>
                    {uniquePeriods.map((period) => {
                      const [year, month] = period.split("-");
                      const monthNames = [
                        "Januari", "Februari", "Maret", "April", "Mei", "Juni",
                        "Juli", "Agustus", "September", "Oktober", "November", "Desember"
                      ];
                      const displayPeriod = `${monthNames[parseInt(month) - 1]} ${year}`;
                      return (
                        <SelectItem key={period} value={period}>
                          {displayPeriod}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Dues Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Iuran Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingDues ? (
              <div className="flex justify-center items-center py-8">
                <Loading variant="dots" text="Memuat data iuran..." />
              </div>
            ) : duesError ? (
              <div className="text-center py-8 text-red-500">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Terjadi kesalahan saat memuat data iuran.</p>
                <p className="text-sm">{duesError.message}</p>
              </div>
            ) : filteredDues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Tidak ada data iuran yang ditemukan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Anggota</TableHead>
                      <TableHead>Tanggal Jatuh Tempo</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead>Tanggal Pembayaran</TableHead>
                      <TableHead>Metode Pembayaran</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDues.map((dues) => (
                      <TableRow key={dues.id}>
                        <TableCell className="font-medium">{dues.user.fullName}</TableCell>
                        <TableCell>{formatDate(dues.dueDate)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(dues.amount))}
                        </TableCell>
                        <TableCell className="text-center">
                          {getStatusBadge(dues.status)}
                        </TableCell>
                        <TableCell>{formatDate(dues.paymentDate)}</TableCell>
                        <TableCell>{dues.paymentMethod || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            {dues.status === "unpaid" ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="bg-green-500 hover:bg-green-600 text-white border-0"
                                onClick={() => openPaymentDialog(dues)}
                              >
                                Tandai Lunas
                              </Button>
                            ) : (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openDetailDialog(dues)}
                              >
                                Detail
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tandai Iuran Sebagai Lunas</DialogTitle>
              <DialogDescription>
                Masukkan informasi pembayaran untuk menandai iuran sebagai lunas.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="member-name" className="text-right">
                  Anggota
                </Label>
                <div className="col-span-3">
                  <Input id="member-name" value={selectedDues?.user.fullName || ""} disabled />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">
                  Jumlah
                </Label>
                <div className="col-span-3">
                  <Input id="amount" value={selectedDues ? formatCurrency(Number(selectedDues.amount)) : ""} disabled />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-date" className="text-right">
                  Tanggal Pembayaran
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !paymentDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {paymentDate ? format(paymentDate, "PPP") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={paymentDate}
                        onSelect={setPaymentDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment-method" className="text-right">
                  Metode Pembayaran
                </Label>
                <div className="col-span-3">
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih metode pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transfer Bank">Transfer Bank</SelectItem>
                      <SelectItem value="Tunai">Tunai</SelectItem>
                      <SelectItem value="QRIS">QRIS</SelectItem>
                      <SelectItem value="E-Wallet">E-Wallet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="wallet" className="text-right">
                  Dompet
                </Label>
                <div className="col-span-3">
                  {isLoadingWallets ? (
                    <div className="flex items-center">
                      <Loading size="sm" variant="dots" text="Memuat dompet..." />
                    </div>
                  ) : (
                    <Select 
                      value={selectedWalletId?.toString() || ""} 
                      onValueChange={(value) => setSelectedWalletId(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dompet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets?.map((wallet) => (
                          <SelectItem key={wallet.id} value={wallet.id.toString()}>
                            {wallet.name} ({formatCurrency(Number(wallet.balance))})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
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
                onClick={handleMarkAsPaid}
                disabled={updateDuesStatusMutation.isPending}
              >
                {updateDuesStatusMutation.isPending && (
                  <Loading size="sm" variant="dots" className="mr-2" />
                )}
                Tandai Lunas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Iuran</DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang iuran anggota.
              </DialogDescription>
            </DialogHeader>
            {selectedDues && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Nama Anggota</Label>
                  <div className="col-span-3">
                    <p>{selectedDues.user.fullName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Periode</Label>
                  <div className="col-span-3">
                    <p>{formatDate(selectedDues.period + "-01")}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Jumlah Iuran</Label>
                  <div className="col-span-3">
                    <p>{formatCurrency(Number(selectedDues.amount))}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Tanggal Jatuh Tempo</Label>
                  <div className="col-span-3">
                    <p>{formatDate(selectedDues.dueDate)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Status</Label>
                  <div className="col-span-3">
                    {getStatusBadge(selectedDues.status)}
                  </div>
                </div>
                {selectedDues.status === "paid" && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right font-medium">Tanggal Pembayaran</Label>
                      <div className="col-span-3">
                        <p>{formatDate(selectedDues.paymentDate)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right font-medium">Metode Pembayaran</Label>
                      <div className="col-span-3">
                        <p>{selectedDues.paymentMethod || "-"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right font-medium">Catatan</Label>
                      <div className="col-span-3">
                        <p>{selectedDues.notes || "-"}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Dibuat Pada</Label>
                  <div className="col-span-3">
                    <p>{formatDate(selectedDues.createdAt)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">Diperbarui Pada</Label>
                  <div className="col-span-3">
                    <p>{formatDate(selectedDues.updatedAt)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Dues Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Buat Tagihan Iuran</DialogTitle>
              <DialogDescription>
                Buat tagihan iuran baru untuk anggota organisasi.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due-amount" className="text-right">
                  Jumlah Iuran
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="due-amount" 
                    placeholder="Masukkan jumlah iuran" 
                    value={dueAmount}
                    onChange={(e) => setDueAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due-period" className="text-right">
                  Periode
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="due-period" 
                    type="month" 
                    value={duePeriod}
                    onChange={(e) => setDuePeriod(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="due-date" className="text-right">
                  Tanggal Jatuh Tempo
                </Label>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Pilih tanggal</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label className="text-right pt-2">
                  Pilih Anggota
                </Label>
                <div className="col-span-3">
                  <div className="flex items-center space-x-2 mb-4">
                    <Checkbox 
                      id="select-all" 
                      checked={selectAll}
                      onCheckedChange={(checked) => setSelectAll(checked === true)}
                    />
                    <label
                      htmlFor="select-all"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Pilih Semua
                    </label>
                  </div>
                  
                  {isLoadingMembers ? (
                    <div className="flex items-center py-4">
                      <Loading size="sm" variant="dots" text="Memuat daftar anggota..." />
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border rounded-md p-2">
                      {members?.map((member) => (
                        <div key={member.id} className="flex items-center space-x-2 py-2 border-b last:border-0">
                          <Checkbox 
                            id={`member-${member.id}`} 
                            checked={selectedUserIds.includes(member.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUserIds([...selectedUserIds, member.id]);
                              } else {
                                setSelectedUserIds(selectedUserIds.filter(id => id !== member.id));
                              }
                            }}
                          />
                          <label
                            htmlFor={`member-${member.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {member.fullName}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleCreateDues}
                disabled={createDuesMutation.isPending}
              >
                {createDuesMutation.isPending && (
                  <Loading size="sm" variant="dots" className="mr-2" />
                )}
                Buat Tagihan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}