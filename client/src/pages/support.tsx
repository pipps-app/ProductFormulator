import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Video,
  FileText,
  Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ContactInfo from "@/components/support/contact-info";

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    priority: "medium",
    category: "general",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Support ticket created",
      description: "We'll respond within 24 hours. Check your email for updates.",
    });
    
    setFormData({
      name: "",
      email: "",
      subject: "",
      priority: "medium",
      category: "general",
      message: ""
    });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      contact: "support@pippsmaker.com",
      responseTime: "Within 24 hours",
      availability: "24/7"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available in-app",
      responseTime: "Immediate",
      availability: "Mon-Fri 9AM-6PM EST"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with support",
      contact: "+1 (555) 123-PIPPS",
      responseTime: "Immediate",
      availability: "Business hours only"
    }
  ];

  const faqItems = [
    {
      question: "How do I reset my password?",
      answer: "Go to the login page and click 'Forgot Password'. Follow the email instructions."
    },
    {
      question: "What file formats are supported?",
      answer: "We support PDF, images (JPG, PNG, GIF), text files, and Excel spreadsheets."
    },
    {
      question: "How do I upgrade my subscription?",
      answer: "Visit your account settings and select a new plan. Changes take effect immediately."
    },
    {
      question: "Can I export my formulation data?",
      answer: "Yes, you can export formulations to PDF or Excel from the formulations page."
    }
  ];

  const resources = [
    {
      icon: BookOpen,
      title: "User Guide",
      description: "Complete guide to using PIPPS Maker",
      link: "/docs/user-guide"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step video walkthroughs",
      link: "/docs/tutorials"
    },
    {
      icon: FileText,
      title: "API Documentation",
      description: "For developers and integrations",
      link: "/docs/api"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support & Help</h1>
        <p className="text-slate-600">Get the help you need to succeed with PIPPS Maker</p>
      </div>

      {/* Contact Information */}
      <ContactInfo />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Support Ticket Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="h-5 w-5" />
              <span>Create Support Ticket</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="general">General Question</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing & Subscriptions</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Ticket"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-slate-200 pb-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-slate-900 mb-1">{item.question}</h4>
                    <p className="text-sm text-slate-600">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Help Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resources.map((resource, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <resource.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{resource.title}</h4>
                  <p className="text-sm text-slate-600">{resource.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Banner */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-900">All Systems Operational</h4>
              <p className="text-sm text-green-700">PIPPS Maker is running smoothly. Last updated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}