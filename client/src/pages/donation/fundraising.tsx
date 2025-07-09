import { DonationList } from "@/components/donation/donation-list";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useLocation } from "wouter";

export default function DonationFundraisingPage() {
  const [, navigate] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Penggalangan Dana</h2>
          <p className="text-muted-foreground">
            Kelola penggalangan dana untuk berbagai kebutuhan komunitas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => navigate('/donation/create')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Donasi
          </Button>
        </div>
      </div>

      <DonationList type="fundraising" />
    </div>
  );
}