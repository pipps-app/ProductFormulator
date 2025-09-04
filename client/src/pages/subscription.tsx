import { useState } from "react";
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, Building, Zap, CreditCard, ArrowUp, ArrowDown, HelpCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

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
  maxVendors: number;
  maxCategories: number;
  maxFileAttachments: number;
  maxStorageSize: number;
  support: string;
}

const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "forever",
    maxMaterials: 5,
    maxFormulations: 1,
    maxVendors: 2,
    maxCategories: 2,
    maxFileAttachments: 1,
    maxStorageSize: 5,
    support: "Help documentation",
    features: [
      "Up to 5 raw materials",
      "Up to 1 formulation",
      "2 vendors & 2 categories",
      "Basic cost calculations",
      "1 file attachment",
      "5MB storage",
      "Help documentation"
    ]
  },
  {
    id: "starter",
    name: "Starter",
    price: 7,
    interval: "month",
    maxMaterials: 20,
    maxFormulations: 8,
    maxVendors: 5,
    maxCategories: 5,
    maxFileAttachments: 5,
    maxStorageSize: 30,
    support: "Email support",
    features: [
      "Up to 20 raw materials",
      "Up to 8 formulations",
      "5 vendors & 5 categories",
      "Basic cost calculations",
      "5 file attachments",
      "30MB storage",
      "Email support"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    interval: "month",
    popular: true,
    maxMaterials: 100,
    maxFormulations: 25,
    maxVendors: 10,
    maxCategories: 10,
    maxFileAttachments: 10,
    maxStorageSize: 100,
    support: "Email support",
    features: [
      "Up to 100 raw materials",
      "Up to 25 formulations",
      "10 vendors & 10 categories",
      "CSV import/export",
      "10 file attachments",
      "100MB storage",
      "Email support",
      "Cost optimization tools"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    price: 39,
    interval: "month",
    maxMaterials: 300,
    maxFormulations: 60,
    maxVendors: 20,
    maxCategories: 20,
    maxFileAttachments: 25,
    maxStorageSize: 500,
    support: "Priority email support",
    features: [
      "Up to 300 raw materials",
      "Up to 60 formulations",
      "20 vendors & 20 categories",
      "Advanced cost analytics",
      "25 file attachments",
      "500MB storage",
      "Priority email support",
      "Batch optimization"
    ]
  },
  {
    id: "business",
    name: "Business", 
    price: 65,
    interval: "month",
    maxMaterials: 500,
    maxFormulations: 100,
    maxVendors: 25,
    maxCategories: 25,
    maxFileAttachments: 50,
    maxStorageSize: 1000,
    support: "Priority email support",
    features: [
      "Up to 500 raw materials",
      "Up to 100 formulations",
      "25 vendors & 25 categories",
      "Advanced reporting & analytics",
      "50 file attachments",
      "1GB storage",
      "Priority email support",
      "Multi-user access"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 149,
    interval: "month",
    maxMaterials: 1000,
    maxFormulations: 250,
    maxVendors: 50,
    maxCategories: 50,
    maxFileAttachments: 100,
    maxStorageSize: 10000,
    support: "Dedicated support manager",
    features: [
      "Up to 1,000 raw materials",
      "Up to 250 formulations",
      "50 vendors & 50 categories",
      "Premium reporting suite & custom analytics",
      "100 file attachments",
      "10GB storage",
      "Dedicated support manager",
      "Custom integrations"
    ]
  }
];

export default function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [pendingDowngradeRequests, setPendingDowngradeRequests] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Parse URL parameters to highlight specific plan
  React.useEffect(() => {
    const urlParams = new URLSearchParams(location.split('?')[1] || '');
    const planParam = urlParams.get('plan');
    const sourceParam = urlParams.get('source');
    
    if (planParam && sourceParam === 'reports') {
      const targetPlan = plans.find(plan => plan.id === planParam);
      if (targetPlan) {
        // Scroll to plans section and highlight the target plan
        setTimeout(() => {
          document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' });
          // Optional: show a toast about the recommended upgrade
          toast({
            title: `${targetPlan.name} Plan Recommended`,
            description: `This plan will unlock the reports you were viewing.`,
            duration: 5000
          });
        }, 500);
      }
    }
  }, [location, toast]);

  // Helper function to determine plan relationship
  const getPlanRelationship = (targetPlan: SubscriptionPlan, currentPlan: SubscriptionPlan | null) => {
    if (!currentPlan) return 'new';
    if (targetPlan.id === currentPlan.id) return 'current';
    if (targetPlan.price > currentPlan.price) return 'upgrade';
    if (targetPlan.price < currentPlan.price) return 'downgrade';
    return 'change';
  };

  const { data: subscriptionStatus } = useQuery({
    queryKey: ["/api/subscription/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/subscription/status");
      return response.json();
    },
  });

  const getCurrentPlan = () => {
    if (!subscriptionStatus?.plan) return null;
    return plans.find(plan => plan.id === subscriptionStatus.plan);
  };

  const subscribeMutation = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      // For downgrades, mark as pending to prevent multiple submissions
      const currentPlan = getCurrentPlan();
      if (currentPlan && plan.price < currentPlan.price) {
        setPendingDowngradeRequests(prev => new Set([...prev, plan.id]));
      }
      
      const response = await apiRequest("POST", "/api/subscribe", {
        planId: plan.id
      });
      return response.json();
    },
    onSuccess: (data, plan) => {
      if (data.type === 'upgrade_request' && data.success) {
        // Upgrade request submitted - show confirmation
        toast({
          title: "Upgrade Request Submitted",
          description: data.message,
          duration: 8000
        });
        // Don't redirect or invalidate queries - just show success message
      } else if (data.type === 'downgrade' && data.success) {
        // Downgrade - show confirmation message and keep request marked as pending
        toast({
          title: "Downgrade Request Submitted",
          description: data.message,
          duration: 8000 // Show longer for important message
        });
        // Refresh subscription status to show pending change
        queryClient.invalidateQueries({ queryKey: ["/api/subscription/status"] });
        // Don't remove from pendingDowngradeRequests - keep button disabled
      }
    },
    onError: (error: any, plan) => {
      // Remove from pending requests on error so user can try again
      setPendingDowngradeRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(plan.id);
        return newSet;
      });
      
      toast({
        title: "Subscription change failed",
        description: error.message || "Failed to process subscription change",
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

  const currentPlan = getCurrentPlan();
  const isActive = subscriptionStatus?.status === 'active';

  // Check if any subscription action is in progress
  const isAnyActionInProgress = () => {
    return (
      subscribeMutation.isPending || 
      activateSubscription.isPending || 
      pendingDowngradeRequests.size > 0
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">Choose Your Plan</h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Start free, then upgrade when you need more. 14-day money-back guarantee on all paid plans.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="text-blue-800 font-medium">Free plan available • Secure payment via Shopify • 14-day money-back guarantee on paid plans</p>
        </div>
      </div>

      {/* Current Subscription Status */}
      <Card className={`border-2 ${isActive ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isActive ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <Calendar className="h-5 w-5 text-gray-600" />
                )}
              </div>
              <div>
                <CardTitle className={isActive ? 'text-green-900' : 'text-gray-900'}>
                  {isActive ? 'Active Subscription' : 'Current Plan'}
                </CardTitle>
                <p className={isActive ? 'text-green-700' : 'text-gray-700'}>
                  {currentPlan ? 
                    `You're currently on the ${currentPlan.name} plan${!isActive ? ' (inactive)' : ''}` :
                    'You\'re on the Free plan'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {subscriptionStatus?.status ? subscriptionStatus.status.toUpperCase() : 'FREE'}
              </Badge>
              {currentPlan && currentPlan.price > 0 && (
                <Badge variant="outline">
                  ${currentPlan.price}/{currentPlan.interval}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending Plan Change Alert */}
          {subscriptionStatus?.pendingPlanChange && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-800">
                    Scheduled Plan Change
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Your plan will change to <strong>{subscriptionStatus.pendingPlanChange}</strong> on{' '}
                    {subscriptionStatus.planChangeEffectiveDate ? 
                      new Date(subscriptionStatus.planChangeEffectiveDate).toLocaleDateString() : 
                      'your next billing date'
                    }. You'll keep your current features until then.
                  </p>
                </div>
              </div>
            </div>
          )}

            {/* Current Plan Usage */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Building className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                <span className={`text-sm ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                  {currentPlan ? 
                    (currentPlan.maxMaterials === -1 ? 'Unlimited' : `${currentPlan.maxMaterials}`) : '5'
                  } materials
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                <span className={`text-sm ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                  {currentPlan ? 
                    (currentPlan.maxFormulations === -1 ? 'Unlimited' : `${currentPlan.maxFormulations}`) : '1'
                  } formulations
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
                <span className={`text-sm ${isActive ? 'text-green-700' : 'text-gray-700'}`}>
                  {subscriptionStatus?.endDate ? 
                    `Renews ${new Date(subscriptionStatus.endDate).toLocaleDateString()}` : 
                    'No expiration'
                  }
                </span>
              </div>
            </div>

            {/* Quick Actions for Plan Changes */}
            <div className={`pt-4 border-t ${isActive ? 'border-green-200' : 'border-gray-200'}`}>
              <div className="flex flex-wrap gap-2 justify-center">
                {!currentPlan && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Choose Plan
                  </Button>
                )}
                {currentPlan && currentPlan.id !== 'free' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Change Plan
                  </Button>
                )}
                {currentPlan && currentPlan.id !== 'enterprise' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-green-600 hover:text-green-700"
                  >
                    Upgrade
                  </Button>
                )}
                {currentPlan && currentPlan.id !== 'free' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                    className="text-orange-600 hover:text-orange-700"
                  >
                    Downgrade
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Shopify Purchase Instructions */}
      {selectedPlan && selectedPlan.price > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Complete Your Purchase</CardTitle>
            <p className="text-blue-700">
              After purchasing the {selectedPlan.name} plan in our store, your subscription will be automatically activated.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              A new tab has opened with your selected plan. Complete your purchase there and return here to see your updated subscription status.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Refresh Subscription Status
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div id="plans-section" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <Check className="h-4 w-4 mr-2" />
                    Current Plan
                  </Button>
                ) : (
                  <>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSubscribe(plan)}
                      disabled={isAnyActionInProgress()}
                    >
                      {plan.price === 0 ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          {(() => {
                            if (activateSubscription.isPending) return "Activating...";
                            if (isAnyActionInProgress()) return "Please wait...";
                            return "Start Free";
                          })()}
                        </>
                      ) : (
                        <>
                          {(() => {
                            const relationship = getPlanRelationship(plan, currentPlan || null);
                            
                            // Show processing state for the active action
                            if (subscribeMutation.isPending) {
                              return (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Processing...
                                </>
                              );
                            }
                            
                            // Show disabled state if other actions are in progress
                            if (isAnyActionInProgress() && !pendingDowngradeRequests.has(plan.id)) {
                              return (
                                <>
                                  <HelpCircle className="h-4 w-4 mr-2" />
                                  Please wait...
                                </>
                              );
                            }
                            
                            switch (relationship) {
                              case 'upgrade':
                                return (
                                  <>
                                    <ArrowUp className="h-4 w-4 mr-2" />
                                    Upgrade to {plan.name}
                                  </>
                                );
                              case 'downgrade':
                                if (pendingDowngradeRequests.has(plan.id)) {
                                  return (
                                    <>
                                      <Check className="h-4 w-4 mr-2" />
                                      Downgrade Requested
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    <ArrowDown className="h-4 w-4 mr-2" />
                                    Downgrade to {plan.name}
                                  </>
                                );
                              default:
                                return (
                                  <>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Subscribe for ${plan.price}/month
                                  </>
                                );
                            }
                          })()}
                        </>
                      )}
                    </Button>
                    
                    {/* Pending Downgrade Request Notice */}
                    {pendingDowngradeRequests.has(plan.id) && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-center space-x-2">
                          <AlertCircle className="h-4 w-4 text-orange-600" />
                          <span className="text-xs text-orange-800 font-medium">
                            Downgrade request submitted - processing manually
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Price Change Information */}
                    {currentPlan && currentPlan.id !== plan.id && plan.price > 0 && !pendingDowngradeRequests.has(plan.id) && (
                      <div className="mt-2 text-xs text-center text-slate-500">
                        {plan.price > currentPlan.price ? (
                          <span className="text-green-600">
                            +${(plan.price - currentPlan.price).toFixed(2)}/month more
                          </span>
                        ) : plan.price < currentPlan.price ? (
                          <span className="text-orange-600">
                            -${(currentPlan.price - plan.price).toFixed(2)}/month savings
                          </span>
                        ) : null}
                      </div>
                    )}
                  </>
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
                  <td className="p-4 font-medium">Vendors</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.maxVendors === -1 ? "Unlimited" : plan.maxVendors}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">Categories</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.maxCategories === -1 ? "Unlimited" : plan.maxCategories}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">File Attachments</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.maxFileAttachments === -1 ? "Unlimited" : plan.maxFileAttachments}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-medium">Storage</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="text-center p-4">
                      {plan.maxStorageSize >= 1000 ? `${plan.maxStorageSize/1000}GB` : `${plan.maxStorageSize}MB`}
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
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Can I change my plan later?</h4>
            <p className="text-slate-600 mb-2">Yes, you can upgrade or downgrade your plan at any time. Here's how it works:</p>
            <ul className="text-slate-600 text-sm space-y-1 ml-4">
              <li>• <strong>Upgrades:</strong> Take effect immediately with prorated billing</li>
              <li>• <strong>Downgrades:</strong> Take effect at your next billing cycle</li>
              <li>• <strong>Data:</strong> All your data is preserved during plan changes</li>
              <li>• <strong>Features:</strong> New features become available immediately on upgrade</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">What happens when I downgrade?</h4>
            <p className="text-slate-600 mb-2">Your existing data is safe, but you may be limited by the new plan's restrictions:</p>
            <ul className="text-slate-600 text-sm space-y-1 ml-4">
              <li>• You can still view all existing materials/formulations</li>
              <li>• New additions are limited by your new plan's limits</li>
              <li>• Advanced features become unavailable but data remains</li>
              <li>• You can upgrade anytime to regain full access</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">What payment methods do you accept?</h4>
            <p className="text-slate-600">We accept all major credit cards (Visa, MasterCard, American Express) through our secure Shopify payment system. PayPal is also available.</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Is there a free trial?</h4>
            <p className="text-slate-600">We offer a <strong>14-day money-back guarantee</strong> instead of a free trial. This is better because you get full access immediately and can request a full refund if not satisfied.</p>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">How do billing cycles work for plan changes?</h4>
            <p className="text-slate-600 mb-2">We make billing simple and fair:</p>
            <ul className="text-slate-600 text-sm space-y-1 ml-4">
              <li>• <strong>Upgrades:</strong> Immediate access, prorated charge for the remainder of the cycle</li>
              <li>• <strong>Downgrades:</strong> Keep current features until next billing date, then switch</li>
              <li>• <strong>Monthly billing:</strong> Changes apply to your monthly renewal date</li>
              <li>• <strong>No hidden fees:</strong> Transparent pricing with no setup or cancellation fees</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-slate-900 mb-2">Can I cancel anytime?</h4>
            <p className="text-slate-600">Yes! You can cancel your subscription anytime. Your access continues until the end of your paid period, then you'll be moved to the free plan (you keep all your data).</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}