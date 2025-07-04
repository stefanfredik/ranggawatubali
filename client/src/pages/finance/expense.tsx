import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Download } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function FinanceExpensePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<any>(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [walletFilter, setWalletFilter] = useState("all");
  
  // State for new transaction form
  const [newTransaction, setNewTransaction] = useState({
    walletId: "",
    amount: "",
    type: "expense", // Always expense for this page
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  
  // Categories for expenses
  const categories = [
    "Sewa",
    "Konsumsi",
    "Perlengkapan",
    "Transportasi",
    "Utilitas",
    "Lainnya"
  ];
  
  // Handle input change for the form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: async () => {
      const res = await fetch("/api/transactions", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch transactions");
      return res.json();
    }
  });
  
  // Fetch wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ["/api/wallets"],
    queryFn: async () => {
      const res = await fetch("/api/wallets", {
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to fetch wallets");
      return res.json();
    }
  });
  
  // Filter transactions to only show expenses
  const expenseTransactions = transactions.filter((tx: any) => tx.type === "expense");

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: typeof newTransaction) => {
      const res = await apiRequest("POST", "/api/transactions", {
        ...data,
        walletId: parseInt(data.walletId),
        amount: String(data.amount) // Ensure amount is sent as string
      });
      return res;
    },
    onSuccess: () => {
      setIsDialogOpen(false);
      setNewTransaction({
        walletId: "",
        amount: "",
        type: "expense",
        category: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Berhasil",
        description: "Pengeluaran berhasil ditambahkan",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menambahkan pengeluaran",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    },
  });

  // Delete transaction mutation
  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/transactions/${id}`);
      return res;
    },
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setTransactionToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Berhasil",
        description: "Pengeluaran berhasil dihapus",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal menghapus pengeluaran",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    if (!newTransaction.walletId) {
      toast({
        title: "Validasi gagal",
        description: "Pilih dompet terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!newTransaction.amount || parseFloat(newTransaction.amount) <= 0) {
      toast({
        title: "Validasi gagal",
        description: "Jumlah harus lebih dari 0",
        variant: "destructive",
      });
      return;
    }

    if (!newTransaction.category) {
      toast({
        title: "Validasi gagal",
        description: "Pilih kategori terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    createTransactionMutation.mutate(newTransaction);
  };

  // Handle delete
  const handleOpenDelete = (transaction: any) => {
    setTransactionToDelete(transaction);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (transactionToDelete) {
      deleteTransactionMutation.mutate(transactionToDelete.id);
    }
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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  // Filter transactions based on search and filters
  const filteredTransactions = expenseTransactions.filter((transaction: any) => {
    const matchesSearch = searchTerm === "" || 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    
    const matchesWallet = walletFilter === "all" || transaction.walletId.toString() === walletFilter;
    
    return matchesSearch && matchesCategory && matchesWallet;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Pengeluaran</h1>
            <p className="text-muted-foreground mt-1">
              Kelola pengeluaran dana organisasi di sini.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Pengeluaran
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah Pengeluaran Baru</DialogTitle>
                  <DialogDescription>
                    Masukkan detail pengeluaran baru di bawah ini.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="walletId">Dompet</Label>
                    <Select name="walletId" value={newTransaction.walletId} onValueChange={(value) => handleInputChange({ target: { name: "walletId", value } } as any)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih dompet" />
                      </SelectTrigger>
                      <SelectContent>
                        {wallets?.map((wallet: any) => (
                          <SelectItem key={wallet.id} value={wallet.id.toString()}>{wallet.name}</SelectItem>
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
                      placeholder="Contoh: 100000"
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
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
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
                      placeholder="Deskripsi singkat tentang pengeluaran ini"
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
                        <Loading variant="dots" size="sm" text="Menyimpan..." />
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
        <Card className="mb-8 bg-gradient-to-r from-red-500 to-red-700 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-red-100 mb-1">Total Pengeluaran</p>
                <h2 className="text-4xl font-bold">
                  {formatCurrency(filteredTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0))}
                </h2>
                <p className="text-red-100 mt-2">Dari {filteredTransactions.length} transaksi</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 p-4 rounded-lg">
                  <p className="text-red-100 text-sm">Bulan Ini</p>
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
                  <p className="text-red-100 text-sm">Tahun Ini</p>
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
            <CardTitle>Daftar Transaksi Pengeluaran</CardTitle>
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
                      <td colSpan={6} className="text-center py-4">Tidak ada data pengeluaran</td>
                    </tr>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                        <td className="py-3 px-4">{transaction.description}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border-red-200 dark:border-red-800">
                            {transaction.category}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">{transaction.wallet.name}</td>
                        <td className="py-3 px-4 text-right font-medium text-red-600 dark:text-red-400">
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
              <AlertDialogTitle>Hapus Pengeluaran</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus transaksi pengeluaran ini? Tindakan ini tidak dapat dibatalkan.
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
                    <Loading variant="dots" size="sm" text="Menghapus..." />
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