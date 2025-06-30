import { NavHeader } from "@/components/nav-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Plus, Filter, Download, CheckCircle, AlertCircle, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";

export default function FinanceInitialPage() {
  // Dummy data for initial fees
  const initialFeeData = {
    feeAmount: 500000,
    totalMembers: 50,
    paidMembers: 45,
    unpaidMembers: 5,
    totalCollected: 22500000,
    targetAmount: 25000000,
    collectionRate: 90, // percentage
  };

  // Dummy data for member initial fees
  const memberInitialFees = [
    {
      id: 1,
      name: "Budi Santoso",
      joinDate: "2023-01-15",
      amount: 500000,
      status: "paid",
      paymentDate: "2023-01-20",
      paymentMethod: "Transfer Bank"
    },
    {
      id: 2,
      name: "Siti Rahayu",
      joinDate: "2023-02-10",
      amount: 500000,
      status: "paid",
      paymentDate: "2023-02-15",
      paymentMethod: "Tunai"
    },
    {
      id: 3,
      name: "Ahmad Hidayat",
      joinDate: "2023-09-05",
      amount: 500000,
      status: "unpaid",
      paymentDate: null,
      paymentMethod: null
    },
    {
      id: 4,
      name: "Dewi Lestari",
      joinDate: "2023-03-20",
      amount: 500000,
      status: "paid",
      paymentDate: "2023-03-25",
      paymentMethod: "Transfer Bank"
    },
    {
      id: 5,
      name: "Eko Prasetyo",
      joinDate: "2023-10-01",
      amount: 500000,
      status: "unpaid",
      paymentDate: null,
      paymentMethod: null
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
            <Button className="bg-gradient-to-r from-amber-500 to-amber-700 hover:from-amber-600 hover:to-amber-800">
              <UserPlus className="mr-2 h-4 w-4" /> Tambah Anggota Baru
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Ekspor Data
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-amber-500 to-amber-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Uang Pangkal</h3>
                <PiggyBank className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold mb-2">{formatCurrency(initialFeeData.feeAmount)}</p>
              <p className="text-amber-100">per anggota baru</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Total Terkumpul</h3>
                <CheckCircle className="h-6 w-6" />
              </div>
              <p className="text-3xl font-bold mb-2">{formatCurrency(initialFeeData.totalCollected)}</p>
              <div className="mt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{initialFeeData.collectionRate}%</span>
                </div>
                <Progress value={initialFeeData.collectionRate} className="h-2 bg-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Status Pembayaran</h3>
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-3xl font-bold">{initialFeeData.paidMembers}</p>
                  <p className="text-green-100">Lunas</p>
                </div>
                <div className="text-4xl font-light mx-4">/</div>
                <div>
                  <p className="text-3xl font-bold">{initialFeeData.unpaidMembers}</p>
                  <p className="text-green-100">Belum Lunas</p>
                </div>
                <div className="text-4xl font-light mx-4">/</div>
                <div>
                  <p className="text-3xl font-bold">{initialFeeData.totalMembers}</p>
                  <p className="text-green-100">Total Anggota</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input placeholder="Cari anggota..." />
              </div>
              <div className="flex gap-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="paid">Lunas</SelectItem>
                    <SelectItem value="unpaid">Belum Lunas</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tahun Bergabung" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Tahun</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2022">2022</SelectItem>
                    <SelectItem value="2021">2021</SelectItem>
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
        <Card>
          <CardHeader>
            <CardTitle>Daftar Uang Pangkal Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nama Anggota</th>
                    <th className="text-left py-3 px-4">Tanggal Bergabung</th>
                    <th className="text-right py-3 px-4">Jumlah</th>
                    <th className="text-center py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Tanggal Pembayaran</th>
                    <th className="text-left py-3 px-4">Metode Pembayaran</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {memberInitialFees.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{member.name}</td>
                      <td className="py-3 px-4">{formatDate(member.joinDate)}</td>
                      <td className="py-3 px-4 text-right">
                        {formatCurrency(member.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(member.status)}
                      </td>
                      <td className="py-3 px-4">{formatDate(member.paymentDate)}</td>
                      <td className="py-3 px-4">{member.paymentMethod || "-"}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex justify-center gap-2">
                          {member.status === "unpaid" ? (
                            <Button variant="outline" size="sm" className="bg-green-500 hover:bg-green-600 text-white border-0">
                              Tandai Lunas
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm">
                              Detail
                            </Button>
                          )}
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