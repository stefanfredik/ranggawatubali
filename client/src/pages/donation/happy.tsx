import { DonationList } from "@/components/donation/donation-list";

export default function DonationHappyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Donasi Suka</h2>
        <p className="text-muted-foreground">
          Kelola donasi untuk acara-acara suka seperti pernikahan, kelahiran, dan lainnya.
        </p>
      </div>

      <DonationList type="happy" />
    </div>
  );
}