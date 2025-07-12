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
import { ArrowLeft, Calendar, Users, Coins, Plus, Pencil, Search, Filter, Eye } from "lucide-react";
import { useLocation } from "wouter";
import { Donation } from './donation-list';
import { DonationContributorForm } from './donation-contributor-form';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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

// Fungsi untuk memformat tanggal dengan aman
const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    // Periksa apakah tanggal valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleDateString('id-ID');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [contributorToDelete, setContributorToDelete] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  
  // State untuk pencarian dan filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  
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
  const totalAmount = contributors?.reduce((total, contributor) => total + contributor.amount, 0) || 0;
  const progressPercentage = donation?.target_amount
    ? Math.min(Math.round((totalAmount / donation.target_amount) * 100), 100)
    : 100;

  // Menghitung total kontributor
  const totalContributors = contributors?.length || 0;
  
  // Filter kontributor berdasarkan pencarian dan filter
  const filteredContributors = contributors
    ? contributors.filter((contributor) => {
        const matchesSearch = contributor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (contributor.message && contributor.message.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesPaymentMethod = paymentMethodFilter === 'all' || contributor.payment_method === paymentMethodFilter;
        
        return matchesSearch && matchesPaymentMethod;
      })
    : [];
    
  // Handle view contributor detail
  const handleViewContributorDetail = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setIsDetailDialogOpen(true);
  };
  
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
  const handleDeleteContributor = (contributorId: string) => {
    setContributorToDelete(contributorId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete contributor
  const confirmDeleteContributor = async () => {
    if (!contributorToDelete) return;
    
    try {
      await apiRequest('DELETE', `/api/donations/${id}/contributors/${contributorToDelete}`);
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
    } finally {
      setIsDeleteDialogOpen(false);
      setContributorToDelete(null);
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
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}
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
                  <div className="text-2xl font-bold">{formatDate(donation.created_at)}</div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Terakhir diperbarui: {formatDate(donation.updated_at)}
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
              <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Cari kontributor..."
                      className="pl-8 w-full"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-48">
                    <Select
                      value={paymentMethodFilter}
                      onValueChange={setPaymentMethodFilter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Filter metode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Metode</SelectItem>
                        <SelectItem value="cash">Tunai</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
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
              ) : filteredContributors && filteredContributors.length > 0 ? (
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
                      {filteredContributors.map((contributor) => (
                        <TableRow key={contributor.id}>
                          <TableCell className="font-medium">
                            <Button 
                              variant="link" 
                              className="p-0 h-auto font-medium text-left" 
                              onClick={() => handleViewContributorDetail(contributor)}
                            >
                              {contributor.name}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(contributor.amount)}
                          </TableCell>
                          <TableCell>{contributor.payment_method === 'cash' ? 'Tunai' : 'Transfer'}</TableCell>
                          <TableCell>{formatDate(contributor.payment_date)}</TableCell>
                          <TableCell>{contributor.message || '-'}</TableCell>
                          <TableCell>{formatDate(contributor.created_at)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewContributorDetail(contributor)}
                                className="text-blue-500 hover:text-blue-700 hover:bg-blue-100"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
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
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  {searchTerm || paymentMethodFilter !== 'all' 
                    ? 'Tidak ada kontributor yang sesuai dengan filter.'
                    : 'Belum ada kontributor. Jadilah yang pertama berkontribusi!'}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog untuk detail kontributor */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Detail Kontributor</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang kontributor
            </DialogDescription>
          </DialogHeader>
          {selectedContributor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Nama</Label>
                  <p className="text-base font-medium">{selectedContributor.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Jumlah Kontribusi</Label>
                  <p className="text-base font-medium">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(selectedContributor.amount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Metode Pembayaran</Label>
                  <p className="text-base font-medium">{selectedContributor.payment_method === 'cash' ? 'Tunai' : 'Transfer'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tanggal Pembayaran</Label>
                  <p className="text-base font-medium">{formatDate(selectedContributor.payment_date)}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-500">Pesan</Label>
                  <p className="text-base">{selectedContributor.message || '-'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tanggal Dibuat</Label>
                  <p className="text-base font-medium">{formatDate(selectedContributor.created_at)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">ID Kontributor</Label>
                  <p className="text-base font-medium">{selectedContributor.id}</p>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsDetailDialogOpen(false)}>Tutup</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi hapus kontributor */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus kontributor ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex space-x-2 justify-end">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={confirmDeleteContributor}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog untuk menambahkan kontributor baru */}
      <Dialog open={isContributorDialogOpen} onOpenChange={setIsContributorDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Kontributor Baru</DialogTitle>
            <DialogDescription>
              Isi form berikut untuk menambahkan kontributor baru ke donasi ini.
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