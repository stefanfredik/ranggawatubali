import { useState } from 'react';
import { useRoute } from 'wouter';
import { Sidebar } from '@/components/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    <div className="flex min-h-screen">
      <Sidebar 
        currentSection={section} 
        onSectionChange={setSection} 
      />
      <div className="flex-1">
        <ScrollArea className="h-screen">
          <main className="flex-1 p-6 md:p-10">
            {renderContent()}
          </main>
        </ScrollArea>
      </div>
    </div>
  );
}