import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CreditCard, Search, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Payment {
  id: number;
  userId: number;
  transactionId: string;
  paymentProcessor: string;
  amount: string;
  currency: string;
  subscriptionTier: string;
  paymentType: string;
  paymentStatus: string;
  paymentDate: string;
  refundDate?: string;
  refundAmount?: string;
  notes?: string;
}

export default function PaymentsPage() {
  const [searchTransactionId, setSearchTransactionId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user info
  const { data: userInfo } = useQuery({
    queryKey: ["/api/user"]
  });

  const isAdmin = userInfo?.role === 'admin';

  const [newPayment, setNewPayment] = useState({
    userId: userInfo?.id?.toString() || "1",
    transactionId: "",
    paymentProcessor: "paypal",
    amount: "",
    currency: "USD",
    subscriptionTier: "pro",
    paymentType: "subscription",
    notes: ""
  });

  // Get all payments for current user
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/payments/user", userInfo?.id],
    enabled: !!userInfo?.id,
    select: (data: Payment[]) => data.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (paymentData: any) => apiRequest("/api/payments", "POST", paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setNewPayment({
        userId: userInfo?.id?.toString() || "1",
        transactionId: "",
        paymentProcessor: "paypal",
        amount: "",
        currency: "USD",
        subscriptionTier: "pro",
        paymentType: "subscription",
        notes: ""
      });
      toast({
        title: "Payment Recorded",
        description: "Transaction has been successfully recorded in the system."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record payment transaction.",
        variant: "destructive"
      });
    }
  });

  // Process refund mutation
  const refundMutation = useMutation({
    mutationFn: ({ paymentId, refundAmount }: { paymentId: number; refundAmount: string }) =>
      apiRequest(`/api/payments/${paymentId}/refund`, "POST", { refundAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      toast({
        title: "Refund Processed",
        description: "Refund has been processed and user subscription updated."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process refund.",
        variant: "destructive"
      });
    }
  });

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    createPaymentMutation.mutate({
      ...newPayment,
      userId: parseInt(newPayment.userId),
      amount: newPayment.amount
    });
  };

  const handleRefund = (payment: Payment) => {
    const refundAmount = prompt("Enter refund amount:", payment.amount);
    if (refundAmount) {
      refundMutation.mutate({ paymentId: payment.id, refundAmount });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>;
  };

  const filteredPayments = payments.filter(payment =>
    !searchTransactionId || payment.transactionId.toLowerCase().includes(searchTransactionId.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Payment History</h1>
        <Badge variant="outline" className="ml-2">Read Only</Badge>
      </div>
      <p className="text-muted-foreground">
        View payment records for activated subscriptions. Payments are processed through Shopify.
      </p>



      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search by transaction ID..."
              value={searchTransactionId}
              onChange={(e) => setSearchTransactionId(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading payment history...</div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTransactionId ? "No payments found matching your search." : "No payment records found."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{payment.transactionId}</span>
                        {getStatusBadge(payment.paymentStatus)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Amount: {payment.currency} {payment.amount}</div>
                        <div>Processor: {payment.paymentProcessor}</div>
                        <div>Tier: {payment.subscriptionTier} ({payment.paymentType})</div>
                        <div>Date: {new Date(payment.paymentDate).toLocaleDateString()}</div>
                        {payment.notes && <div>Notes: {payment.notes}</div>}
                        {payment.refundDate && (
                          <div className="text-red-600">
                            Refunded: {payment.currency} {payment.refundAmount} on {new Date(payment.refundDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && payment.paymentStatus === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefund(payment)}
                          disabled={refundMutation.isPending}
                        >
                          Process Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}