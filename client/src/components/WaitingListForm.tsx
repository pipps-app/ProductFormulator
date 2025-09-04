import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Clock, 
  Mail, 
  CheckCircle, 
  AlertCircle, 
  Users, 
  Bell,
  Star,
  Gift
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WaitingListFormProps {
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
    popular?: boolean;
  };
  onSuccess?: () => void;
}

interface WaitingListData {
  email: string;
  name: string;
  company?: string;
  planInterest: string;
  currentUsageEstimate?: string;
  phone?: string;
  message?: string;
}

export function WaitingListForm({ plan, onSuccess }: WaitingListFormProps) {
  const [formData, setFormData] = useState<WaitingListData>({
    email: "",
    name: "",
    company: "",
    planInterest: plan.id,
    currentUsageEstimate: "",
    phone: "",
    message: ""
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const joinWaitingList = useMutation({
    mutationFn: async (data: WaitingListData) => {
      const response = await apiRequest("POST", "/api/waiting-list", data);
      return response.json();
    },
    onSuccess: (data) => {
      setShowSuccess(true);
      setFormData({
        email: "",
        name: "",
        company: "",
        planInterest: plan.id,
        currentUsageEstimate: "",
        phone: "",
        message: ""
      });
      
      toast({
        title: "Successfully joined waiting list!",
        description: data.message,
        duration: 8000,
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to join waiting list",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.name) {
      toast({
        title: "Missing required fields",
        description: "Please fill in your name and email",
        variant: "destructive",
      });
      return;
    }
    joinWaitingList.mutate(formData);
  };

  const handleInputChange = (field: keyof WaitingListData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                You're on the list! 🎉
              </h3>
              <p className="text-green-700 mt-2">
                We'll notify you as soon as the <strong>{plan.name}</strong> plan becomes available.
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                <Gift className="h-4 w-4" />
                <span className="font-medium">Early Access Bonus</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                Waiting list members get 30% off their first 3 months!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-orange-800">
            Join {plan.name} Waiting List
          </CardTitle>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            Coming Soon
          </Badge>
        </div>
        <div className="flex items-center space-x-2 text-sm text-orange-600">
          <Clock className="h-4 w-4" />
          <span>Expected launch: 2-4 weeks</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Your full name"
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="your@email.com"
                className="mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company" className="text-sm font-medium">
                Company
              </Label>
              <Input
                id="company"
                type="text"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                placeholder="Your company name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone" className="text-sm font-medium">
                Phone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Your phone number"
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="usage" className="text-sm font-medium">
              Current usage estimate
            </Label>
            <Input
              id="usage"
              type="text"
              value={formData.currentUsageEstimate}
              onChange={(e) => handleInputChange("currentUsageEstimate", e.target.value)}
              placeholder="e.g., 50 materials, 10 formulations"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Help us understand your needs
            </p>
          </div>

          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Message
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange("message", e.target.value)}
              placeholder="Any specific features you're looking for?"
              className="mt-1"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.message.length}/500 characters
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-orange-200">
            <div className="flex items-start space-x-3">
              <Star className="h-5 w-5 text-orange-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-800">
                  Early Access Benefits
                </p>
                <ul className="text-xs text-orange-700 mt-1 space-y-1">
                  <li>• 30% discount on first 3 months</li>
                  <li>• Priority onboarding support</li>
                  <li>• Input on new features</li>
                  <li>• Founder badge recognition</li>
                </ul>
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={joinWaitingList.isPending}
          >
            {joinWaitingList.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining waiting list...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Join Waiting List
              </>
            )}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-orange-200">
          <div className="flex items-center justify-center space-x-2 text-xs text-orange-600">
            <Users className="h-4 w-4" />
            <span>Join others waiting for this plan</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WaitingListBanner() {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-orange-800">
            🚀 Soft Launch Mode
          </h3>
          <p className="text-sm text-orange-700 mt-1">
            We're currently in soft launch! Higher-tier plans are coming soon. 
            Join the waiting list to get early access with special pricing.
          </p>
        </div>
      </div>
    </div>
  );
}
