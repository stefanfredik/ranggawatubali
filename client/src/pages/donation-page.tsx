import { useState } from 'react';
import { useRoute } from 'wouter';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NavHeader } from '@/components/nav-header';
import DonationIndexPage from '@/pages/donation/index';
import DonationHappyPage from '@/pages/donation/happy';
import DonationSadPage from '@/pages/donation/sad';
import DonationFundraisingPage from '@/pages/donation/fundraising';
import DonationDetailPage from '@/pages/donation/detail';
import DonationCreatePage from '@/pages/donation/create';
import DonationEditPage from '@/pages/donation/edit';

export default function DonationPage() {
  const [section, setSection] = useState<string>('donation');
  
  // Cek rute saat ini untuk menentukan halaman yang akan ditampilkan
  const [matchIndex] = useRoute('/donation');
  const [matchHappy] = useRoute('/donation/happy');
  const [matchSad] = useRoute('/donation/sad');
  const [matchFundraising] = useRoute('/donation/fundraising');
  const [matchDetail] = useRoute('/donation/detail/:id');
  const [matchCreate] = useRoute('/donation/create');
  const [matchEdit] = useRoute('/donation/edit/:id');

  // Fungsi untuk menentukan konten yang akan ditampilkan berdasarkan rute
  const renderContent = () => {
    if (matchCreate) return <DonationCreatePage />;
    if (matchEdit) return <DonationEditPage />;
    if (matchDetail) return <DonationDetailPage />;
    if (matchHappy) return <DonationHappyPage />;
    if (matchSad) return <DonationSadPage />;
    if (matchFundraising) return <DonationFundraisingPage />;
    return <DonationIndexPage />; // Default page
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        {renderContent()}
      </main>
    </div>
  );
}