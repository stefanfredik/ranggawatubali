import { DonationList } from "@/components/donation/donation-list";

export default function DonationFundraisingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Penggalangan Dana</h2>
        <p className="text-muted-foreground">
          Kelola penggalangan dana untuk berbagai kebutuhan komunitas.
        </p>
      </div>

      <DonationList type="fundraising" />
    </div>
  );
}