import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, CreditCard, Cake } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const cards = [
    {
      title: "Total Anggota",
      value: stats?.totalMembers || 0,
      icon: Users,
      color: "from-blue-500 to-blue-600",
      change: "+12%",
      changeText: "dari bulan lalu",
    },
    {
      title: "Aktivitas Aktif",
      value: stats?.activeActivities || 0,
      icon: Calendar,
      color: "from-green-500 to-green-600",
      change: "+3",
      changeText: "baru minggu ini",
    },
    {
      title: "Pembayaran Tertunda",
      value: stats?.pendingPayments || 0,
      icon: CreditCard,
      color: "from-yellow-500 to-yellow-600",
      change: "Perlu ditinjau",
      changeText: "",
    },
    {
      title: "Ulang Tahun Bulan Ini",
      value: stats?.birthdaysThisMonth || 0,
      icon: Cake,
      color: "from-purple-500 to-purple-600",
      change: "Dalam 3 minggu ini",
      changeText: "",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} variant="glass">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        // Use consistent glass variant for all cards
        
        return (
          <Card key={index} variant="glass">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold">{card.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-r ${card.color} rounded-xl`}>
                  <Icon className="text-white" size={20} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-500 font-medium">{card.change}</span>
                {card.changeText && (
                  <span className="text-muted-foreground ml-2">
                    {card.changeText}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
