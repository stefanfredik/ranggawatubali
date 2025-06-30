import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, Plus, Filter, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Interface untuk data transaksi
interface Transaction {
  id: number;
  walletId: number;
  amount: number;
  type: string;
  category: string;
  description: string;
  date: string;
  createdBy: number;
  createdAt: string;
  wallet: {
    id: number;
    name: string;
  };
  creator: {
    id: number;
    name: string;
  };
}

export default function FinanceIncomePage() {
  // State untuk filter dan pencarian
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  
  // State untuk dialog tambah transaksi
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [newTransaction, setNewTransaction] = useState({
    walletId: "",
    amount: "",
    category: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd")
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch transactions data
  const { data: transactions, isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching transactions: ${res.status}`);
      }
      const data = await res.json();
      // Filter hanya transaksi pemasukan
      return data.filter((tx: Transaction) => tx.type === "income");
    },
  });

  // Fetch wallets data for dropdown
  const { data: wallets } = useQuery({
    queryKey: ["/api/wallets"],
    queryFn: async () => {
      const res = await fetch("/api/wallets", {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching wallets: ${res.status}`);
      }
      return res.json();
    },
  });

  // Handler untuk input form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTransaction({
      ...newTransaction,
      [name]: value
    });
  };

  // Mutation for creating a new transaction
  const createTransactionMutation = useMutation({
    mutationFn: async (data: { walletId: string; amount: string; category: string; description: string; date: string }) => {
      const res = await apiRequest("POST", "/api/transactions", {
        walletId: parseInt(data.walletId),
        amount: data.amount, // Kirim sebagai string, bukan parseFloat
        type: "income",
        category: data.category,
        description: data.description,
        date: data.date
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Pemasukan berhasil ditambahkan",
        description: "Data pemasukan baru telah disimpan",
      });
      // Reset form dan tutup dialog
      setNewTransaction({
        walletId: "",
        amount: "",
        category: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd")
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal menambahkan pemasukan",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting a transaction
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Pemasukan berhasil dihapus",
        description: "Data pemasukan telah dihapus dari sistem",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal menghapus pemasukan",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handler untuk submit form tambah transaksi
  const handleSubmit = () => {
    // Validasi input
    if (!newTransaction.walletId || !newTransaction.amount || !newTransaction.category || !newTransaction.date) {
      toast({
        title: "Input tidak lengkap",
        description: "Dompet, jumlah, kategori, dan tanggal harus diisi!",
        variant: "destructive",
      });
      return;
    }

    // Kirim data ke server
    createTransactionMutation.mutate(newTransaction);
  };

  // Handler untuk hapus transaksi
  const handleDelete = () => {
    if (!selectedTransaction) return;
    deleteTransactionMutation.mutate(selectedTransaction.id);
  };

  // Handler untuk membuka dialog hapus
  const handleOpenDelete = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
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
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Selesai</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Tertunda</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500">Dibatalkan</Badge>;
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  // Filter transactions
  const filteredTransactions = transactions ? transactions.filter((transaction: Transaction) => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    const matchesWallet = walletFilter === "all" || transaction.wallet.id.toString() === walletFilter;
    
    return matchesSearch && matchesCategory && matchesWallet;
  }) : [];

  // Get unique categories
  const categories = transactions ? [...new Set(transactions.map((tx: Transaction) => tx.category))] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pemasukan</h1>
            <p className="text-muted-foreground mt-1">
              Kelola pemasukan dana organisasi di sini.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Pemasukan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pemasukan Baru</DialogTitle>
                  <DialogDescription>
                    Tambahkan data pemasukan baru ke dalam sistem
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="walletId">Dompet Tujuan</Label>
                    <Select name="walletId" value={newTransaction.walletId} onValueChange={(value) => handleInputChange({ target: { name: "walletId", value } } as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dompet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets?.map((wallet: any) => (
                          <SelectItem key={wallet.id} value={wallet.id.toString()}>
                            {wallet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="amount">Jumlah</Label>
                    <Input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="0"
                      value={newTransaction.amount}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Select name="category" value={newTransaction.category} onValueChange={(value) => handleInputChange({ target: { name: "category", value } } as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Iuran">Iuran</SelectItem>
                        <SelectItem value="Donasi">Donasi</SelectItem>
                        <SelectItem value="Uang Pangkal">Uang Pangkal</SelectItem>
                        <SelectItem value="Sumbangan">Sumbangan</SelectItem>
                        <SelectItem value="Lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Tanggal</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={newTransaction.date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Deskripsi</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Deskripsi singkat tentang pemasukan ini"
                      value={newTransaction.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleSubmit} disabled={createTransactionMutation.isPending}>
                    {createTransactionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>Simpan</>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Ekspor Data
            </Button>
          </div>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 bg-gradient-to-r from-green-500 to-green-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-green-100 mb-1">Total Pemasukan</p>
                <h2 className="text-4xl font-bold">
                  {formatCurrency(filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0))}
                </h2>
                <p className="text-green-100 mt-2">Dari {filteredTransactions.length} transaksi</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 p-4 rounded-lg">
                  <p className="text-green-100 text-sm">Bulan Ini</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      filteredTransactions
                        .filter(tx => {
                          const txDate = new Date(tx.date);
                          const now = new Date();
                          return txDate.getMonth() === now.getMonth() && 
                                 txDate.getFullYear() === now.getFullYear();
                        })
                        .reduce((sum, tx) => sum + Number(tx.amount), 0)
                    )}
                  </p>
                </div>
                <div className="bg-white/20 p-4 rounded-lg">
                  <p className="text-green-100 text-sm">Tahun Ini</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(
                      filteredTransactions
                        .filter(tx => {
                          const txDate = new Date(tx.date);
                          const now = new Date();
                          return txDate.getFullYear() === now.getFullYear();
                        })
                        .reduce((sum, tx) => sum + Number(tx.amount), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Cari transaksi..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={walletFilter} onValueChange={setWalletFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Dompet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dompet</SelectItem>
                    {wallets?.map((wallet: any) => (
                      <SelectItem key={wallet.id} value={wallet.id.toString()}>{wallet.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setWalletFilter("all");
                  }}
                >
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Transaksi Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Tanggal</th>
                    <th className="text-left py-3 px-4">Deskripsi</th>
                    <th className="text-left py-3 px-4">Kategori</th>
                    <th className="text-left py-3 px-4">Dompet</th>
                    <th className="text-right py-3 px-4">Jumlah</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">Memuat data...</td>
                    </tr>
                  ) : filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">Tidak ada data pemasukan</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                        <td className="py-3 px-4">{transaction.description}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800">
                            {transaction.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{transaction.wallet.name}</td>
                        <td className="py-3 px-4 text-right font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(Number(transaction.amount))}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-red-500"
                              onClick={() => handleOpenDelete(transaction)}
                            >
                              <span className="sr-only">Delete</span>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <path d="M3 6h18" />
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                <line x1="10" x2="10" y1="11" y2="17" />
                                <line x1="14" x2="14" y1="11" y2="17" />
                              </svg>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Delete Transaction Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Pemasukan</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus transaksi pemasukan ini? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
                disabled={deleteTransactionMutation.isPending}
              >
                {deleteTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>Hapus</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}