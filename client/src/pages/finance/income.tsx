import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, Plus, Filter, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FinanceIncomePage() {
  // Dummy data for income transactions
  const incomeTransactions = [
    {
      id: 1,
      date: "2023-10-15",
      description: "Iuran Bulanan Oktober",
      category: "Iuran",
      amount: 5000000,
      wallet: "Kas Utama",
      status: "completed"
    },
    {
      id: 2,
      date: "2023-10-10",
      description: "Donasi Kegiatan Sosial",
      category: "Donasi",
      amount: 2500000,
      wallet: "Dana Kegiatan",
      status: "completed"
    },
    {
      id: 3,
      date: "2023-10-05",
      description: "Uang Pangkal Anggota Baru",
      category: "Uang Pangkal",
      amount: 1000000,
      wallet: "Kas Utama",
      status: "completed"
    },
    {
      id: 4,
      date: "2023-09-30",
      description: "Sumbangan Acara Tahunan",
      category: "Sumbangan",
      amount: 3000000,
      wallet: "Dana Kegiatan",
      status: "completed"
    },
    {
      id: 5,
      date: "2023-09-25",
      description: "Iuran Bulanan September",
      category: "Iuran",
      amount: 5000000,
      wallet: "Kas Utama",
      status: "completed"
    }
  ];

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
            <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800">
              <Plus className="mr-2 h-4 w-4" /> Tambah Pemasukan
            </Button>
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
                  {formatCurrency(incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0))}
                </h2>
                <p className="text-green-100 mt-2">Dari {incomeTransactions.length} transaksi</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 p-4 rounded-lg">
                  <p className="text-green-100 text-sm">Bulan Ini</p>
                  <p className="text-xl font-bold">{formatCurrency(10000000)}</p>
                </div>
                <div className="bg-white/20 p-4 rounded-lg">
                  <p className="text-green-100 text-sm">Tahun Ini</p>
                  <p className="text-xl font-bold">{formatCurrency(75000000)}</p>
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
                <Input placeholder="Cari transaksi..." />
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="iuran">Iuran</SelectItem>
                    <SelectItem value="donasi">Donasi</SelectItem>
                    <SelectItem value="uang-pangkal">Uang Pangkal</SelectItem>
                    <SelectItem value="sumbangan">Sumbangan</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Dompet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Dompet</SelectItem>
                    <SelectItem value="kas-utama">Kas Utama</SelectItem>
                    <SelectItem value="dana-kegiatan">Dana Kegiatan</SelectItem>
                    <SelectItem value="dana-darurat">Dana Darurat</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
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
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{formatDate(transaction.date)}</td>
                      <td className="py-3 px-4">{transaction.description}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border-green-200 dark:border-green-800">
                          {transaction.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{transaction.wallet}</td>
                      <td className="py-3 px-4 text-right font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(transaction.status)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Edit</span>
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
                              <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              <path d="m15 5 4 4" />
                            </svg>
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
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
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}