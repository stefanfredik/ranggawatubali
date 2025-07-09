import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2, MoreHorizontal, Search, Filter } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";


// Tipe data untuk donasi
export interface Donation {
  id: string;
  title: string;
  description: string;
  type: 'happy' | 'sad' | 'fundraising';
  amount: number;
  target_amount?: number;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Fungsi untuk menerjemahkan tipe donasi ke bahasa Indonesia
const getTypeName = (type: string) => {
  switch (type) {
    case 'happy': return 'Suka';
    case 'sad': return 'Duka';
    case 'fundraising': return 'Penggalangan Dana';
    default: return type;
  }
};

// Fungsi untuk mendapatkan warna badge berdasarkan tipe donasi
const getTypeColor = (type: string) => {
  switch (type) {
    case 'happy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'sad': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'fundraising': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    default: return '';
  }
};

// Fungsi untuk mendapatkan warna badge berdasarkan status donasi
const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return '';
  }
};

// Fungsi untuk menerjemahkan status donasi ke bahasa Indonesia
const getStatusName = (status: string) => {
  switch (status) {
    case 'active': return 'Aktif';
    case 'completed': return 'Selesai';
    case 'cancelled': return 'Dibatalkan';
    default: return status;
  }
};

// Tidak lagi menggunakan data dummy, data akan diambil dari API

interface DonationListProps {
  type?: 'happy' | 'sad' | 'fundraising';
  showFilters?: boolean;
}

export function DonationList({ type, showFilters = true }: DonationListProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State untuk pencarian dan filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>(type || 'all');

  // Mengambil data donasi dari API
  const { data: donationsData, isLoading, error } = useQuery({
    queryKey: type ? [`/api/donations/type/${type}`] : ['/api/donations'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', type ? `/api/donations/type/${type}` : '/api/donations');
        return res.json();
      } catch (error) {
        console.error('Error fetching donations:', error);
        throw error;
      }
    }
  });

  // Menampilkan error jika gagal mengambil data
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data donasi. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Fungsi untuk menangani penghapusan donasi
  const handleDelete = async (id: string) => {
    // Konfirmasi penghapusan
    if (window.confirm('Apakah Anda yakin ingin menghapus donasi ini?')) {
      try {
        await apiRequest('DELETE', `/api/donations/${id}`);
        // Invalidate query untuk memperbarui data
        queryClient.invalidateQueries({ queryKey: ['/api/donations'] });
        if (type) {
          queryClient.invalidateQueries({ queryKey: [`/api/donations/type/${type}`] });
        }
        toast({
          title: "Sukses",
          description: "Donasi berhasil dihapus.",
        });
      } catch (error) {
        console.error('Error deleting donation:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus donasi. Silakan coba lagi nanti.",
          variant: "destructive",
        });
      }
    }
  };

  // Fungsi untuk menangani edit donasi
  const handleEdit = (id: string) => {
    // Navigasi ke halaman edit donasi
    navigate(`/donation/edit/${id}`);
  };

  // Fungsi untuk menangani melihat detail donasi
  const handleViewDetail = (id: string) => {
    // Navigasi ke halaman detail donasi
    navigate(`/donation/detail/${id}`);
  };

  // Filter donasi berdasarkan pencarian dan filter
  const filteredDonations = donationsData
    ? donationsData.filter((donation) => {
        const matchesSearch = donation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           donation.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
        const matchesType = typeFilter === 'all' || donation.type === typeFilter;
        
        return matchesSearch && matchesStatus && matchesType;
      })
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Donasi</CardTitle>
        <CardDescription>
          {type ? `Menampilkan donasi dengan kategori ${getTypeName(type)}` : 'Menampilkan semua donasi'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showFilters && (
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search" className="mb-2 block">Cari Donasi</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    type="search"
                    placeholder="Cari berdasarkan judul atau deskripsi..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-[180px]">
                <Label htmlFor="status-filter" className="mb-2 block">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                >
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="completed">Selesai</SelectItem>
                    <SelectItem value="cancelled">Dibatalkan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {!type && (
                <div className="w-full md:w-[180px]">
                  <Label htmlFor="type-filter" className="mb-2 block">Kategori</Label>
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger id="type-filter">
                      <SelectValue placeholder="Filter Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kategori</SelectItem>
                      <SelectItem value="happy">Suka</SelectItem>
                      <SelectItem value="sad">Duka</SelectItem>
                      <SelectItem value="fundraising">Penggalangan Dana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <Separator />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Judul</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Memuat data donasi...</TableCell>
              </TableRow>
            ) : filteredDonations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Tidak ada data donasi</TableCell>
              </TableRow>
            ) : (
              filteredDonations.map((donation) => (
                <TableRow key={donation.id}>
                  <TableCell className="font-medium">{donation.title}</TableCell>
                  <TableCell>
                    <Badge className={getTypeColor(donation.type)}>
                      {getTypeName(donation.type)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(donation.amount)}
                    {donation.target_amount && (
                      <span className="text-xs text-gray-500 block">
                        Target: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(donation.target_amount)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(donation.status)}>
                      {getStatusName(donation.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(donation.created_at).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Buka menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetail(donation.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(donation.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(donation.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate('/donation')}>
          Kembali
        </Button>
        <Button onClick={() => navigate('/donation/create')}>
          Tambah Donasi
        </Button>
      </CardFooter>
    </Card>
  );
}