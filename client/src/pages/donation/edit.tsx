import { useRoute } from 'wouter';
import { DonationForm } from '@/components/donation/donation-form';

export default function DonationEditPage() {
  // Mendapatkan parameter ID dari URL
  const [, params] = useRoute('/donation/edit/:id');
  const id = params?.id || '';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Edit Donasi</h2>
        <p className="text-muted-foreground">
          Perbarui informasi donasi yang sudah ada.
        </p>
      </div>

      <DonationForm id={id} />
    </div>
  );
}