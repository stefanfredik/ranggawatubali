import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Eye } from "lucide-react";
import { format } from "date-fns";

export function PaymentCards() {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const [statusFilter, setStatusFilter] = useState("all");

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100";
      case "approved":
        return "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100";
      case "rejected":
        return "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const filteredPayments = payments?.filter((payment: any) => {
    return statusFilter === "all" || payment.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Payment Verification</h2>
            <p className="text-muted-foreground mt-1">
              Review and verify member payment submissions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="glassmorphism-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="space-y-3 mb-4">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-32 w-full rounded-xl mb-4" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Verification</h2>
          <p className="text-muted-foreground mt-1">
            Review and verify member payment submissions
          </p>
        </div>
        <div className="flex space-x-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 glassmorphism border-0">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!filteredPayments?.length ? (
        <Card className="glassmorphism-card border-0">
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No payment submissions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPayments.map((payment: any) => (
            <Card key={payment.id} className="glassmorphism-card border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {getUserInitials(payment.user.fullName)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{payment.user.fullName}</h4>
                      <p className="text-xs text-muted-foreground">
                        @{payment.user.username}
                      </p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Amount:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Period:</span>
                    <span className="text-sm font-medium">{payment.period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Submitted:</span>
                    <span className="text-sm font-medium">
                      {format(new Date(payment.submittedAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>

                {/* Payment Proof */}
                {payment.proofImageUrl && (
                  <div className="mb-4">
                    <img
                      src={payment.proofImageUrl}
                      alt="Payment proof"
                      className="w-full h-32 object-cover rounded-xl"
                    />
                  </div>
                )}

                {payment.status === "pending" ? (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="mr-1" size={14} />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <X className="mr-1" size={14} />
                      Reject
                    </Button>
                    <Button variant="ghost" size="sm" className="px-3">
                      <Eye size={14} />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-sm font-medium">
                    {payment.status === "approved" ? (
                      <span className="text-green-600 dark:text-green-400">
                        <Check className="inline mr-1" size={14} />
                        Payment Verified
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        <X className="inline mr-1" size={14} />
                        Payment Rejected
                      </span>
                    )}
                    {payment.reviewedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(payment.reviewedAt), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
