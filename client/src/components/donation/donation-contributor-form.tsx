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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

// Skema validasi untuk form kontributor donasi
const contributorFormSchema = z.object({
  contributorType: z.enum(['self', 'member']),
  memberId: z.string().optional(),
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
  paymentMethod: z.enum(["cash", "transfer"]).default("cash"),
  paymentDate: z.date().optional(),
  message: z.string().optional(),
}).superRefine((data, ctx) => {
  // Validasi tambahan: jika contributorType adalah 'member', memberId harus diisi
  if (data.contributorType === 'member' && (!data.memberId || data.memberId === '')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Silakan pilih anggota",
      path: ["memberId"]
    });
  }
});

// Tipe data untuk form kontributor
type ContributorFormValues = z.infer<typeof contributorFormSchema>;

interface Wallet {
  id: number;
  name: string;
  balance: string;
  description: string | null;
}

interface DonationContributorFormProps {
  donationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DonationContributorForm({ donationId, onSuccess, onCancel }: DonationContributorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch members data
  const { data: members, isLoading: isLoadingMembers } = useQuery({
    queryKey: ["/api/members"],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/members');
        return res.json();
      } catch (error) {
        console.error('Error fetching members:', error);
        throw error;
      }
    },
  });
  
  // Tidak perlu fetch wallets data untuk form kontributor

  // Inisialisasi form dengan react-hook-form dan zod resolver
  const form = useForm<ContributorFormValues>({
    resolver: zodResolver(contributorFormSchema),
    defaultValues: {
      contributorType: 'self',
      name: "",
      amount: "",
      paymentMethod: "cash",
      paymentDate: new Date(), // Default ke tanggal hari ini
      message: "",
    },
  });

  // Watch the contributorType field to update the name field
  const contributorType = form.watch('contributorType');
  const selectedMemberId = form.watch('memberId');

  // Update the name field when a member is selected
  useEffect(() => {
    if (contributorType === 'member' && selectedMemberId && members) {
      const selectedMember = members.find(member => member.id.toString() === selectedMemberId);
      if (selectedMember) {
        form.setValue('name', selectedMember.fullName);
      }
    }
  }, [contributorType, selectedMemberId, members, form]);

  // Fungsi untuk menangani submit form
  const onSubmit = async (values: ContributorFormValues) => {
    setIsSubmitting(true);
    try {
      // Konversi amount dari string ke number dan pastikan nilai positif
      const amountValue = Number(values.amount.replace(/[^0-9]/g, ''));
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error("Jumlah donasi harus berupa angka positif");
      }
      
      // Pastikan nama field sesuai dengan yang diharapkan server
      const formattedValues = {
        contributorType: values.contributorType,
        memberId: values.contributorType === 'member' ? values.memberId : undefined,
        name: values.name,
        amount: amountValue.toString(), // Kirim sebagai string untuk memastikan kompatibilitas dengan z.coerce.number()
        paymentMethod: values.paymentMethod || 'cash', // Pastikan paymentMethod selalu ada
        paymentDate: values.paymentDate, // Tanggal pembayaran
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
      
      // Coba ekstrak pesan error dari respons API
      let errorMessage = "Terjadi kesalahan saat menambahkan kontribusi.";
      
      if (error && error.response) {
        try {
          const errorData = await error.response.json();
          console.log('Error data from server:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
          
          // Jika ada detail validasi, tambahkan ke pesan error
          if (errorData.details) {
            const detailMessages = Array.isArray(errorData.details) 
              ? errorData.details.map(detail => {
                  // Handle Zod validation errors yang memiliki struktur berbeda
                  if (detail.message) return detail.message;
                  if (detail.path && detail.message) return `${detail.path.join('.')}: ${detail.message}`;
                  return detail.toString();
                }).join(', ')
              : errorData.details;
            errorMessage = `${errorMessage}: ${detailMessages}`;
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Gagal menambahkan kontribusi",
        description: errorMessage,
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="contributorType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Jenis Kontributor</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kontributor" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="self">Diri Sendiri</SelectItem>
                  <SelectItem value="member">Anggota Lain</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Pilih apakah kontribusi ini dari Anda sendiri atau atas nama anggota lain.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {contributorType === 'member' && (
          <FormField
            control={form.control}
            name="memberId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Anggota</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih anggota" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingMembers ? (
                      <SelectItem value="loading" disabled>Memuat data anggota...</SelectItem>
                    ) : members && members.length > 0 ? (
                      members.map((member) => (
                        <SelectItem key={member.id} value={member.id.toString()}>
                          {member.fullName}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="empty" disabled>Tidak ada anggota</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Pilih anggota yang akan menjadi kontributor.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Masukkan nama Anda" 
                  {...field} 
                  disabled={contributorType === 'member'}
                />
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
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metode Pembayaran</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih metode pembayaran" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Tunai</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Pilih metode pembayaran yang Anda gunakan.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paymentDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Pembayaran</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  placeholder="Pilih tanggal pembayaran"
                  {...field}
                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    // Pastikan tanggal diproses dengan benar
                    if (e.target.value) {
                      // Buat objek Date dengan waktu lokal untuk menghindari masalah timezone
                      const dateStr = e.target.value; // Format: YYYY-MM-DD
                      const [year, month, day] = dateStr.split('-').map(Number);
                      
                      // Buat objek Date dengan waktu lokal
                      // Bulan di JavaScript dimulai dari 0 (Januari = 0)
                      const date = new Date(year, month - 1, day, 12, 0, 0);
                      
                      // Log untuk debugging
                      console.log('Date input value:', e.target.value);
                      console.log('Parsed date object:', date);
                      console.log('Date ISO string:', date.toISOString());
                      
                      field.onChange(date);
                    } else {
                      field.onChange(undefined);
                    }
                  }}
                />
              </FormControl>
              <FormDescription>
                Tanggal saat pembayaran dilakukan.
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

        <DialogFooter className="mt-6">
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
        </DialogFooter>
      </form>
    </Form>
  );
}