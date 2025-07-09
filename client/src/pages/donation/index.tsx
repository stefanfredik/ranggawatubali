import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { DonationList } from "@/components/donation/donation-list";
import { Plus, Gift, HandHeart, HandHelping, Coins, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function DonationIndexPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>("all");

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Donasi</h2>
          <p className="text-muted-foreground">
            Kelola semua donasi dan sumbangan dalam satu tempat.
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

      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Donasi</CardTitle>
          <CardDescription>
            Lihat ringkasan donasi berdasarkan kategori.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Suka
                </CardTitle>
                <HandHeart className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">
                  Total donasi untuk acara suka
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Duka
                </CardTitle>
                <HandHelping className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Total donasi untuk acara duka
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Penggalangan Dana
                </CardTitle>
                <Coins className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1</div>
                <p className="text-xs text-muted-foreground">
                  Total penggalangan dana aktif
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Kategori Donasi</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card Donasi Suka */}
          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-l-4 border-l-green-500"
            onClick={() => navigate('/donation/happy')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Donasi Suka</CardTitle>
              <HandHeart className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Donasi untuk acara bahagia seperti pernikahan, kelahiran, dan perayaan lainnya.
              </p>
              <div className="flex justify-between items-center">
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  2 Donasi Aktif
                </Badge>
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-950">
                  Lihat Semua
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card Donasi Duka */}
          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-l-4 border-l-blue-500"
            onClick={() => navigate('/donation/sad')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Donasi Duka</CardTitle>
              <HandHelping className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Donasi untuk membantu keluarga yang sedang berduka atau mengalami musibah.
              </p>
              <div className="flex justify-between items-center">
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  1 Donasi Aktif
                </Badge>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950">
                  Lihat Semua
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Card Penggalangan Dana */}
          <Card 
            className="hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-l-4 border-l-amber-500"
            onClick={() => navigate('/donation/fundraising')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">Penggalangan Dana</CardTitle>
              <Coins className="h-5 w-5 text-amber-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Penggalangan dana untuk proyek, pembangunan, atau kebutuhan organisasi.
              </p>
              <div className="flex justify-between items-center">
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                  1 Penggalangan Aktif
                </Badge>
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950">
                  Lihat Semua
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Semua Donasi</h3>
          <DonationList />
        </div>
      </div>
    </div>
  );
}