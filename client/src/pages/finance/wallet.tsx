import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet as WalletIcon, Plus, ArrowUpDown, ArrowDown, ArrowUp, Check, Trash2, Info, Edit as EditIcon } from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { id } from "date-fns/locale";
// Interface untuk data wallet
interface Wallet {
  id: number;
  name: string;
  balance: number;
  description?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  creator?: {
    id: number;
    name: string;
    email: string;
  };
  transactions?: number;
  lastUpdated?: string;
}

export default function FinanceWalletPage() {
  // State untuk dialog tambah dompet
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [newWallet, setNewWallet] = useState({
    name: "",
    balance: "",
    description: ""
  });
  const [editWallet, setEditWallet] = useState({
    name: "",
    balance: "",
    description: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch wallets data
  const { data: wallets, isLoading, error } = useQuery({
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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewWallet({
      ...newWallet,
      [name]: value
    });
  };

  // Mutation for creating a new wallet
  const createWalletMutation = useMutation({
    mutationFn: async (data: { name: string; balance: string; description: string }) => {
      const res = await apiRequest("POST", "/api/wallets", {
        name: data.name,
        balance: parseFloat(data.balance),
        description: data.description || "Dompet baru"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Dompet berhasil dibuat",
        description: "Dompet baru telah ditambahkan ke daftar",
      });
      // Reset form dan tutup dialog
      setNewWallet({ name: "", balance: "", description: "" });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal membuat dompet",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for updating a wallet
  const updateWalletMutation = useMutation({
    mutationFn: async (data: { id: number; name: string; description: string }) => {
      const res = await apiRequest("PUT", `/api/wallets/${data.id}`, {
        name: data.name,
        description: data.description || "Dompet"
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Dompet berhasil diperbarui",
        description: "Informasi dompet telah diperbarui",
      });
      // Reset form dan tutup dialog
      setEditWallet({ name: "", balance: "", description: "" });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal memperbarui dompet",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation for deleting a wallet
  const deleteWalletMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/wallets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallets"] });
      toast({
        title: "Dompet berhasil dihapus",
        description: "Dompet telah dihapus dari sistem",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Gagal menghapus dompet",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handler untuk submit form tambah dompet
  const handleSubmit = () => {
    // Validasi input
    if (!newWallet.name || !newWallet.balance) {
      toast({
        title: "Input tidak lengkap",
        description: "Nama dompet dan saldo awal harus diisi!",
        variant: "destructive",
      });
      return;
    }

    // Kirim data ke server
    createWalletMutation.mutate(newWallet);
  };

  // Handler untuk submit form edit dompet
  const handleEditSubmit = () => {
    // Validasi input
    if (!editWallet.name) {
      toast({
        title: "Input tidak lengkap",
        description: "Nama dompet harus diisi!",
        variant: "destructive",
      });
      return;
    }

    if (!selectedWallet) return;

    // Kirim data ke server
    updateWalletMutation.mutate({
      id: selectedWallet.id,
      name: editWallet.name,
      description: editWallet.description
    });
  };

  // Handler untuk hapus dompet
  const handleDelete = () => {
    if (!selectedWallet) return;
    deleteWalletMutation.mutate(selectedWallet.id);
  };

  // Handler untuk membuka dialog detail
  const handleOpenDetail = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setIsDetailDialogOpen(true);
  };

  // Handler untuk membuka dialog edit
  const handleOpenEdit = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    setEditWallet({
      name: wallet.name,
      balance: wallet.balance.toString(),
      description: wallet.description || ""
    });
    setIsEditDialogOpen(true);
  };

  // Handler untuk membuka dialog hapus
  const handleOpenDelete = (wallet: Wallet) => {
    setSelectedWallet(wallet);
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
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate total balance
  const totalBalance = wallets?.reduce((sum, wallet) => {
    // Pastikan balance dikonversi ke number
    const walletBalance = typeof wallet.balance === 'string' 
      ? parseFloat(wallet.balance) 
      : Number(wallet.balance);
    return sum + walletBalance;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
        <NavHeader />
        <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="mb-8">
            <Skeleton className="h-32 w-full mb-6" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
        <NavHeader />
        <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error</h3>
            <p className="mt-2 text-red-700 dark:text-red-400">{(error as Error).message}</p>
            <Button 
              className="mt-4" 
              variant="outline" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/wallets"] })}
            >
              Coba lagi
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dompet</h1>
            <p className="text-muted-foreground mt-1">
              Kelola dompet dan saldo organisasi
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Tambah Dompet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Dompet Baru</DialogTitle>
                <DialogDescription>
                  Buat dompet baru untuk mengelola dana organisasi
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nama Dompet</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Contoh: Kas Utama"
                    value={newWallet.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="balance">Saldo Awal</Label>
                  <Input
                    id="balance"
                    name="balance"
                    type="number"
                    placeholder="0"
                    value={newWallet.balance}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Deskripsi (Opsional)</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Deskripsi singkat tentang dompet ini"
                    value={newWallet.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleSubmit} disabled={createWalletMutation.isPending}>
                  {createWalletMutation.isPending ? (
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
        </div>

        {/* Total Balance Card */}
        <Card className="mb-8 bg-background bg-opacity-50 backdrop-blur-sm border border-border/50 shadow-sm rounded-lg border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-medium text-muted-foreground">Total Saldo</h2>
                <p className="text-4xl font-bold mt-2">{formatCurrency(totalBalance)}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Semua Transaksi
                </Button>
                <Button variant="outline" className="gap-2">
                  <ArrowUp className="h-4 w-4 text-green-500" />
                  Pemasukan
                </Button>
                <Button variant="outline" className="gap-2">
                  <ArrowDown className="h-4 w-4 text-red-500" />
                  Pengeluaran
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>{wallet.name}</span>
                  <WalletIcon className="h-5 w-5 text-blue-500" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Saldo</p>
                    <p className="text-2xl font-bold">{formatCurrency(wallet.balance)}</p>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-muted-foreground">Transaksi</p>
                      <p>{wallet.transactions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Terakhir Diperbarui</p>
                      <p>{wallet.lastUpdated}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => handleOpenDetail(wallet)}
                    >
                      <Info className="h-4 w-4" />
                      Detail
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1"
                      onClick={() => handleOpenEdit(wallet)}
                    >
                      <EditIcon className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-1 text-red-500 hover:text-red-600"
                      onClick={() => handleOpenDelete(wallet)}
                      title="Hapus dompet"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Wallet Card */}
          <Card className="border-dashed hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer h-[250px]" onClick={() => setIsDialogOpen(true)}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mb-4">
                <Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Tambah Dompet Baru</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Buat dompet baru untuk mengelola dana organisasi
              </p>
              <Button variant="outline">
                Tambah Dompet
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detail Wallet Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detail Dompet</DialogTitle>
              <DialogDescription>
                Informasi lengkap tentang dompet
              </DialogDescription>
            </DialogHeader>
            {selectedWallet && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label>Nama Dompet</Label>
                  <div className="p-2 bg-muted rounded-md">{selectedWallet.name}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Saldo</Label>
                  <div className="p-2 bg-muted rounded-md font-bold">{formatCurrency(selectedWallet.balance)}</div>
                </div>
                <div className="grid gap-2">
                  <Label>Deskripsi</Label>
                  <div className="p-2 bg-muted rounded-md">{selectedWallet.description || "-"}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Dibuat Oleh</Label>
                    <div className="p-2 bg-muted rounded-md">{selectedWallet.creator?.name || "-"}</div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Dibuat Pada</Label>
                    <div className="p-2 bg-muted rounded-md">
                      {selectedWallet.createdAt ? formatDate(selectedWallet.createdAt) : "-"}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Terakhir Diperbarui</Label>
                  <div className="p-2 bg-muted rounded-md">
                    {selectedWallet.updatedAt ? formatDate(selectedWallet.updatedAt) : "-"}
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Wallet Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Dompet</DialogTitle>
              <DialogDescription>
                Perbarui informasi dompet
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nama Dompet</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="Contoh: Kas Utama"
                  value={editWallet.name}
                  onChange={(e) => setEditWallet({...editWallet, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-balance">Saldo</Label>
                <Input
                  id="edit-balance"
                  name="balance"
                  disabled
                  value={editWallet.balance}
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Saldo hanya dapat diubah melalui transaksi</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Deskripsi</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  placeholder="Deskripsi singkat tentang dompet ini"
                  value={editWallet.description}
                  onChange={(e) => setEditWallet({...editWallet, description: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleEditSubmit} disabled={updateWalletMutation.isPending}>
                {updateWalletMutation.isPending ? (
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

        {/* Delete Wallet Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Dompet</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus dompet "{selectedWallet?.name}"? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600"
                disabled={deleteWalletMutation.isPending}
              >
                {deleteWalletMutation.isPending ? (
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