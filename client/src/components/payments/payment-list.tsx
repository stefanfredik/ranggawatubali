import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PaymentList() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Error fetching payments: ${res.status}`);
      }
      return res.json();
    },
  });

  const [statusFilter, setStatusFilter] = useState("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
      case "approved":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "rejected":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const filteredPayments = payments?.filter((payment: any) => {
    return statusFilter === "all" || payment.status === statusFilter;
  });

  // Calculate total amount for approved payments
  const totalApproved = payments
    ?.filter((payment: any) => payment.status === "approved")
    .reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Daftar Pemasukan</h2>
            <p className="text-muted-foreground mt-1">
              Informasi semua pemasukan organisasi
            </p>
          </div>
        </div>

        <Card className="glassmorphism-card border-0">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-8 w-40" />
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Daftar Pemasukan</h2>
          <p className="text-muted-foreground mt-1">
            Informasi semua pemasukan organisasi
          </p>
        </div>
        <div className="flex space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 glassmorphism border-0">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="glassmorphism-card border-0">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium">Total Pemasukan Disetujui</h3>
              <p className="text-2xl font-bold mt-1">{formatCurrency(totalApproved)}</p>
            </div>
          </div>

          {!filteredPayments?.length ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Tidak ada data pemasukan ditemukan</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anggota</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.user.fullName}</TableCell>
                      <TableCell>{payment.period}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>{format(new Date(payment.submittedAt), "dd MMM yyyy")}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status === "pending" && "Pending"}
                          {payment.status === "approved" && "Disetujui"}
                          {payment.status === "rejected" && "Ditolak"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}