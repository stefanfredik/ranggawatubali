import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Plus, ArrowUpDown, ArrowDown, ArrowUp, Check } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export default function FinanceWalletPage() {
  // State untuk dialog tambah dompet
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: "",
    balance: "",
    description: ""
  });

  // State untuk daftar dompet
  const [wallets, setWallets] = useState([
    {
      id: 1,
      name: "Kas Utama",
      balance: 15000000,
      currency: "IDR",
      transactions: 24,
      lastUpdated: "2023-10-15",
      description: "Dompet utama untuk operasional organisasi"
    },
    {
      id: 2,
      name: "Dana Darurat",
      balance: 5000000,
      currency: "IDR",
      transactions: 5,
      lastUpdated: "2023-09-30",
      description: "Dana cadangan untuk keadaan darurat"
    },
    {
      id: 3,
      name: "Dana Kegiatan",
      balance: 7500000,
      currency: "IDR",
      transactions: 12,
      lastUpdated: "2023-10-10",
      description: "Dana khusus untuk kegiatan organisasi"
    }
  ]);

  // Handler untuk input form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewWallet({
      ...newWallet,
      [name]: value
    });
  };

  // Handler untuk submit form
  const handleSubmit = () => {
    // Validasi input
    if (!newWallet.name || !newWallet.balance) {
      alert("Nama dompet dan saldo awal harus diisi!");
      return;
    }

    // Buat dompet baru
    const newWalletData = {
      id: wallets.length + 1,
      name: newWallet.name,
      balance: parseFloat(newWallet.balance),
      currency: "IDR",
      transactions: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      description: newWallet.description || "Dompet baru"
    };

    // Tambahkan ke daftar dompet
    setWallets([...wallets, newWalletData]);

    // Reset form dan tutup dialog
    setNewWallet({ name: "", balance: "", description: "" });
    setIsDialogOpen(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dompet Saldo</h1>
            <p className="text-muted-foreground mt-1">
              Kelola saldo organisasi di sini.
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Dompet
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Tambah Dompet Baru</DialogTitle>
                  <DialogDescription>
                    Buat dompet baru untuk mengelola dana organisasi. Isi detail dompet di bawah ini.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nama
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={newWallet.name}
                      onChange={handleInputChange}
                      placeholder="Nama dompet"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="balance" className="text-right">
                      Saldo Awal
                    </Label>
                    <Input
                      id="balance"
                      name="balance"
                      type="number"
                      value={newWallet.balance}
                      onChange={handleInputChange}
                      placeholder="0"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Deskripsi
                    </Label>
                    <Input
                      id="description"
                      name="description"
                      value={newWallet.description}
                      onChange={handleInputChange}
                      placeholder="Deskripsi dompet (opsional)"
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleSubmit}>
                    <Check className="mr-2 h-4 w-4" /> Simpan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <ArrowUpDown className="mr-2 h-4 w-4" /> Riwayat Transaksi
            </Button>
          </div>
        </div>

        {/* Total Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-blue-100 mb-1">Total Saldo</p>
                <h2 className="text-4xl font-bold">
                  {formatCurrency(wallets.reduce((sum, wallet) => sum + wallet.balance, 0))}
                </h2>
                <p className="text-blue-100 mt-2">Dari {wallets.length} dompet</p>
              </div>
              <div className="flex gap-4">
                <Button className="bg-white/20 hover:bg-white/30 text-white">
                  <ArrowDown className="mr-2 h-4 w-4" /> Pemasukan
                </Button>
                <Button className="bg-white/20 hover:bg-white/30 text-white">
                  <ArrowUp className="mr-2 h-4 w-4" /> Pengeluaran
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <Card key={wallet.id} className="hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <span>{wallet.name}</span>
                  <Wallet className="h-5 w-5 text-blue-500" />
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
                    <Button variant="outline" size="sm" className="flex-1">
                      Detail
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Wallet Card */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Card className="border-dashed hover:shadow-lg transition-all duration-300 flex items-center justify-center cursor-pointer h-[250px]">
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
            </DialogTrigger>
          </Dialog>
        </div>
      </main>
    </div>
  );
}