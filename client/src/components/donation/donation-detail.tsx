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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Users, Coins, Plus, Pencil } from "lucide-react";
import { useLocation } from "wouter";
import { Donation } from './donation-list';
import { DonationContributorForm } from './donation-contributor-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Tipe data untuk kontributor donasi
interface Contributor {
  id: string;
  user_id: string;
  donation_id: string;
  name: string;
  amount: number;
  payment_method: string;
  payment_date?: string;
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

// Tidak lagi menggunakan data dummy, data akan diambil dari API

interface DonationDetailProps {
  id: string;
}

export function DonationDetail({ id }: DonationDetailProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isContributorDialogOpen, setIsContributorDialogOpen] = useState(false);
  
  // Fetch donation data
  const { data: donation, isLoading: isLoadingDonation, error: donationError } = useQuery<Donation>({
    queryKey: [`/api/donations/${id}`],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/donations/${id}`);
        return res.json();
      } catch (error) {
        console.error('Error fetching donation:', error);
        throw error;
      }
    },
    enabled: !!id,
  });

  // Fetch contributors data
  const { data: contributors, isLoading: isLoadingContributors, error: contributorsError } = useQuery<Contributor[]>({
    queryKey: [`/api/donations/${id}/contributors`],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/donations/${id}/contributors`);
        return res.json();
      } catch (error) {
        console.error('Error fetching contributors:', error);
        throw error;
      }
    },
    enabled: !!id,
  });

  // Handle errors
  useEffect(() => {
    if (donationError) {
      toast({
        title: "Error",
        description: "Gagal memuat data donasi. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    }
    if (contributorsError) {
      toast({
        title: "Error",
        description: "Gagal memuat data kontributor. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    }
  }, [donationError, contributorsError, toast]);

  // Menghitung persentase progres untuk donasi penggalangan dana
  const progressPercentage = donation?.target_amount
    ? Math.min(Math.round((donation.amount / donation.target_amount) * 100), 100)
    : 100;

  // Menghitung total kontributor
  const totalContributors = contributors?.length || 0;
  
  // Handle successful contribution
  const handleContributionSuccess = () => {
    setIsContributorDialogOpen(false);
    // Refresh data
    queryClient.invalidateQueries({ queryKey: [`/api/donations/${id}`] });
    queryClient.invalidateQueries({ queryKey: [`/api/donations/${id}/contributors`] });
    toast({
      title: "Sukses",
      description: "Kontribusi Anda telah berhasil ditambahkan. Terima kasih!",
    });
  };

  // Handle delete contributor
  const handleDeleteContributor = async (contributorId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kontributor ini?')) {
      try {
        await apiRequest('DELETE', `/api/donations/${id}/contributors/${contributorId}`);
        // Refresh data
        queryClient.invalidateQueries({ queryKey: [`/api/donations/${id}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/donations/${id}/contributors`] });
        toast({
          title: "Sukses",
          description: "Kontributor berhasil dihapus.",
        });
      } catch (error) {
        console.error('Error deleting contributor:', error);
        toast({
          title: "Error",
          description: "Gagal menghapus kontributor. Silakan coba lagi nanti.",
          variant: "destructive",
        });
      }
    }
  };

  // Tampilkan loading state jika data sedang dimuat
  if (isLoadingDonation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/donation')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <p>Memuat data donasi...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tampilkan pesan error jika gagal memuat data
  if (donationError || !donation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/donation')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center h-40">
              <p className="text-red-500">Gagal memuat data donasi. Silakan coba lagi nanti.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/donation')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </Button>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/donation/edit/${id}`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
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
              <div className="flex justify-end mb-4">
                <Button 
                  onClick={() => setIsContributorDialogOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Kontribusi
                </Button>
              </div>
              
              {isLoadingContributors ? (
                <div className="text-center py-4">Memuat data kontributor...</div>
              ) : contributorsError ? (
                <div className="text-center text-red-500 py-4">Gagal memuat data kontributor. Silakan coba lagi nanti.</div>
              ) : contributors && contributors.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Nama Kontributor</TableHead>
                        <TableHead>Jumlah Kontribusi</TableHead>
                        <TableHead>Metode Pembayaran</TableHead>
                        <TableHead>Tanggal Pembayaran</TableHead>
                        <TableHead>Pesan</TableHead>
                        <TableHead>Tanggal Dibuat</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributors.map((contributor) => (
                        <TableRow key={contributor.id}>
                          <TableCell className="font-medium">{contributor.name}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(contributor.amount)}
                          </TableCell>
                          <TableCell>{contributor.payment_method === 'cash' ? 'Tunai' : 'Transfer'}</TableCell>
                          <TableCell>{contributor.payment_date ? new Date(contributor.payment_date).toLocaleDateString('id-ID') : '-'}</TableCell>
                          <TableCell>{contributor.message || '-'}</TableCell>
                          <TableCell>{new Date(contributor.created_at).toLocaleDateString('id-ID')}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteContributor(contributor.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-100"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2">
                                <path d="M3 6h18"/>
                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                              </svg>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Belum ada kontributor. Jadilah yang pertama berkontribusi!
                </div>
              )}
            </TabsContent>
            <TabsContent value="activity" className="space-y-4">
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Tidak ada aktivitas terbaru
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog untuk form kontributor */}
      <Dialog open={isContributorDialogOpen} onOpenChange={setIsContributorDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Kontribusi</DialogTitle>
            <DialogDescription>
              Isi formulir berikut untuk menambahkan kontribusi Anda pada donasi ini
            </DialogDescription>
          </DialogHeader>
          <DonationContributorForm 
            donationId={id} 
            onSuccess={handleContributionSuccess}
            onCancel={() => setIsContributorDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}