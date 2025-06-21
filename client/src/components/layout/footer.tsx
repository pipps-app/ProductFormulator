import { Mail, Phone, Globe, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">PIPPS Maker Calc</h3>
            <p className="text-slate-400 mb-4">
              Professional formulation and cost management platform for product development teams.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">Global SaaS Platform</span>
              </div>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4" />
                <span className="text-sm">Available Worldwide</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-medium mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/materials" className="hover:text-white transition-colors">Materials</Link></li>
              <li><Link href="/formulations" className="hover:text-white transition-colors">Formulations</Link></li>
              <li><Link href="/vendors" className="hover:text-white transition-colors">Vendors</Link></li>
              <li><Link href="/subscription" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-medium mb-4">Support</h4>
            <ul className="space-y-2">
              <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><a href="mailto:maker-calc@pipps.app" className="hover:text-white transition-colors">Contact Support</a></li>
              <li><span className="text-slate-400">Live Chat (Mon-Fri)</span></li>
              <li><a href="https://wa.me/18767747372" className="hover:text-white transition-colors">WhatsApp: 876 774 7372</a></li>
            </ul>
          </div>

          {/* Contact & Hours */}
          <div>
            <h4 className="text-white font-medium mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Mail className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Email Support</div>
                  <a href="mailto:maker-calc@pipps.app" className="text-sm text-blue-400 hover:text-blue-300">
                    maker-calc@pipps.app
                  </a>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Phone className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">WhatsApp Support</div>
                  <a href="https://wa.me/18767747372" className="text-sm text-blue-400 hover:text-blue-300">876 774 7372</a>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Support Hours</div>
                  <div className="text-sm text-slate-400">
                    Mon-Fri: 9AM-6PM EST<br />
                    Email: 24/7 response
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-slate-400">
            © {currentYear} PIPPS Maker. All rights reserved.
          </div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="/privacy" className="text-sm text-slate-400 hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="/terms" className="text-sm text-slate-400 hover:text-white transition-colors">
              Terms of Service
            </a>
            <Link href="/support" className="text-sm text-slate-400 hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}