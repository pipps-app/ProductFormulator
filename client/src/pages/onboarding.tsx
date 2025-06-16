import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Zap, Users, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Onboarding() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  const createFreeAccountMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/users/create-trial", {
        email: email
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to main app
      window.location.href = "/dashboard";
      toast({
        title: "Welcome to PIPPS Maker Calc!",
        description: "Your free account is ready. Start creating your first formulation."
      });
    },
    onError: () => {
      toast({
        title: "Account creation failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    }
  });

  const handleStartFree = () => {
    if (email) {
      createFreeAccountMutation.mutate(email);
    } else {
      // Create anonymous trial account
      const anonymousEmail = `trial_${Date.now()}@trial.local`;
      createFreeAccountMutation.mutate(anonymousEmail);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to PIPPS Maker Calc
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional formulation and cost management for manufacturers
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Free Trial */}
          <Card className="border-2 border-green-200 bg-white shadow-lg">
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-700">Start Free Trial</CardTitle>
              <p className="text-gray-600">
                Explore all features instantly with no signup required
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Free Includes:</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• 5 raw materials</li>
                  <li>• 2 formulations</li>
                  <li>• 1 vendor</li>
                  <li>• Cost calculations</li>
                  <li>• Profit analysis</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email (optional for trial)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
                <Button 
                  onClick={handleStartFree}
                  disabled={createFreeAccountMutation.isPending}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  {createFreeAccountMutation.isPending ? "Creating Account..." : "Start Free Trial"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Paid Plans */}
          <Card className="border-2 border-blue-200 bg-white shadow-lg">
            <CardHeader className="text-center">
              <ShoppingCart className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-blue-700">Purchase Subscription</CardTitle>
              <p className="text-gray-600">
                Get unlimited access with professional features
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Starter Plan - $19/month</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 50 materials</li>
                    <li>• 25 formulations</li>
                    <li>• 10 vendors</li>
                    <li>• Email support</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">Professional - $49/month</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Unlimited materials</li>
                    <li>• Unlimited formulations</li>
                    <li>• Unlimited vendors</li>
                    <li>• Priority support</li>
                    <li>• Advanced analytics</li>
                  </ul>
                </div>
              </div>

              <Button 
                onClick={() => window.location.href = "/subscription"}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                View Pricing Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Already have an account from a Shopify purchase? Contact support for login assistance.
          </p>
        </div>
      </div>
    </div>
  );
}