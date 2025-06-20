import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MessageCircle, Clock, Globe } from "lucide-react";

export default function ContactInfo() {
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Immediate Help?</h3>
          <p className="text-blue-700 text-sm">Multiple ways to reach our support team</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email Support */}
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mb-3">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <h4 className="font-medium text-slate-900 mb-1">Email Support</h4>
            <p className="text-sm text-slate-600 mb-2">Professional assistance via email</p>
            <a 
              href="mailto:maker-calc@pipps.app" 
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              maker-calc@pipps.app
            </a>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">24/7 Response</Badge>
            </div>
          </div>

          {/* Live Chat */}
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-3">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="font-medium text-slate-900 mb-1">Live Chat</h4>
            <p className="text-sm text-slate-600 mb-2">Instant messaging support</p>
            <span className="text-sm font-medium text-green-600">Available in-app</span>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">Mon-Fri 9AM-6PM EST</Badge>
            </div>
          </div>

          {/* WhatsApp Support */}
          <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
            <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mb-3">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <h4 className="font-medium text-slate-900 mb-1">WhatsApp Support</h4>
            <p className="text-sm text-slate-600 mb-2">Message us on WhatsApp</p>
            <a 
              href="https://wa.me/18767747372" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              876 774 7372
            </a>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">Business Hours</Badge>
            </div>
          </div>
        </div>

        {/* Support Hours */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-slate-500" />
            <div>
              <h4 className="font-medium text-slate-900">Support Hours</h4>
              <div className="text-sm text-slate-600 space-y-1">
                <div>Email Support: 24/7 response within 4-24 hours</div>
                <div>Live Chat & Phone: Monday-Friday, 9:00 AM - 6:00 PM EST</div>
                <div>Emergency Issues: Use email for fastest response</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}