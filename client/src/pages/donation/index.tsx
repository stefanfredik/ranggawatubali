import { useEffect } from "react";
import { useLocation } from "wouter";
import { NavHeader } from "@/components/nav-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, HandHeart, HandHelping, Coins, List } from "lucide-react";

export default function DonationIndexPage() {
  const [, navigate] = useLocation();
  
  const donationModules = [
    {
      id: "happy",
      title: "Suka",
      description: "Kelola donasi untuk acara suka",
      icon: HandHeart,
      color: "from-pink-500 to-pink-700",
      path: "/donation/happy"
    },
    {
      id: "sad",
      title: "Duka",
      description: "Kelola donasi untuk acara duka",
      icon: HandHelping,
      color: "from-blue-500 to-blue-700",
      path: "/donation/sad"
    },
    {
      id: "fundraising",
      title: "Penggalangan Dana",
      description: "Kelola penggalangan dana",
      icon: Coins,
      color: "from-amber-500 to-amber-700",
      path: "/donation/fundraising"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Donasi</h1>
          <p className="text-muted-foreground mt-1">
            Kelola donasi dan pengumpulan dana di sini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {donationModules.map((module) => (
            <Card 
              key={module.id} 
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => navigate(module.path)}
            >
              <div className={`h-2 bg-gradient-to-r ${module.color}`} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{module.title}</h3>
                    <p className="text-muted-foreground">{module.description}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-gradient-to-r ${module.color} text-white`}>
                    <module.icon size={24} />
                  </div>
                </div>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                  onClick={() => navigate(module.path)}
                >
                  Buka
                </Button>
              </CardContent>
            </Card>
          ))}
          
          {/* Donation List Card */}
          <Card 
            className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => navigate("/donation/list")}
          >
            <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-700" />
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Daftar Donasi</h3>
                  <p className="text-muted-foreground">Lihat daftar donasi berdasarkan acara</p>
                </div>
                <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-700 text-white">
                  <List size={24} />
                </div>
              </div>
              <Button 
                className="w-full mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                onClick={() => navigate("/donation/list")}
              >
                Buka
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}