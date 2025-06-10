import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CreditCard, Calendar, Building, Users, Zap } from "lucide-react";
import PayPalButton from "@/components/PayPalButton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
  popular?: boolean;
  maxMaterials: number;
  maxFormulations: number;
  support: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "forever",
    maxMaterials: 5,
    maxFormulations: 2,
    support: "Community support",
    features: [
      "Up to 5 raw materials",
      "Up to 2 formulations",
      "Basic cost calculations",
      "1 vendor",
      "Material categories",
      "Community support"
    ]
  },
  {
    id: "starter",
    name: "Starter",
    price: 19,
    interval: "month",
    popular: true,
    maxMaterials: 50,
    maxFormulations: 10,
    support: "Email support",
    features: [
      "Up to 50 raw materials",
      "Up to 10 formulations",
      "Unlimited vendors & categories",
      "Basic cost calculations",
      "Export to CSV",
      "Email support"
    ]
  },
  {
    id: "professional",
    name: "Professional", 
    price: 49,
    interval: "month",
    maxMaterials: -1, // Unlimited
    maxFormulations: -1, // Unlimited
    support: "Priority email support",
    features: [
      "Unlimited materials",
      "Unlimited formulations",
      "Advanced reporting & analytics",
      "Batch cost optimization",
      "Profit margin analysis",
      "Priority email support",
      "Advanced export options"
    ]
  }
];

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription/status");
      return response.json();
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const response = await apiRequest("POST", "/api/subscribe", {
        planId: plan.id
      });
      return response.json();
    },
    onSuccess: (data, plan) => {
      // Redirect to Shopify store for payment
      if (data.redirectUrl) {
        window.open(data.redirectUrl, '_blank');
        toast({
          title: "Redirecting to Shopify",
          description: "Complete your purchase in the new tab to activate your subscription"
        });
      }
    },
    onError: () => {
      toast({
        title: "Subscription failed",
        description: "Failed to redirect to payment page",
        variant: "destructive"
      });
    }
  });

  const activateSubscription = useMutation({
    mutationFn: async ({ orderId, planId }: { orderId: string; planId: string }) => {
      const response = await apiRequest("POST", "/api/subscription/activate", {
        orderId,
        planId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
      setShowPayPal(false);
      setSelectedPlan(null);
      toast({
        title: "Subscription activated!",
        description: "Your subscription is now active and ready to use"
      });
    },
    onError: () => {
      toast({
        title: "Activation failed",
        description: "Failed to activate subscription",
        variant: "destructive"
      });
    }
  });

  const handleSubscribe = (plan: SubscriptionPlan) => {
    if (plan.price === 0) {
      // Handle free tier activation
      activateSubscription.mutate({ orderId: "free", planId: plan.id });
    } else {
      subscribeMutation.mutate(plan);
    }
  };

  const getCurrentPlan = () => {
    if (!subscriptionStatus?.plan) return null;
    return plans.find(plan => plan.id === subscriptionStatus.plan);
  };

  const currentPlan = getCurrentPlan();
  const isActive = subscriptionStatus?.status === 'active';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Choose Your Plan</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Scale your formulation business with the right tools. Start with a plan that fits your needs and upgrade as you grow.
        </p>
      </div>

      {/* Current Subscription Status */}
      {isActive && currentPlan && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-900">Active Subscription</CardTitle>
                  <p className="text-green-700">You're currently on the {currentPlan.name} plan</p>
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {currentPlan.maxMaterials === -1 ? 'Unlimited' : `${currentPlan.maxMaterials}`} materials
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  {currentPlan.maxFormulations === -1 ? 'Unlimited' : `${currentPlan.maxFormulations}`} formulations
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">
                  Renews {new Date(subscriptionStatus.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PayPal Payment */}
      {showPayPal && selectedPlan && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Complete Your Subscription</CardTitle>
            <p className="text-blue-700">
              Complete your payment for the {selectedPlan.name} plan (${selectedPlan.price}/month)
            </p>
          </CardHeader>
          <CardContent>
            <div className="max-w-md mx-auto">
              <PayPalButton
                amount={selectedPlan.price.toString()}
                currency="USD"
                intent="CAPTURE"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.popular 
                ? "border-primary shadow-lg scale-105" 
                : "border-slate-200"
            } ${
              currentPlan?.id === plan.id 
                ? "ring-2 ring-green-500" 
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-slate-600">/{plan.interval}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200">
                {currentPlan?.id === plan.id && isActive ? (
                  <Button className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleSubscribe(plan)}
                    disabled={subscribeMutation.isPending || activateSubscription.isPending}
                  >
                    {plan.price === 0 ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        {activateSubscription.isPending ? "Activating..." : "Start Free"}
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {subscribeMutation.isPending ? "Processing..." : "Subscribe Now"}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Compare Features</CardTitle>
          <p className="text-slate-600">See what's included in each plan</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-4 font-medium">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="text-center p-4 font-medium">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 font-medium">Raw Materials</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.maxMaterials === -1 ? "Unlimited" : plan.maxMaterials}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">Formulations</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.maxFormulations === -1 ? "Unlimited" : plan.maxFormulations}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">Support</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.support}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Can I change my plan later?</h4>
            <p className="text-slate-600">Yes, you can upgrade or downgrade your plan at any time. Changes will be prorated.</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">What payment methods do you accept?</h4>
            <p className="text-slate-600">We accept all major credit cards and PayPal for convenient, secure payments.</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Is there a free trial?</h4>
            <p className="text-slate-600">We offer a 14-day free trial with full access to all features on any plan.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}