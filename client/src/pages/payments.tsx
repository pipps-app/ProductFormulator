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
  const [newPayment, setNewPayment] = useState({
    userId: "1",
    transactionId: "",
    paymentProcessor: "paypal",
    amount: "",
    currency: "USD",
    subscriptionTier: "pro",
    paymentType: "subscription",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all payments for user
  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["/api/payments/user/1"],
    select: (data: Payment[]) => data.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime())
  });

  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: (paymentData: any) => apiRequest("/api/payments", "POST", paymentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setNewPayment({
        userId: "1",
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
        <h1 className="text-2xl font-bold">Payment Management</h1>
      </div>

      {/* Record New Payment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Record New Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreatePayment} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={newPayment.transactionId}
                onChange={(e) => setNewPayment({ ...newPayment, transactionId: e.target.value })}
                placeholder="TXN_12345_PAYPAL"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                placeholder="29.99"
                required
              />
            </div>

            <div>
              <Label htmlFor="processor">Payment Processor</Label>
              <Select
                value={newPayment.paymentProcessor}
                onValueChange={(value) => setNewPayment({ ...newPayment, paymentProcessor: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="manual">Manual/Bank Transfer</SelectItem>
                  <SelectItem value="shopify">Shopify</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select
                value={newPayment.subscriptionTier}
                onValueChange={(value) => setNewPayment({ ...newPayment, subscriptionTier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pro">Pro ($29.99/month)</SelectItem>
                  <SelectItem value="business">Business ($59.99/month)</SelectItem>
                  <SelectItem value="enterprise">Enterprise ($99.99/month)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentType">Payment Type</Label>
              <Select
                value={newPayment.paymentType}
                onValueChange={(value) => setNewPayment({ ...newPayment, paymentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscription">New Subscription</SelectItem>
                  <SelectItem value="renewal">Renewal</SelectItem>
                  <SelectItem value="upgrade">Plan Upgrade</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={newPayment.notes}
                onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>

            <div className="md:col-span-2">
              <Button 
                type="submit" 
                disabled={createPaymentMutation.isPending}
                className="w-full"
              >
                {createPaymentMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Record Payment
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
                      {payment.paymentStatus === "completed" && (
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