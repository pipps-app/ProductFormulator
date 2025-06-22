import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Upload, 
  Users, 
  Package, 
  FlaskRound,
  Settings,
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle,
  Info,
  FolderOpen
} from "lucide-react";

interface HelpTopic {
  id: string;
  title: string;
  category: string;
  content: string;
  steps?: string[];
  tips?: string[];
  warnings?: string[];
  icon: any;
  priority: "high" | "medium" | "low";
}

const helpTopics: HelpTopic[] = [
  {
    id: "getting-started",
    title: "Getting Started - Your First Steps",
    category: "Getting Started",
    icon: CheckCircle,
    priority: "high",
    content: "Welcome to PIPPS Maker Calc! Follow these simple steps to set up your account and create your first formulation.",
    steps: [
      "Complete your profile by clicking on your name in the top right corner",
      "Add your first vendor by going to Vendors → Add Vendor",
      "Create material categories by going to Categories → Add Category",
      "Add your first raw material by going to Raw Materials → Add Material",
      "Create your first formulation by going to Formulations → New Formulation"
    ],
    tips: [
      "Start with 2-3 vendors that you commonly use",
      "Create logical categories like 'Base Oils', 'Essential Oils', 'Packaging'",
      "Always fill in the cost and quantity for accurate calculations"
    ]
  },
  {
    id: "csv-import-setup",
    title: "CSV Import - Complete Guide",
    category: "Data Import",
    icon: Upload,
    priority: "high",
    content: "Import your materials from CSV files quickly and easily with automated setup features.",
    steps: [
      "Go to Import/Export in the sidebar menu",
      "Click 'Setup Vendors & Categories' to automatically create all required vendors and categories",
      "Prepare your CSV file with columns: name, sku, categoryName, vendorName, totalCost, quantity, unit, notes",
      "Drag and drop your CSV file into the upload area or click to browse",
      "Wait for import completion - you'll see a success message with material count",
      "If you accidentally import duplicates, click 'Remove Duplicates' to clean up"
    ],
    warnings: [
      "Always use Setup feature first to avoid vendor/category errors",
      "CSV import creates duplicate materials if run multiple times on same file",
      "Remove Duplicates feature permanently deletes extra materials"
    ],
    tips: [
      "The Setup feature works best with soap making and cosmetic supply data",
      "Download the template file to see correct CSV format",
      "Unit costs are automatically calculated from total cost and quantity",
      "Both CSV and JSON file formats are supported"
    ]
  },
  {
    id: "managing-duplicates",
    title: "Managing Duplicate Materials",
    category: "Data Management", 
    icon: AlertCircle,
    priority: "medium",
    content: "Learn how to identify and remove duplicate materials from your inventory system.",
    steps: [
      "Go to Import/Export in the sidebar",
      "Click 'Remove Duplicates' button to automatically find and remove duplicate materials",
      "The system will keep the first instance of each material name and delete the rest",
      "You'll see a confirmation message showing how many duplicates were removed",
      "Go to Raw Materials to verify the cleanup was successful"
    ],
    warnings: [
      "Duplicate removal is permanent - materials are deleted from the system",
      "The system matches materials by name (case-insensitive)",
      "Always review your materials before running duplicate removal"
    ],
    tips: [
      "Run duplicate removal after importing the same CSV file multiple times",
      "Use the refresh button in Raw Materials to see updated counts",
      "Consider exporting your data before major cleanup operations"
    ]
  },
  {
    id: "automated-setup",
    title: "Automated Setup for CSV Import",
    category: "Data Import",
    icon: Settings,
    priority: "high",
    content: "Use the automated setup feature to create all vendors and categories needed for CSV import in one click.",
    steps: [
      "Go to Import/Export in the sidebar menu",
      "Click 'Setup Vendors & Categories' button",
      "The system automatically creates common soap making vendors and categories",
      "Wait for confirmation message showing how many vendors and categories were created",
      "Your system is now ready for CSV import without errors"
    ],
    tips: [
      "This feature creates vendors like 'Paramount Trading', 'Online purchase', 'Supermarket'",
      "Categories include 'Soap Oils', 'Essential Oils', 'Packaging', 'Additives'",
      "Setup only creates missing items - existing vendors/categories are not duplicated",
      "You can still manually add additional vendors and categories as needed"
    ]
  },
  {
    id: "adding-materials",
    title: "Adding Raw Materials",
    category: "Materials",
    icon: Package,
    priority: "medium",
    content: "Learn how to add materials manually for precise control over your inventory.",
    steps: [
      "Go to Raw Materials → Add Material",
      "Enter material name and SKU (optional)",
      "Select category from dropdown (must be created first)",
      "Select vendor from dropdown (must be created first)",
      "Enter total cost and quantity purchased",
      "Select appropriate unit (kg, L, oz, etc.)",
      "Add notes for specifications or details",
      "Attach files if needed (certificates, specs, images)",
      "Click 'Create Material'"
    ],
    tips: [
      "Unit cost is calculated automatically (total cost ÷ quantity)",
      "Use consistent SKU naming conventions",
      "Attach important documents like safety data sheets"
    ]
  },
  {
    id: "creating-formulations",
    title: "Building Your First Formulation",
    category: "Formulations",
    icon: FlaskRound,
    priority: "medium",
    content: "Create formulations to calculate costs and profit margins for your products.",
    steps: [
      "Go to Formulations → New Formulation",
      "Enter formulation name and description",
      "Add ingredients by selecting materials from dropdown",
      "Enter quantity for each ingredient",
      "Check/uncheck 'Include in markup' for each ingredient",
      "Set your markup percentage (default 30%)",
      "Enter target selling price",
      "Review cost analysis and profit margins",
      "Attach files if needed (recipes, images)",
      "Click 'Create Formulation'"
    ],
    tips: [
      "Some ingredients (like packaging) might not be included in markup",
      "The system calculates profit margin as % of selling price",
      "Use the suggested price as a starting point for pricing decisions"
    ]
  },
  {
    id: "file-attachments",
    title: "Attaching Files to Materials and Formulations",
    category: "Files",
    icon: FileText,
    priority: "medium",
    content: "Keep important documents organized by attaching them directly to materials and formulations.",
    steps: [
      "Open any material or formulation for editing",
      "Scroll to the 'File Attachments' section",
      "Click 'Upload File' or drag files into the upload area",
      "Add a description for the file",
      "Select file tags for organization",
      "Click 'Attach File'",
      "Files are now linked to that specific item"
    ],
    tips: [
      "Supported formats: PDF, images (JPG, PNG), documents (DOC, XLS)",
      "Maximum file size varies by subscription tier",
      "Use descriptive names for easy file identification"
    ],
    warnings: [
      "Files can only be attached after creating the material or formulation",
      "File storage limits apply based on your subscription plan"
    ]
  },
  {
    id: "cost-calculations",
    title: "Understanding Cost Calculations",
    category: "Calculations",
    icon: Info,
    priority: "medium",
    content: "Learn how PIPPS calculates costs, margins, and pricing for your formulations.",
    steps: [
      "Total Material Cost = Sum of (ingredient quantity × unit cost)",
      "Unit Cost = Total Material Cost ÷ batch size",
      "Markup = (Selling Price - Unit Cost) ÷ Unit Cost × 100",
      "Profit Margin = (Selling Price - Unit Cost) ÷ Selling Price × 100"
    ],
    tips: [
      "Profit margin is calculated as percentage of selling price",
      "Markup is calculated as percentage of cost",
      "Some ingredients can be excluded from markup calculations",
      "Use suggested pricing as a starting point for your pricing strategy"
    ]
  },
  {
    id: "subscription-limits",
    title: "Subscription Plans and Limits",
    category: "Account",
    icon: CreditCard,
    priority: "low",
    content: "Understand the limits and features available in each subscription tier.",
    steps: [
      "Free: 10 materials, 3 formulations, 2 vendors, basic features",
      "Pro ($19/month): 100 materials, 25 formulations, 10 vendors, CSV import",
      "Business ($49/month): 500 materials, 100 formulations, 25 vendors, multi-user",
      "Enterprise ($99/month): Unlimited everything, API access, custom features"
    ],
    tips: [
      "Upgrade when approaching limits to avoid workflow interruption",
      "Annual plans save 17% compared to monthly billing",
      "All data transfers when upgrading - nothing is lost"
    ]
  },
  {
    id: "troubleshooting-import",
    title: "Troubleshooting CSV Import Issues",
    category: "Troubleshooting",
    icon: AlertCircle,
    priority: "medium",
    content: "Common CSV import problems and how to fix them.",
    steps: [
      "'Category not found' - Create the category first in Categories section",
      "'Vendor not found' - Create the vendor first in Vendors section",
      "'Invalid file format' - Ensure file is saved as .csv format",
      "'Missing required fields' - Check that name, cost, and quantity columns exist",
      "'Import failed' - Check file size limits and format requirements"
    ],
    warnings: [
      "Always create vendors and categories before importing",
      "Names must match exactly (case-sensitive)",
      "Backup existing data before large imports"
    ]
  },
  {
    id: "password-security",
    title: "Account Security and Password Reset",
    category: "Security",
    icon: Shield,
    priority: "low",
    content: "Keep your account secure and learn how to reset your password safely.",
    steps: [
      "Use a strong password with numbers, letters, and symbols",
      "For password reset, click 'Forgot Password' on login page",
      "Enter your email address to receive a reset token",
      "Check your email for the secure reset token (expires in 15 minutes)",
      "Enter the token and your new password",
      "Login with your new password"
    ],
    tips: [
      "Reset tokens expire in 15 minutes for security",
      "Use a unique password not used on other sites",
      "Check spam folder if reset email doesn't arrive"
    ],
    warnings: [
      "Never share your password or reset tokens",
      "Reset tokens can only be used once"
    ]
  }
];

export default function HelpGuide() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openTopics, setOpenTopics] = useState<string[]>(["getting-started"]);

  const categories = ["All", ...Array.from(new Set(helpTopics.map(topic => topic.category)))];
  
  const filteredTopics = helpTopics.filter(topic => {
    const matchesSearch = topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         topic.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || topic.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleTopic = (topicId: string) => {
    setOpenTopics(prev => 
      prev.includes(topicId) 
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">Everything you need to know about using PIPPS Maker Calc</p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search help topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Topics */}
      <div className="space-y-4">
        {filteredTopics.map(topic => {
          const Icon = topic.icon;
          const isOpen = openTopics.includes(topic.id);
          
          return (
            <Card key={topic.id}>
              <Collapsible>
                <CollapsibleTrigger 
                  className="w-full"
                  onClick={() => toggleTopic(topic.id)}
                >
                  <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <CardTitle className="text-lg">{topic.title}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {topic.category}
                            </Badge>
                            <Badge className={`text-xs ${getPriorityColor(topic.priority)}`}>
                              {topic.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <p className="text-gray-700">{topic.content}</p>
                      
                      {topic.steps && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Step-by-Step Instructions:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-gray-700">
                            {topic.steps.map((step, index) => (
                              <li key={index} className="leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                      
                      {topic.tips && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                            <Info className="h-4 w-4 mr-1" />
                            Tips:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-blue-800 text-sm">
                            {topic.tips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {topic.warnings && (
                        <div className="bg-red-50 p-3 rounded-lg">
                          <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Important Warnings:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-red-800 text-sm">
                            {topic.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {filteredTopics.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No help topics found</h3>
            <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}