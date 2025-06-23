import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, UserPlus, Search, Calendar } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  email: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  company?: string;
}

export default function AdminSubscriptionsPage() {
  const [searchEmail, setSearchEmail] = useState("");
  const [subscriptionUpdate, setSubscriptionUpdate] = useState({
    email: "",
    subscriptionTier: "pro",
    subscriptionStatus: "active",
    duration: "1" // months
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user to check admin status
  const { data: currentUser } = useQuery({
    queryKey: ["/api/user"]
  });

  // Get all users (only if admin)
  const { data: users = [], isLoading, error } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: currentUser?.role === 'admin',
    select: (data: User[]) => data.sort((a, b) => a.email.localeCompare(b.email))
  });

  // Show access denied if not admin
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">Admin privileges required to access this page.</p>
        </div>
      </div>
    );
  }

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: (subscriptionData: any) => 
      apiRequest("/api/admin/update-subscription", "POST", subscriptionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setSubscriptionUpdate({
        email: "",
        subscriptionTier: "pro",
        subscriptionStatus: "active",
        duration: "1"
      });
      toast({
        title: "Subscription Updated",
        description: "User subscription has been successfully updated."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription.",
        variant: "destructive"
      });
    }
  });

  const handleUpdateSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    updateSubscriptionMutation.mutate(subscriptionUpdate);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      expired: "destructive"
    };
    return <Badge variant={variants[status] || "secondary"}>{(status || "unknown").toUpperCase()}</Badge>;
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800",
      pro: "bg-blue-100 text-blue-800",
      business: "bg-purple-100 text-purple-800",
      enterprise: "bg-yellow-100 text-yellow-800"
    };
    return (
      <Badge className={colors[tier] || colors.free}>
        {(tier || "free").toUpperCase()}
      </Badge>
    );
  };

  const filteredUsers = users.filter(user =>
    !searchEmail || user.email.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin - Subscription Management</h1>
      </div>

      {/* Update Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Update Customer Subscription
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Update user subscription after Shopify payment confirmation
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateSubscription} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Customer Email</Label>
              <Input
                id="email"
                type="email"
                value={subscriptionUpdate.email}
                onChange={(e) => setSubscriptionUpdate({ ...subscriptionUpdate, email: e.target.value })}
                placeholder="customer@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select
                value={subscriptionUpdate.subscriptionTier}
                onValueChange={(value) => setSubscriptionUpdate({ ...subscriptionUpdate, subscriptionTier: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Subscription Status</Label>
              <Select
                value={subscriptionUpdate.subscriptionStatus}
                onValueChange={(value) => setSubscriptionUpdate({ ...subscriptionUpdate, subscriptionStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (Months)</Label>
              <Select
                value={subscriptionUpdate.duration}
                onValueChange={(value) => setSubscriptionUpdate({ ...subscriptionUpdate, duration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Button 
                type="submit" 
                disabled={updateSubscriptionMutation.isPending}
                className="w-full"
              >
                Update Subscription
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users & Subscriptions</CardTitle>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <Input
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchEmail ? "No users found matching your search." : "No users found."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{user.email}</span>
                        {getStatusBadge(user.subscriptionStatus || "inactive")}
                        {getTierBadge(user.subscriptionPlan || "free")}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Email: {user.email}</div>
                        {user.company && <div>Company: {user.company}</div>}
                        {user.subscriptionStartDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Start: {new Date(user.subscriptionStartDate).toLocaleDateString()}
                          </div>
                        )}
                        {user.subscriptionEndDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            End: {new Date(user.subscriptionEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSubscriptionUpdate({
                          ...subscriptionUpdate,
                          email: user.email
                        })}
                      >
                        Quick Update
                      </Button>
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