import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  BookOpen,
  Video,
  FileText,
  Download,
  ExternalLink,
  Clock,
  User,
  Settings,
  CreditCard,
  Upload,
  Calculator
} from "lucide-react";

export default function HelpDocs() {
  const [searchQuery, setSearchQuery] = useState("");

  const documentationSections = [
    {
      title: "Getting Started",
      icon: BookOpen,
      articles: [
        {
          title: "Account Setup & First Login",
          description: "Create your account and complete initial setup",
          readTime: "5 min",
          popularity: "high"
        },
        {
          title: "Dashboard Overview",
          description: "Understanding your PIPPS Maker dashboard",
          readTime: "3 min",
          popularity: "high"
        },
        {
          title: "Creating Your First Material",
          description: "Step-by-step guide to adding raw materials",
          readTime: "7 min",
          popularity: "high"
        },
        {
          title: "Building Your First Formulation",
          description: "Complete tutorial for formulation creation",
          readTime: "10 min",
          popularity: "high"
        }
      ]
    },
    {
      title: "Materials Management",
      icon: Calculator,
      articles: [
        {
          title: "Adding Raw Materials",
          description: "How to add and organize materials",
          readTime: "4 min",
          popularity: "medium"
        },
        {
          title: "Material Categories & Organization",
          description: "Organizing materials with categories and tags",
          readTime: "6 min",
          popularity: "medium"
        },
        {
          title: "Vendor Management",
          description: "Managing supplier information and contacts",
          readTime: "5 min",
          popularity: "low"
        },
        {
          title: "Cost Tracking & Updates",
          description: "Keeping material costs current",
          readTime: "4 min",
          popularity: "medium"
        }
      ]
    },
    {
      title: "File Management",
      icon: Upload,
      articles: [
        {
          title: "Uploading & Organizing Files",
          description: "File upload, compression, and organization",
          readTime: "5 min",
          popularity: "high"
        },
        {
          title: "File Preview & Viewing",
          description: "Viewing PDFs, images, and documents",
          readTime: "3 min",
          popularity: "medium"
        },
        {
          title: "Attaching Files to Materials",
          description: "Linking specifications and certificates",
          readTime: "4 min",
          popularity: "high"
        },
        {
          title: "File Storage Limits by Plan",
          description: "Understanding storage quotas and limits",
          readTime: "2 min",
          popularity: "medium"
        }
      ]
    },
    {
      title: "Formulations",
      icon: FileText,
      articles: [
        {
          title: "Creating Formulations",
          description: "Building product formulations step-by-step",
          readTime: "8 min",
          popularity: "high"
        },
        {
          title: "Cost Calculations",
          description: "Understanding automated cost calculations",
          readTime: "6 min",
          popularity: "high"
        },
        {
          title: "Scaling Formulations",
          description: "Adjusting batch sizes and quantities",
          readTime: "5 min",
          popularity: "medium"
        },
        {
          title: "Exporting Formulation Data",
          description: "PDF and Excel export options",
          readTime: "4 min",
          popularity: "medium"
        }
      ]
    },
    {
      title: "Account & Billing",
      icon: CreditCard,
      articles: [
        {
          title: "Subscription Plans Overview",
          description: "Comparing Free, Basic, Premium, and Pro plans",
          readTime: "4 min",
          popularity: "high"
        },
        {
          title: "Upgrading Your Plan",
          description: "How to upgrade and payment methods",
          readTime: "3 min",
          popularity: "medium"
        },
        {
          title: "PayPal Integration Setup",
          description: "Connecting PayPal for subscription billing",
          readTime: "5 min",
          popularity: "low"
        },
        {
          title: "Managing Your Account",
          description: "Profile settings and preferences",
          readTime: "3 min",
          popularity: "low"
        }
      ]
    },
    {
      title: "Advanced Features",
      icon: Settings,
      articles: [
        {
          title: "Import/Export Data",
          description: "Bulk data operations and backups",
          readTime: "7 min",
          popularity: "low"
        },
        {
          title: "Shopify Integration",
          description: "Connecting with your Shopify store",
          readTime: "10 min",
          popularity: "low"
        },
        {
          title: "API Access & Integrations",
          description: "Developer documentation and API usage",
          readTime: "15 min",
          popularity: "low"
        },
        {
          title: "Custom Reporting",
          description: "Creating custom reports and analytics",
          readTime: "8 min",
          popularity: "low"
        }
      ]
    }
  ];

  const videoTutorials = [
    {
      title: "Complete Getting Started Guide",
      description: "Full walkthrough of PIPPS Maker setup and first use",
      duration: "12:30",
      thumbnail: "getting-started-thumb"
    },
    {
      title: "Material Management Masterclass",
      description: "Advanced techniques for organizing materials and costs",
      duration: "18:45",
      thumbnail: "materials-thumb"
    },
    {
      title: "Formulation Best Practices",
      description: "Professional tips for creating accurate formulations",
      duration: "15:20",
      thumbnail: "formulations-thumb"
    },
    {
      title: "File Management & Organization",
      description: "Efficient file handling and attachment strategies",
      duration: "9:15",
      thumbnail: "files-thumb"
    }
  ];

  const filteredSections = documentationSections.map(section => ({
    ...section,
    articles: section.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(section => section.articles.length > 0);

  const getPriorityColor = (popularity: string) => {
    switch (popularity) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Help Documentation</h1>
        <p className="text-slate-600">Comprehensive guides and tutorials for PIPPS Maker</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer">
          <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-medium">Quick Start</h3>
          <p className="text-sm text-slate-600">Get up and running fast</p>
        </Card>
        <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer">
          <Video className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-medium">Video Tutorials</h3>
          <p className="text-sm text-slate-600">Watch and learn</p>
        </Card>
        <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer">
          <Download className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-medium">PDF Guides</h3>
          <p className="text-sm text-slate-600">Download for offline</p>
        </Card>
        <Card className="text-center p-4 hover:shadow-md transition-shadow cursor-pointer">
          <ExternalLink className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <h3 className="font-medium">API Docs</h3>
          <p className="text-sm text-slate-600">Developer resources</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Documentation Sections */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Documentation</h2>
          <div className="space-y-6">
            {filteredSections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <section.icon className="h-5 w-5" />
                    <span>{section.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {section.articles.map((article, articleIndex) => (
                      <div key={articleIndex} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-900 mb-1">{article.title}</h4>
                          <p className="text-sm text-slate-600">{article.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span className="text-xs text-slate-500">{article.readTime}</span>
                          </div>
                          <Badge className={getPriorityColor(article.popularity)} variant="secondary">
                            {article.popularity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Video Tutorials */}
        <div>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Video Tutorials</h2>
          <div className="space-y-4">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="aspect-video bg-slate-200 rounded-lg mb-3 flex items-center justify-center">
                    <Video className="h-8 w-8 text-slate-500" />
                  </div>
                  <h4 className="font-medium text-slate-900 mb-1">{video.title}</h4>
                  <p className="text-sm text-slate-600 mb-2">{video.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">{video.duration}</span>
                    <ExternalLink className="h-4 w-4 text-slate-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 text-center">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Can't find what you're looking for?</h3>
          <p className="text-blue-700 mb-4">Our support team is here to help with personalized assistance</p>
          <div className="flex justify-center space-x-4">
            <a href="mailto:support@pippsmaker.com" className="text-blue-600 hover:text-blue-700 font-medium">
              Email Support
            </a>
            <span className="text-blue-300">•</span>
            <span className="text-blue-600 font-medium">Live Chat</span>
            <span className="text-blue-300">•</span>
            <span className="text-blue-600 font-medium">+1 (555) 123-PIPPS</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}