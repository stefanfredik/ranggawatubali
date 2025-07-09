import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Donation } from './donation-list';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/components/ui/use-toast";

// Skema validasi untuk form donasi
const donationFormSchema = z.object({
  title: z.string().min(3, {
    message: "Judul harus minimal 3 karakter.",
  }),
  description: z.string().min(10, {
    message: "Deskripsi harus minimal 10 karakter.",
  }),
  type: z.enum(['happy', 'sad', 'fundraising'], {
    required_error: "Silakan pilih tipe donasi.",
  }),
  target_amount: z.string().optional().refine((val) => {
    if (!val) return true;
    const num = Number(val.replace(/[^0-9]/g, ''));
    return !isNaN(num) && num >= 0;
  }, {
    message: "Target jumlah harus berupa angka positif.",
  }),
  status: z.enum(['active', 'completed', 'cancelled'], {
    required_error: "Silakan pilih status donasi.",
  }),
});

// Tipe data untuk form donasi
type DonationFormValues = z.infer<typeof donationFormSchema>;

interface DonationFormProps {
  id?: string; // Jika ada ID, berarti mode edit
}

export function DonationForm({ id }: DonationFormProps) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!id;
  const { toast } = useToast();

  // Inisialisasi form dengan react-hook-form dan zod resolver
  const form = useForm<DonationFormValues>({
    resolver: zodResolver(donationFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "happy" as const,
      target_amount: "",
      status: "active" as const,
    },
  });

  // Jika mode edit, isi form dengan data yang ada
  useEffect(() => {
    if (isEditMode && id) {
      // Ambil data donasi dari API berdasarkan ID
      const fetchDonation = async () => {
        try {
          const response = await apiRequest('GET', `/api/donations/${id}`);
          const donation = await response.json();
          
          // Log data yang diterima dari server untuk debugging
          console.log('Data donasi dari server:', donation);
          
          form.reset({
            title: donation.title,
            description: donation.description,
            type: donation.type,
            target_amount: donation.targetAmount ? donation.targetAmount.toString() : "",
            status: donation.status,
          });
        } catch (error) {
          console.error('Error fetching donation:', error);
          toast({
            title: "Error",
            description: "Gagal memuat data donasi. Silakan coba lagi nanti.",
            variant: "destructive",
          });
          navigate('/donation');
        }
      };
      
      fetchDonation();
    }
  }, [isEditMode, id, form, toast, navigate]);

  // Fungsi untuk menangani submit form
  const onSubmit = async (values: DonationFormValues) => {
    setIsSubmitting(true);
    try {
      // Konversi target_amount dari string ke number jika ada dan ubah ke camelCase untuk server
      const formattedValues = {
        title: values.title,
        description: values.description,
        type: values.type,
        amount: 0, // Nilai awal amount adalah 0 untuk donasi baru
        targetAmount: values.target_amount ? Number(values.target_amount.replace(/[^0-9]/g, '')) : undefined,
        status: values.status
      };
      
      // Log data yang akan dikirim untuk debugging
      console.log('Data donasi yang akan dikirim:', formattedValues);
  
      // Kirim data ke server menggunakan API
      if (isEditMode) {
        // Jika mode edit, gunakan PUT request
        await apiRequest('PUT', `/api/donations/${id}`, formattedValues);
      } else {
        // Jika mode tambah baru, gunakan POST request
        await apiRequest('POST', '/api/donations', formattedValues);
      }
      
      // Tampilkan notifikasi sukses
      toast({
        title: "Sukses",
        description: isEditMode ? "Donasi berhasil diperbarui." : "Donasi berhasil ditambahkan.",
      });
      
      // Redirect ke halaman donasi setelah berhasil
      navigate('/donation');
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan donasi. Silakan coba lagi nanti.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fungsi untuk memformat input angka dengan format mata uang
  const formatCurrency = (value: string) => {
    // Hapus semua karakter non-digit
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Jika kosong, kembalikan string kosong
    if (!numericValue) return '';
    
    // Konversi ke number dan format sebagai mata uang
    const formattedValue = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(numericValue));
    
    return formattedValue;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/donation')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Donasi' : 'Tambah Donasi Baru'}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Perbarui informasi donasi yang sudah ada' 
              : 'Isi formulir berikut untuk membuat donasi baru'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan judul donasi" {...field} />
                    </FormControl>
                    <FormDescription>
                      Judul donasi yang akan ditampilkan di daftar donasi.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Masukkan deskripsi donasi" 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Deskripsi detail tentang donasi ini.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori donasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="happy">Suka</SelectItem>
                          <SelectItem value="sad">Duka</SelectItem>
                          <SelectItem value="fundraising">Penggalangan Dana</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Kategori donasi yang akan dibuat.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="target_amount"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Target Jumlah (Opsional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan target jumlah" 
                          value={formatCurrency(value)}
                          onChange={(e) => {
                            // Simpan nilai asli (tanpa format) ke state form
                            onChange(e.target.value);
                          }}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Target jumlah yang ingin dicapai (khusus untuk Penggalangan Dana).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih status donasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="completed">Selesai</SelectItem>
                          <SelectItem value="cancelled">Dibatalkan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Status donasi saat ini.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <CardFooter className="flex justify-between px-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/donation')}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : isEditMode ? 'Perbarui' : 'Simpan'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}