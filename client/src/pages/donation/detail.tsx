import { useRoute } from 'wouter';
import { DonationDetail } from '@/components/donation/donation-detail';

export default function DonationDetailPage() {
  // Mendapatkan parameter ID dari URL
  const [, params] = useRoute('/donation/detail/:id');
  const id = params?.id || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Detail Donasi</h2>
        <p className="text-muted-foreground">
          Lihat detail donasi dan daftar kontributor.
        </p>
      </div>

      <DonationDetail id={id} />
    </div>
  );
}