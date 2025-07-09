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

// Data dummy untuk donasi yang akan diedit
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

interface DonationFormProps {
  id?: string; // Jika ada ID, berarti mode edit
}

export function DonationForm({ id }: DonationFormProps) {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!id;

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
    if (isEditMode) {
      // Dalam aplikasi nyata, kita akan mengambil data dari API berdasarkan ID
      const donation = dummyDonation;
      
      form.reset({
        title: donation.title,
        description: donation.description,
        type: donation.type,
        target_amount: donation.target_amount ? donation.target_amount.toString() : "",
        status: donation.status,
      });
    }
  }, [isEditMode, form]);

  // Fungsi untuk menangani submit form
  const onSubmit = async (values: DonationFormValues) => {
    setIsSubmitting(true);
    try {
      // Konversi target_amount dari string ke number jika ada
      const formattedValues = {
        ...values,
        target_amount: values.target_amount ? Number(values.target_amount.replace(/[^0-9]/g, '')) : undefined,
      };

      // Simulasi pengiriman data ke server
      console.log('Form values:', formattedValues);
      
      // Simulasi delay untuk menunjukkan loading state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect ke halaman donasi setelah berhasil
      navigate('/donation');
    } catch (error) {
      console.error('Error submitting form:', error);
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