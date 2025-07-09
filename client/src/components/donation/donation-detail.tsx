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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, Coins } from "lucide-react";
import { useLocation } from "wouter";
import { Donation } from './donation-list';

// Tipe data untuk kontributor donasi
interface Contributor {
  id: string;
  user_id: string;
  donation_id: string;
  name: string;
  amount: number;
  message?: string;
  created_at: string;
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

// Data dummy untuk donasi detail
const dummyDonation: Donation = {
  id: '2',
  title: 'Pembangunan Gereja',
  description: 'Penggalangan dana untuk pembangunan gereja di desa Ranggawatu Bali. Dana ini akan digunakan untuk membeli material bangunan dan membayar tukang.',
  type: 'fundraising',
  amount: 15000000,
  target_amount: 50000000,
  status: 'active',
  created_at: '2023-09-01',
  updated_at: '2023-10-10'
};

// Data dummy untuk kontributor
const dummyContributors: Contributor[] = [
  {
    id: '1',
    user_id: '101',
    donation_id: '2',
    name: 'Budi Santoso',
    amount: 5000000,
    message: 'Semoga pembangunan gereja berjalan lancar',
    created_at: '2023-09-05'
  },
  {
    id: '2',
    user_id: '102',
    donation_id: '2',
    name: 'Ani Wijaya',
    amount: 3000000,
    message: 'Untuk kemajuan desa kita',
    created_at: '2023-09-10'
  },
  {
    id: '3',
    user_id: '103',
    donation_id: '2',
    name: 'Dedi Kurniawan',
    amount: 2000000,
    created_at: '2023-09-15'
  },
  {
    id: '4',
    user_id: '104',
    donation_id: '2',
    name: 'Siti Rahayu',
    amount: 1500000,
    message: 'Semoga cepat selesai',
    created_at: '2023-09-20'
  },
  {
    id: '5',
    user_id: '105',
    donation_id: '2',
    name: 'Joko Widodo',
    amount: 3500000,
    message: 'Untuk kemajuan spiritual masyarakat',
    created_at: '2023-10-01'
  }
];

interface DonationDetailProps {
  id: string;
}

export function DonationDetail({ id }: DonationDetailProps) {
  const [, navigate] = useLocation();
  // Dalam aplikasi nyata, kita akan mengambil data dari API berdasarkan ID
  const [donation] = useState<Donation>(dummyDonation);
  const [contributors] = useState<Contributor[]>(dummyContributors);

  // Menghitung persentase progres untuk donasi penggalangan dana
  const progressPercentage = donation.target_amount
    ? Math.min(Math.round((donation.amount / donation.target_amount) * 100), 100)
    : 100;

  // Menghitung total kontributor
  const totalContributors = contributors.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/donation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/donation/edit/${id}`)}>
            Edit
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{donation.title}</CardTitle>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getTypeColor(donation.type)}>
                  {getTypeName(donation.type)}
                </Badge>
                <Badge className={getStatusColor(donation.status)}>
                  {getStatusName(donation.status)}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Deskripsi</h3>
            <p className="text-gray-500 dark:text-gray-400">{donation.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Donasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(donation.amount)}
                </div>
                {donation.target_amount && (
                  <div className="mt-2 space-y-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                      <span>Progress</span>
                      <span>{progressPercentage}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Target: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(donation.target_amount)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Kontributor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gray-500" />
                  <div className="text-2xl font-bold">{totalContributors}</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Orang telah berkontribusi
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tanggal Dibuat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <div className="text-2xl font-bold">{new Date(donation.created_at).toLocaleDateString('id-ID')}</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Terakhir diperbarui: {new Date(donation.updated_at).toLocaleDateString('id-ID')}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="contributors">
            <TabsList>
              <TabsTrigger value="contributors">Daftar Kontributor</TabsTrigger>
              <TabsTrigger value="activity">Aktivitas</TabsTrigger>
            </TabsList>
            <TabsContent value="contributors" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contributors.map((contributor) => (
                    <TableRow key={contributor.id}>
                      <TableCell className="font-medium">{contributor.name}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(contributor.amount)}
                      </TableCell>
                      <TableCell>{contributor.message || '-'}</TableCell>
                      <TableCell>{new Date(contributor.created_at).toLocaleDateString('id-ID')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="activity" className="space-y-4">
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Tidak ada aktivitas terbaru
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}