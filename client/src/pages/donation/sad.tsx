import { DonationList } from "@/components/donation/donation-list";

export default function DonationSadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Donasi Duka</h2>
        <p className="text-muted-foreground">
          Kelola donasi untuk acara-acara duka seperti kematian, sakit, dan lainnya.
        </p>
      </div>

      <DonationList type="sad" />
    </div>
  );
}