import React from 'react';
import { useQuery } from "@tanstack/react-query";
import AdminSubscriptionDashboard from "@/components/admin/subscription-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function AdminPage() {
  const { data: userInfo } = useQuery({
    queryKey: ["/api/user"]
  });

  // Check if user is admin (you may need to adjust this based on your user structure)
  const isAdmin = userInfo?.role === 'admin' || userInfo?.email?.includes('admin') || userInfo?.isAdmin;

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">
              You don't have permission to access the admin dashboard. 
              Please contact an administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <AdminSubscriptionDashboard />
    </div>
  );
}
