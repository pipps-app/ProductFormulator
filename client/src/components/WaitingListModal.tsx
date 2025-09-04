import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, CheckCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface WaitingListModalProps {
  plan: {
    id: string;
    name: string;
    price: number;
  };
  children: React.ReactNode;
}

export function WaitingListModal({ plan, children }: WaitingListModalProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const joinWaitingList = useMutation({
    mutationFn: async (data: { email: string; name: string; planInterest: string }) => {
      const response = await apiRequest("POST", "/api/waiting-list", data);
      return response.json();
    },
    onSuccess: (data) => {
      setSuccess(true);
      toast({
        title: "Successfully joined waiting list!",
        description: `We'll notify you when the ${plan.name} plan becomes available.`,
        duration: 5000,
      });
      // Reset form after 3 seconds
      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
        setEmail("");
        setName("");
      }, 3000);
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
    if (!email || !name) {
      toast({
        title: "Missing required fields",
        description: "Please fill in your name and email",
        variant: "destructive",
      });
      return;
    }
    joinWaitingList.mutate({
      email: email.trim(),
      name: name.trim(),
      planInterest: plan.id
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <span>Join {plan.name} Waiting List</span>
          </DialogTitle>
          <DialogDescription>
            Get notified when the {plan.name} plan (${plan.price}/month) becomes available. 
            Early supporters get 30% off their first 3 months!
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              You're on the list! 🎉
            </h3>
            <p className="text-green-700">
              We'll email you as soon as the {plan.name} plan is ready.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                <strong>Early Access Benefits:</strong> 30% off first 3 months, priority support, and input on new features.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={joinWaitingList.isPending}
            >
              {joinWaitingList.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Join Waiting List
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
