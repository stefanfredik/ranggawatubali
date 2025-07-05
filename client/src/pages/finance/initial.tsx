import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Plus, Filter, Download, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface InitialFee {
  id: number;
  userId: number;
  amount: number;
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

export default function FinanceInitialPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInitialFee, setSelectedInitialFee] = useState<InitialFee | null>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // State for payment form
  const [paymentDate, setPaymentDate] = useState<Date | undefined>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("Transfer Bank");
  const [selectedWalletId, setSelectedWalletId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  
  // State for create initial fee form
  const [initialFeeAmount, setInitialFeeAmount] = useState("500000");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [createForAllMembers, setCreateForAllMembers] = useState(false);

  // Fetch initial fees data
  const { data: initialFeesData, isLoading: isLoadingInitialFees, error: initialFeesError } = useQuery<InitialFee[]>({
    queryKey: ["/api/initial-fees"],
    queryFn: async () => {
      const res = await fetch("/api/initial-fees", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching initial fees: ${res.status}`);
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

  // Fetch members for create initial fee form
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

  // Mutation for updating initial fee status
  const updateInitialFeeStatusMutation = useMutation({
    mutationFn: async ({ id, status, paymentDate, paymentMethod, walletId, notes }: {
      id: number;
      status: string;
      paymentDate?: Date;
      paymentMethod?: string;
      walletId?: number;
      notes?: string;
    }) => {
      const res = await apiRequest("PUT", `/api/initial-fees/${id}/status`, {
        status,
        paymentDate: paymentDate ? format(paymentDate, "yyyy-MM-dd") : undefined,
        paymentMethod,
        walletId,
        notes
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initial-fees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Status uang pangkal berhasil diperbarui",
        description: "Status pembayaran uang pangkal telah diperbarui",
      });
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Gagal memperbarui status uang pangkal",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for creating initial fee
  const createInitialFeeMutation = useMutation({
    mutationFn: async (data: {
      userId: number;
      amount: string;
    }) => {
      const res = await apiRequest("POST", "/api/initial-fees", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/initial-fees"] });
      toast({
        title: "Uang pangkal berhasil dibuat",
        description: "Tagihan uang pangkal baru telah dibuat",
      });
      setIsCreateDialogOpen(false);
      resetCreateForm();
    },
    onError: (error) => {
      toast({
        title: "Gagal membuat uang pangkal",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle create initial fee
  const handleCreateInitialFee = async () => {
    if (!createForAllMembers && !selectedUserId) {
      toast({
        title: "Pilih anggota",
        description: "Silakan pilih anggota atau gunakan opsi 'Semua Anggota'",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(initialFeeAmount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Jumlah uang pangkal tidak valid",
        description: "Silakan masukkan jumlah uang pangkal yang valid",
        variant: "destructive",
      });
      return;
    }

    try {
      if (createForAllMembers && members) {
        // Konfirmasi jika jumlah anggota banyak
        if (members.length > 10) {
          const confirmed = window.confirm(
            `Anda akan membuat tagihan uang pangkal untuk ${members.length} anggota. Lanjutkan?`
          );
          if (!confirmed) return;
        }

        // Buat uang pangkal untuk semua anggota
        for (const member of members) {
          await createInitialFeeMutation.mutateAsync({
            userId: member.id,
            amount: initialFeeAmount,
          });
        }
        toast({
          title: "Uang pangkal berhasil dibuat",
          description: `Tagihan uang pangkal telah dibuat untuk ${members.length} anggota`,
        });
        setIsCreateDialogOpen(false);
        resetCreateForm();
      } else {
        // Buat uang pangkal untuk satu anggota
        await createInitialFeeMutation.mutateAsync({
          userId: selectedUserId!,
          amount: initialFeeAmount,
        });
      }
    } catch (error) {
      console.error("Error creating initial fee:", error);
    }
  };

  // Reset create form
  const resetCreateForm = () => {
    setInitialFeeAmount("500000");
    setSelectedUserId(null);
    setCreateForAllMembers(false);
  };

  // Handle mark as paid
  const handleMarkAsPaid = () => {
    if (!selectedInitialFee) return;
    
    if (!selectedWalletId) {
      toast({
        title: "Pilih dompet",
        description: "Silakan pilih dompet untuk menyimpan pembayaran",
        variant: "destructive",
      });
      return;
    }

    updateInitialFeeStatusMutation.mutate({
      id: selectedInitialFee.id,
      status: "paid",
      paymentDate,
      paymentMethod,
      walletId: selectedWalletId,
      notes
    });
  };

  // Handle opening payment dialog
  const openPaymentDialog = (initialFee: InitialFee) => {
    setSelectedInitialFee(initialFee);
    setPaymentDate(new Date());
    setPaymentMethod("Transfer Bank");
    setSelectedWalletId(wallets && wallets.length > 0 ? wallets[0].id : null);
    setNotes("");
    setIsDialogOpen(true);
  };

  // Handle opening detail dialog
  const openDetailDialog = (initialFee: InitialFee) => {
    setSelectedInitialFee(initialFee);
    setIsDetailDialogOpen(true);
  };

  // Calculate summary data
  const calculateSummary = () => {
    if (!initialFeesData) return {
      feeAmount: 500000,
      totalMembers: 0,
      paidMembers: 0,
      unpaidMembers: 0,
      totalCollected: 0,
      targetAmount: 0,
      collectionRate: 0,
    };

    const feeAmount = initialFeesData.length > 0 ? Number(initialFeesData[0].amount) : 500000;
    const totalMembers = initialFeesData.length;
    const paidMembers = initialFeesData.filter(fee => fee.status === "paid").length;
    const unpaidMembers = totalMembers - paidMembers;
    const totalCollected = initialFeesData
      .filter(fee => fee.status === "paid")
      .reduce((sum, fee) => sum + Number(fee.amount), 0);
    const targetAmount = totalMembers * feeAmount;
    const collectionRate = totalMembers > 0 ? (totalCollected / targetAmount) * 100 : 0;

    return {
      feeAmount,
      totalMembers,
      paidMembers,
      unpaidMembers,
      totalCollected,
      targetAmount,
      collectionRate,
    };
  };

  // Get filtered initial fees
  const getFilteredInitialFees = () => {
    if (!initialFeesData) return [];

    return initialFeesData.filter(fee => {
      const matchesSearch = searchTerm === "" || 
        fee.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.user.username.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || fee.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  };

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
  const filteredInitialFees = getFilteredInitialFees();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Uang Pangkal</h1>
            <p className="text-muted-foreground mt-1">
              Kelola uang pangkal anggota organisasi di sini.
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" /> Tambah Uang Pangkal
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Ekspor Data
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="glass" className="bg-gradient-to-r from-amber-500 to-amber-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Uang Pangkal</h3>
                <PiggyBank className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold mb-2">{formatCurrency(summary.feeAmount)}</p>
              <p className="text-amber-100">per anggota baru</p>
            </CardContent>
          </Card>

          <Card variant="glass" className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Total Terkumpul</h3>
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold mb-2">{formatCurrency(summary.totalCollected)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{summary.collectionRate.toFixed(0)}%</span>
                </div>
                <Progress value={summary.collectionRate} className="h-2 bg-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card variant="glass" className="bg-gradient-to-r from-green-500 to-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Status Pembayaran</h3>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{summary.paidMembers}</p>
                  <p className="text-green-100">Lunas</p>
                </div>
                <div className="text-4xl font-light mx-4">/</div>
                <div>
                  <p className="text-3xl font-bold">{summary.unpaidMembers}</p>
                  <p className="text-green-100">Belum Lunas</p>
                </div>
                <div className="text-4xl font-light mx-4">/</div>
                <div>
                  <p className="text-3xl font-bold">{summary.totalMembers}</p>
                  <p className="text-green-100">Total Anggota</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card variant="glass" className="mb-6">
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
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members Initial Fees Table */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Daftar Uang Pangkal Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingInitialFees ? (
              <div className="flex justify-center items-center py-8">
                <Loading variant="dots" size="lg" text="Memuat data..." />
              </div>
            ) : initialFeesError ? (
              <div className="text-center py-8 text-red-500">
                <p>Terjadi kesalahan saat memuat data.</p>
                <p className="text-sm">{initialFeesError.message}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Nama Anggota</th>
                      <th className="text-right py-3 px-4">Jumlah</th>
                      <th className="text-center py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Tanggal Pembayaran</th>
                      <th className="text-left py-3 px-4">Metode Pembayaran</th>
                      <th className="text-center py-3 px-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInitialFees.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-muted-foreground">
                          Tidak ada data uang pangkal yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      filteredInitialFees.map((fee) => (
                        <tr key={fee.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{fee.user.fullName}</td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(Number(fee.amount))}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {getStatusBadge(fee.status)}
                          </td>
                          <td className="py-3 px-4">{formatDate(fee.paymentDate)}</td>
                          <td className="py-3 px-4">{fee.paymentMethod || "-"}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2">
                              {fee.status === "unpaid" ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600 text-white border-0"
                                  onClick={() => openPaymentDialog(fee)}
                                >
                                  Tandai Lunas
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openDetailDialog(fee)}
                                >
                                  Detail
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tandai Uang Pangkal Lunas</DialogTitle>
              <DialogDescription>
                Masukkan informasi pembayaran untuk menandai uang pangkal sebagai lunas.
              </DialogDescription>
            </DialogHeader>
            {selectedInitialFee && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Anggota</Label>
                  <div className="col-span-3">
                    <p>{selectedInitialFee.user.fullName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Jumlah</Label>
                  <div className="col-span-3">
                    <p>{formatCurrency(Number(selectedInitialFee.amount))}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment-date" className="text-right">Tanggal Pembayaran</Label>
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
                      <PopoverContent className="w-auto p-0" align="start">
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
                  <Label htmlFor="payment-method" className="text-right">Metode Pembayaran</Label>
                  <Select
                    value={paymentMethod}
                    onValueChange={setPaymentMethod}
                  >
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="wallet" className="text-right">Dompet</Label>
                  {isLoadingWallets ? (
                    <div className="col-span-3 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Memuat dompet...</span>
                    </div>
                  ) : (
                    <Select
                      value={selectedWalletId?.toString() || ""}
                      onValueChange={(value) => setSelectedWalletId(parseInt(value))}
                    >
                      <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">Catatan</Label>
                  <Textarea
                    id="notes"
                    placeholder="Catatan tambahan (opsional)"
                    className="col-span-3"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button onClick={handleMarkAsPaid} disabled={updateInitialFeeStatusMutation.isPending}>
                {updateInitialFeeStatusMutation.isPending && (
                  <Loading variant="dots" size="sm" />
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
              <DialogTitle>Detail Uang Pangkal</DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang uang pangkal anggota.
              </DialogDescription>
            </DialogHeader>
            {selectedInitialFee && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Anggota</Label>
                  <div className="col-span-3">
                    <p>{selectedInitialFee.user.fullName}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Jumlah</Label>
                  <div className="col-span-3">
                    <p>{formatCurrency(Number(selectedInitialFee.amount))}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3">
                    {getStatusBadge(selectedInitialFee.status)}
                  </div>
                </div>
                {selectedInitialFee.status === "paid" && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Tanggal Pembayaran</Label>
                      <div className="col-span-3">
                        <p>{formatDate(selectedInitialFee.paymentDate)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Metode Pembayaran</Label>
                      <div className="col-span-3">
                        <p>{selectedInitialFee.paymentMethod}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right">Catatan</Label>
                      <div className="col-span-3">
                        <p>{selectedInitialFee.notes || "-"}</p>
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Tanggal Dibuat</Label>
                  <div className="col-span-3">
                    <p>{formatDate(selectedInitialFee.createdAt)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Terakhir Diperbarui</Label>
                  <div className="col-span-3">
                    <p>{formatDate(selectedInitialFee.updatedAt)}</p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Initial Fee Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Uang Pangkal</DialogTitle>
              <DialogDescription>
                Buat tagihan uang pangkal baru untuk anggota.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Jumlah</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Masukkan jumlah"
                  className="col-span-3"
                  value={initialFeeAmount}
                  onChange={(e) => setInitialFeeAmount(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="createForAll" className="text-right">Untuk</Label>
                <div className="col-span-3">
                  <div className="flex items-center space-x-2 mb-4">
                    <input
                      type="checkbox"
                      id="createForAll"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={createForAllMembers}
                      onChange={(e) => {
                        setCreateForAllMembers(e.target.checked);
                        if (e.target.checked) {
                          setSelectedUserId(null);
                        }
                      }}
                    />
                    <Label htmlFor="createForAll" className="cursor-pointer">
                      Buat untuk semua anggota
                    </Label>
                  </div>
                </div>
              </div>

              {!createForAllMembers && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="member" className="text-right">Anggota</Label>
                  {isLoadingMembers ? (
                    <div className="col-span-3 flex items-center">
                      <Loading variant="dots" size="sm" text="Memuat anggota..." />
                    </div>
                  ) : (
                    <Select
                      value={selectedUserId?.toString() || ""}
                      onValueChange={(value) => setSelectedUserId(parseInt(value))}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Pilih anggota" />
                      </SelectTrigger>
                      <SelectContent>
                        {members?.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
              
              {createForAllMembers && members && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Jumlah Anggota</Label>
                  <div className="col-span-3">
                    <Badge variant="secondary" className="text-sm">
                      {members.length} anggota akan ditagih
                    </Badge>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Batal</Button>
              <Button onClick={handleCreateInitialFee} disabled={createInitialFeeMutation.isPending}>
                {createInitialFeeMutation.isPending && (
                  <Loading variant="dots" size="sm" />
                )}
                Buat Uang Pangkal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}