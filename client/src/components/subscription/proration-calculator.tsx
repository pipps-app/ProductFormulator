import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, DollarSign, Calendar, Info } from "lucide-react";

interface PlanPricing {
  id: string;
  name: string;
  price: number;
}

const plans: PlanPricing[] = [
  { id: "free", name: "Free", price: 0 },
  { id: "starter", name: "Starter", price: 7 },
  { id: "pro", name: "Pro", price: 19 },
  { id: "professional", name: "Professional", price: 39 },
  { id: "business", name: "Business", price: 65 },
  { id: "enterprise", name: "Enterprise", price: 149 }
];

interface ProrationResult {
  currentPlanCredit: number;
  newPlanCharge: number;
  prorationAmount: number;
  effectiveUpgradeDate: Date;
  nextBillingDate: Date;
}

export function ProrationCalculator() {
  const [currentPlan, setCurrentPlan] = useState<string>("");
  const [newPlan, setNewPlan] = useState<string>("");
  const [subscriptionStartDate, setSubscriptionStartDate] = useState<string>("");
  const [upgradeDate, setUpgradeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [result, setResult] = useState<ProrationResult | null>(null);

  const calculateProration = () => {
    if (!currentPlan || !newPlan || !subscriptionStartDate) {
      return;
    }

    const currentPlanData = plans.find(p => p.id === currentPlan);
    const newPlanData = plans.find(p => p.id === newPlan);
    
    if (!currentPlanData || !newPlanData) return;

    const startDate = new Date(subscriptionStartDate);
    const upgradeDateTime = new Date(upgradeDate);
    const nextBillingDate = new Date(startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    // Calculate days remaining in current billing cycle
    const totalDaysInCycle = 30; // Assuming 30-day billing cycles
    const daysUsed = Math.floor((upgradeDateTime.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, totalDaysInCycle - daysUsed);

    // Calculate proration
    const currentPlanCredit = (currentPlanData.price * daysRemaining) / totalDaysInCycle;
    const newPlanCharge = (newPlanData.price * daysRemaining) / totalDaysInCycle;
    const prorationAmount = newPlanCharge - currentPlanCredit;

    setResult({
      currentPlanCredit: Math.max(0, currentPlanCredit),
      newPlanCharge,
      prorationAmount,
      effectiveUpgradeDate: upgradeDateTime,
      nextBillingDate
    });
  };

  useEffect(() => {
    if (currentPlan && newPlan && subscriptionStartDate) {
      calculateProration();
    }
  }, [currentPlan, newPlan, subscriptionStartDate, upgradeDate]);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Subscription Proration Calculator
        </CardTitle>
        <p className="text-sm text-gray-600">
          Calculate prorated charges for mid-cycle plan upgrades
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currentPlan">Current Plan</Label>
            <Select value={currentPlan} onValueChange={setCurrentPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select current plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.filter(p => p.id !== 'free').map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/month
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPlan">Upgrade To</Label>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger>
                <SelectValue placeholder="Select new plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.filter(p => p.id !== 'free').map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/month
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Current Billing Cycle Start</Label>
            <Input
              id="startDate"
              type="date"
              value={subscriptionStartDate}
              onChange={(e) => setSubscriptionStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="upgradeDate">Upgrade Date</Label>
            <Input
              id="upgradeDate"
              type="date"
              value={upgradeDate}
              onChange={(e) => setUpgradeDate(e.target.value)}
            />
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Proration Calculation
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Current Plan Credit</p>
                <p className="text-lg font-bold text-red-700">
                  -${result.currentPlanCredit.toFixed(2)}
                </p>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">New Plan Charge</p>
                <p className="text-lg font-bold text-blue-700">
                  +${result.newPlanCharge.toFixed(2)}
                </p>
              </div>
              
              <div className={`p-3 rounded-lg ${result.prorationAmount >= 0 ? 'bg-green-50' : 'bg-orange-50'}`}>
                <p className={`text-sm font-medium ${result.prorationAmount >= 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {result.prorationAmount >= 0 ? 'Additional Charge' : 'Credit Applied'}
                </p>
                <p className={`text-lg font-bold ${result.prorationAmount >= 0 ? 'text-green-700' : 'text-orange-700'}`}>
                  ${Math.abs(result.prorationAmount).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Timeline
              </h4>
              <div className="text-sm space-y-1">
                <p><strong>Upgrade Effective:</strong> {result.effectiveUpgradeDate.toLocaleDateString()}</p>
                <p><strong>Next Full Billing:</strong> {result.nextBillingDate.toLocaleDateString()}</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Admin Instructions:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Collect ${Math.abs(result.prorationAmount).toFixed(2)} {result.prorationAmount >= 0 ? 'additional payment' : 'credit to customer'}</li>
                    <li>Update user's subscription plan to {plans.find(p => p.id === newPlan)?.name}</li>
                    <li>Keep current billing cycle end date ({result.nextBillingDate.toLocaleDateString()})</li>
                    <li>Next billing will be full ${plans.find(p => p.id === newPlan)?.price}/month</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProrationCalculator;
