import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Mail,
  Calculator
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ProrationCalculator from "../subscription/proration-calculator";

interface UpgradeRequest {
  id: string;
  email: string;
  company?: string;
  currentPlan: string;
  requestedPlan: string;
  requestDate: string;
  status: 'pending' | 'processed' | 'cancelled';
}

interface PaymentData {
  userId: number;
  transactionId: string;
  amount: string;
  currency: string;
  paymentProcessor: string;
  subscriptionTier: string;
  paymentType: string;
  notes: string;
}

export function AdminSubscriptionDashboard() {
  const [activeTab, setActiveTab] = useState("requests");
  const [paymentData, setPaymentData] = useState<PaymentData>({
    userId: 0,
    transactionId: '',
    amount: '',
    currency: 'USD',
    paymentProcessor: 'manual',
    subscriptionTier: '',
    paymentType: 'upgrade',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Mock data for upgrade requests (replace with actual API call)
  const { data: upgradeRequests } = useQuery({
    queryKey: ["/api/admin/upgrade-requests"],
    queryFn: async () => {
      // This would be an actual API call in your implementation
      return [
        {
          id: '1',
          email: 'user@example.com',
          company: 'Example Co',
          currentPlan: 'pro',
          requestedPlan: 'business',
          requestDate: new Date().toISOString(),
          status: 'pending'
        }
      ] as UpgradeRequest[];
    }
  });

  const processUpgradeMutation = useMutation({
    mutationFn: async (data: PaymentData) => {
      const response = await apiRequest("POST", "/api/payments", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upgrade Processed",
        description: "User subscription has been upgraded successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrade-requests"] });
      // Reset form
      setPaymentData({
        userId: 0,
        transactionId: '',
        amount: '',
        currency: 'USD',
        paymentProcessor: 'manual',
        subscriptionTier: '',
        paymentType: 'upgrade',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process upgrade",
        variant: "destructive"
      });
    }
  });

  const handleProcessUpgrade = (request: UpgradeRequest) => {
    // Pre-fill the payment form with request data
    setPaymentData({
      ...paymentData,
      subscriptionTier: request.requestedPlan,
      notes: `Upgrade from ${request.currentPlan} to ${request.requestedPlan} - Request ID: ${request.id}`
    });
    setActiveTab("payment");
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    processUpgradeMutation.mutate(paymentData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Admin Subscription Dashboard</h1>
        <Badge variant="outline" className="text-sm">
          Admin Panel
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Upgrade Requests
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Process Payment
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Proration Calculator
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Upgrade Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upgradeRequests && upgradeRequests.length > 0 ? (
                <div className="space-y-4">
                  {upgradeRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{request.email}</h3>
                          {request.company && (
                            <p className="text-sm text-gray-600">{request.company}</p>
                          )}
                        </div>
                        <Badge 
                          variant={request.status === 'pending' ? 'default' : 'secondary'}
                        >
                          {request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-500">Current Plan</p>
                          <p className="capitalize">{request.currentPlan}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Requested Plan</p>
                          <p className="capitalize font-medium text-blue-600">{request.requestedPlan}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Request Date</p>
                          <p>{new Date(request.requestDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-500">Actions</p>
                          <Button 
                            size="sm" 
                            onClick={() => handleProcessUpgrade(request)}
                            disabled={request.status !== 'pending'}
                          >
                            Process Upgrade
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending upgrade requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Process Subscription Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      type="number"
                      value={paymentData.userId || ''}
                      onChange={(e) => setPaymentData({...paymentData, userId: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="transactionId">Transaction ID</Label>
                    <Input
                      id="transactionId"
                      value={paymentData.transactionId}
                      onChange={(e) => setPaymentData({...paymentData, transactionId: e.target.value})}
                      placeholder="TXN_UPGRADE_123"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={paymentData.amount}
                      onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      placeholder="29.99"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="processor">Payment Processor</Label>
                    <Select 
                      value={paymentData.paymentProcessor} 
                      onValueChange={(value) => setPaymentData({...paymentData, paymentProcessor: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual/Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="shopify">Shopify</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tier">Subscription Tier</Label>
                    <Select 
                      value={paymentData.subscriptionTier} 
                      onValueChange={(value) => setPaymentData({...paymentData, subscriptionTier: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter ($7/month)</SelectItem>
                        <SelectItem value="pro">Pro ($19/month)</SelectItem>
                        <SelectItem value="professional">Professional ($39/month)</SelectItem>
                        <SelectItem value="business">Business ($65/month)</SelectItem>
                        <SelectItem value="enterprise">Enterprise ($149/month)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Payment Type</Label>
                    <Select 
                      value={paymentData.paymentType} 
                      onValueChange={(value) => setPaymentData({...paymentData, paymentType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscription">New Subscription</SelectItem>
                        <SelectItem value="renewal">Renewal</SelectItem>
                        <SelectItem value="upgrade">Upgrade</SelectItem>
                        <SelectItem value="one-time">One-time Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    placeholder="Additional notes about this payment..."
                    rows={3}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={processUpgradeMutation.isPending}
                  className="w-full"
                >
                  {processUpgradeMutation.isPending ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Record Payment & Activate Subscription
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator">
          <ProrationCalculator />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{upgradeRequests?.filter(r => r.status === 'pending').length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Waiting for processing
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">
                  Upgrades processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Calendar className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">~4h</div>
                <p className="text-xs text-muted-foreground">
                  Request to activation
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity to display</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AdminSubscriptionDashboard;
