import { NavHeader } from "@/components/nav-header";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowDownCircle, ArrowUpCircle, Receipt, PiggyBank } from "lucide-react";
import { useLocation } from "wouter";

export default function FinancePage() {
  const [, navigate] = useLocation();

  const financeModules = [
    {
      id: "wallet",
      title: "Dompet Saldo",
      description: "Kelola saldo organisasi",
      icon: Wallet,
      color: "from-blue-500 to-blue-700",
      path: "/finance/wallet"
    },
    {
      id: "income",
      title: "Pemasukan",
      description: "Kelola pemasukan dana",
      icon: ArrowDownCircle,
      color: "from-green-500 to-green-700",
      path: "/finance/income"
    },
    {
      id: "expense",
      title: "Pengeluaran",
      description: "Kelola pengeluaran dana",
      icon: ArrowUpCircle,
      color: "from-red-500 to-red-700",
      path: "/finance/expense"
    },
    {
      id: "dues",
      title: "Iuran",
      description: "Kelola iuran anggota",
      icon: Receipt,
      color: "from-purple-500 to-purple-700",
      path: "/finance/dues"
    },
    {
      id: "initial",
      title: "Uang Pangkal",
      description: "Kelola uang pangkal anggota",
      icon: PiggyBank,
      color: "from-amber-500 to-amber-700",
      path: "/finance/initial"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-all duration-300">
      <NavHeader />
      <main className="md:ml-64 p-4 md:p-8 pt-20 md:pt-20 transition-all duration-300">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Keuangan</h1>
          <p className="text-muted-foreground mt-1">
            Kelola keuangan organisasi di sini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {financeModules.map((module) => (
            <Card 
              key={module.id} 
              variant="glass"
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
        </div>
      </main>
    </div>
  );
}