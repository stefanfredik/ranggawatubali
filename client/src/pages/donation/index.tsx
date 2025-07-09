import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DonationList } from "@/components/donation/donation-list";
import { Plus, Gift, HandHeart, HandHelping, Coins, Search } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="happy">Suka</TabsTrigger>
          <TabsTrigger value="sad">Duka</TabsTrigger>
          <TabsTrigger value="fundraising">Penggalangan Dana</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <DonationList />
        </TabsContent>
        <TabsContent value="happy">
          <DonationList type="happy" />
        </TabsContent>
        <TabsContent value="sad">
          <DonationList type="sad" />
        </TabsContent>
        <TabsContent value="fundraising">
          <DonationList type="fundraising" />
        </TabsContent>
      </Tabs>
    </div>
  );
}