import { useState } from 'react';
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
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/components/ui/use-toast";

// Skema validasi untuk form kontributor donasi
const contributorFormSchema = z.object({
  name: z.string().min(3, {
    message: "Nama harus minimal 3 karakter.",
  }),
  amount: z.string().min(1, {
    message: "Jumlah donasi harus diisi.",
  }).refine((val) => {
    const num = Number(val.replace(/[^0-9]/g, ''));
    return !isNaN(num) && num > 0;
  }, {
    message: "Jumlah donasi harus berupa angka positif.",
  }),
  message: z.string().optional(),
});

// Tipe data untuk form kontributor
type ContributorFormValues = z.infer<typeof contributorFormSchema>;

interface DonationContributorFormProps {
  donationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DonationContributorForm({ donationId, onSuccess, onCancel }: DonationContributorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Inisialisasi form dengan react-hook-form dan zod resolver
  const form = useForm<ContributorFormValues>({
    resolver: zodResolver(contributorFormSchema),
    defaultValues: {
      name: "",
      amount: "",
      message: "",
    },
  });

  // Fungsi untuk menangani submit form
  const onSubmit = async (values: ContributorFormValues) => {
    setIsSubmitting(true);
    try {
      // Konversi amount dari string ke number
      // Pastikan nama field sesuai dengan yang diharapkan server
      const formattedValues = {
        name: values.name,
        amount: Number(values.amount.replace(/[^0-9]/g, '')),
        message: values.message,
      };

      // Log data yang akan dikirim untuk debugging
      console.log('Data kontributor yang akan dikirim:', formattedValues);

      // Kirim data ke server
      await apiRequest('POST', `/api/donations/${donationId}/contributors`, formattedValues);
      
      // Tampilkan toast sukses
      toast({
        title: "Kontribusi berhasil ditambahkan",
        description: "Terima kasih atas kontribusi Anda.",
        variant: "default",
      });

      // Reset form
      form.reset();

      // Panggil callback onSuccess jika ada
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Gagal menambahkan kontribusi",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat menambahkan kontribusi.",
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
    <Card>
      <CardHeader>
        <CardTitle>Tambah Kontribusi</CardTitle>
        <CardDescription>
          Isi formulir berikut untuk menambahkan kontribusi Anda
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama Anda" {...field} />
                  </FormControl>
                  <FormDescription>
                    Nama Anda yang akan ditampilkan sebagai kontributor.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>Jumlah Donasi</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Masukkan jumlah donasi" 
                      value={formatCurrency(value)}
                      onChange={(e) => {
                        // Simpan nilai asli (tanpa format) ke state form
                        onChange(e.target.value);
                      }}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Jumlah donasi yang ingin Anda kontribusikan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pesan (Opsional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Masukkan pesan Anda" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Pesan yang ingin Anda sampaikan bersama donasi ini.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="flex justify-between px-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Kirim Kontribusi'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}