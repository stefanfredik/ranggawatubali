import { DonationForm } from '@/components/donation/donation-form';

export default function DonationCreatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tambah Donasi Baru</h2>
        <p className="text-muted-foreground">
          Buat donasi baru untuk kategori Suka, Duka, atau Penggalangan Dana.
        </p>
      </div>

      <DonationForm />
    </div>
  );
}