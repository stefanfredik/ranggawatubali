import { useState } from 'react';
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
import { Eye, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { useLocation } from "wouter";

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

// Data dummy untuk donasi
const dummyDonations: Donation[] = [
  {
    id: '1',
    title: 'Nikah Fred',
    description: 'Donasi untuk pernikahan Fred',
    type: 'happy',
    amount: 2500000,
    status: 'active',
    created_at: '2023-10-15',
    updated_at: '2023-10-15'
  },
  {
    id: '2',
    title: 'Pembangunan Gereja',
    description: 'Penggalangan dana untuk pembangunan gereja',
    type: 'fundraising',
    amount: 15000000,
    target_amount: 50000000,
    status: 'active',
    created_at: '2023-09-01',
    updated_at: '2023-10-10'
  },
  {
    id: '3',
    title: 'Duka Keluarga Budi',
    description: 'Donasi untuk keluarga Budi yang berduka',
    type: 'sad',
    amount: 3000000,
    status: 'completed',
    created_at: '2023-08-20',
    updated_at: '2023-09-05'
  }
];

interface DonationListProps {
  type?: 'happy' | 'sad' | 'fundraising';
}

export function DonationList({ type }: DonationListProps) {
  const [, navigate] = useLocation();
  const [donations, setDonations] = useState<Donation[]>(
    type ? dummyDonations.filter(d => d.type === type) : dummyDonations
  );

  // Fungsi untuk menangani penghapusan donasi
  const handleDelete = (id: string) => {
    // Konfirmasi penghapusan
    if (window.confirm('Apakah Anda yakin ingin menghapus donasi ini?')) {
      // Filter donasi yang akan dihapus
      setDonations(donations.filter(donation => donation.id !== id));
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Donasi</CardTitle>
        <CardDescription>
          {type ? `Menampilkan donasi dengan kategori ${getTypeName(type)}` : 'Menampilkan semua donasi'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
            {donations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Tidak ada data donasi</TableCell>
              </TableRow>
            ) : (
              donations.map((donation) => (
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