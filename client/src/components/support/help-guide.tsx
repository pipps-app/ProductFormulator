import { useState, useEffect } from "react";
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
    id: "csv-import-guide",
    title: "CSV Import - Step by Step",
    category: "Import/Export",
    icon: Upload,
    priority: "high",
    content: "Having trouble importing your CSV? Follow this guide to import all your materials successfully.",
    steps: [
      "Prepare your CSV with these exact columns: name,sku,categoryName,vendorName,totalCost,quantity,unit,notes",
      "Go to Vendors section and create any vendors that appear in your CSV",
      "Go to Categories section and create any categories that appear in your CSV", 
      "Upload your CSV file in the Import/Export page",
      "If some materials fail, check the error message and create any missing vendors/categories",
      "Re-upload the same CSV file - it will only import the previously failed materials"
    ],
    tips: [
      "Vendor and category names must match exactly (case-sensitive)",
      "Use 'Remove Duplicates' button if materials appear twice",
      "Export your data first as backup before importing"
    ],
    warnings: [
      "Import will fail if vendor or category names don't exist in your system",
      "Check for typos and extra spaces in vendor/category names"
    ]
  },
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
      "Create logical categories like 'Base Materials', 'Additives', 'Packaging'",
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
      "The Setup feature works with manufacturing and supply chain data",
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
      "The system automatically creates common manufacturing vendors and categories",
      "Wait for confirmation message showing how many vendors and categories were created",
      "Your system is now ready for CSV import without errors"
    ],
    tips: [
      "This feature creates vendors like 'Paramount Trading', 'Online purchase', 'Supermarket'",
      "Categories include 'Base Materials', 'Additives', 'Packaging', 'Ingredients'",
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
      "Some components (like packaging) might not be included in markup",
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
    id: "reports-overview",
    title: "Understanding Report Tiers",
    category: "Reports",
    icon: FileText,
    priority: "high",
    content: "Overview of Free, Pro, Business, and Enterprise reporting features available in PIPPS Maker.",
    steps: [
      "Free Tier: Access to Material Database Value and Basic Cost Analysis",
      "Starter Tier: All Free reports plus Basic Cost Summary and Formulation Overview",
      "Pro Tier: All Starter reports plus Advanced Analytics and Custom Reports",
      "Business Tier: All Pro reports plus Multi-location Analysis and Team Reports",
      "Enterprise Tier: All Business reports plus API Access and Custom Integrations"
    ],
    tips: [
      "Free tier reports provide essential insights for small operations",
      "Higher tiers unlock detailed analytics for business growth",
      "Reports can be exported as PDF or JSON for external analysis"
    ]
  },
  {
    id: "free-tier-reports",
    title: "Free Tier Reports",
    category: "Reports",
    icon: Info,
    priority: "high",
    content: "The Free tier includes six essential reports to help you analyze your formulation costs and material data without requiring a paid subscription.",
    steps: [
      "Navigate to Reports section in the sidebar",
      "Total Material Database Value: Shows the total value of all material unit costs in your database - useful for understanding your material cost database worth",
      "Average Cost Per Material Category: Displays average unit cost for materials in each category - helps identify which categories tend to be more expensive",
      "Most vs Least Expensive Materials: Comparison of highest and lowest cost materials - quickly identify cost outliers in your material database",
      "Unit Cost Calculations Based on Batch Size: Cost analysis for different batch sizes - essential for understanding how scaling affects per-unit costs",
      "Basic Profit Margin Calculations: Profit margins for all your formulations - critical for pricing strategy and understanding formulation profitability",
      "Cost Per Ingredient Breakdown: Detailed cost breakdown for each formulation ingredient - identifies which materials contribute most to your recipe costs"
    ],
    tips: [
      "Material Database Value helps you understand the scope and worth of your cost database",
      "Category averages help you anticipate costs when selecting materials for new formulations",
      "Use expensive vs cheap materials report to make informed ingredient substitution decisions",
      "Batch size calculations help you understand optimal production scales for cost efficiency",
      "Profit margin reports guide your product pricing decisions and show which formulations are most profitable",
      "Ingredient breakdowns reveal which materials drive up your formulation costs most significantly",
      "All reports update automatically when you modify material costs or formulation recipes",
      "Export any report as PDF for sharing with business partners or for record keeping"
    ],
    warnings: [
      "Advanced analytics with trend analysis and detailed breakdowns require Pro+ subscriptions",
      "Free reports provide current cost analysis - upgrade for historical tracking and advanced insights",
      "Multi-location analysis and team collaboration features are available in higher tiers"
    ]
  },
  {
    id: "starter-tier-reports",
    title: "Starter Tier Reports",
    category: "Reports",
    icon: Info,
    priority: "high",
    content: "The Starter tier includes all Free reports plus two additional reports to enhance your formulation cost analysis capabilities.",
    steps: [
      "Navigate to Reports section in the sidebar",
      "Access all Free tier reports (Total Database Value, Category Averages, etc.)",
      "Basic Cost Summary: Simple cost calculations and material usage overview - provides streamlined insights into your overall material costs and usage patterns",
      "Formulation Overview: Basic formulation cost breakdown and analysis - offers detailed cost breakdown for each of your formulations with clear profitability insights"
    ],
    tips: [
      "Basic Cost Summary gives you a quick snapshot of your material spending patterns",
      "Formulation Overview helps you identify which recipes are most cost-effective",
      "Use these reports to make informed decisions about recipe optimization",
      "Compare formulation costs to determine which products offer the best profit margins",
      "Track material usage trends to optimize your purchasing decisions",
      "Export reports for sharing with business partners or financial planning",
      "Starter tier bridges the gap between basic free reports and advanced analytics"
    ],
    warnings: [
      "Advanced trend analysis and historical data tracking require Pro+ subscriptions",
      "Detailed vendor analysis and custom reporting filters are available in higher tiers",
      "Multi-formulation comparison features are unlocked with Pro+ plans"
    ]
  },
  {
    id: "pro-tier-reports",
    title: "Pro Tier Reports",
    category: "Reports",
    icon: FileText,
    priority: "medium",
    content: "The Pro tier includes all Free and Starter reports plus seven advanced analytical reports for comprehensive formulation analysis.",
    steps: [
      "Navigate to Reports section in the sidebar",
      "Access all Free and Starter tier reports",
      "Complete Material Cost Listing: Comprehensive list of all materials with detailed cost information - full database overview with complete pricing details",
      "Cost Per Unit by Category: Unit cost analysis grouped by material categories - understand which categories are most expensive",
      "Top 5 Most Expensive Materials Per Unit: Highest cost materials ranked by unit price - quickly identify your costliest ingredients",
      "Materials Ranked by Usage Frequency: Materials sorted by how often they're used in formulations - see which ingredients you rely on most",
      "Number of Formulations Using Each Material: Count of formulations that use each material - understand ingredient popularity",
      "Total Cost Contribution Across All Formulations: How much each material contributes to total formulation costs - identify biggest cost drivers",
      "Unused Materials Identification: Materials in database not used in any formulations - find redundant or forgotten ingredients"
    ],
    tips: [
      "Use the Complete Material Cost Listing for comprehensive cost audits and budget planning",
      "Category cost analysis helps optimize material selection by category type",
      "Top expensive materials report guides substitution and cost reduction strategies",
      "Usage frequency data helps with inventory planning and vendor negotiations",
      "Cost contribution analysis reveals which materials have the biggest impact on your bottom line",
      "Unused materials identification helps clean up your database and reduce clutter",
      "These reports are perfect for medium-sized operations needing detailed analytics"
    ],
    warnings: [
      "Historical trend analysis and advanced forecasting require Professional+ subscriptions",
      "Vendor comparison features are available in Business+ tiers",
      "Multi-location analysis requires Business+ plans"
    ]
  },
  {
    id: "professional-tier-reports", 
    title: "Professional Tier Reports",
    category: "Reports",
    icon: FileText,
    priority: "medium",
    content: "The Professional tier includes all previous reports plus four advanced business intelligence reports for strategic decision making.",
    steps: [
      "Navigate to Reports section in the sidebar",
      "Access all Free, Starter, and Pro tier reports",
      "Advanced Cost Analytics: Enhanced cost modeling and trend analysis for formulations - sophisticated financial modeling tools",
      "Batch Optimization Report: Batch size and efficiency optimization insights - determine optimal production quantities for cost efficiency",
      "Margin Analysis: Detailed profit margin tracking and forecasting - comprehensive profitability analysis with projections",
      "Vendor Performance Analysis: Analysis of vendor pricing and cost efficiency - evaluate vendor relationships and pricing strategies"
    ],
    tips: [
      "Advanced Cost Analytics provides sophisticated forecasting for strategic planning",
      "Batch optimization helps determine the most cost-effective production scales",
      "Margin analysis guides pricing strategies and profitability optimization",
      "Vendor performance analysis helps negotiate better pricing and evaluate supplier relationships",
      "Professional tier is ideal for established businesses needing strategic insights",
      "Use these reports for board presentations and investor meetings"
    ],
    warnings: [
      "Historical cost tracking and volatility analysis require Business+ subscriptions",
      "Multi-vendor comparison features are available in Business+ tiers",
      "Enterprise-level optimization recommendations require Enterprise subscription"
    ]
  },
  {
    id: "business-tier-reports",
    title: "Business Tier Reports", 
    category: "Reports",
    icon: FileText,
    priority: "medium",
    content: "The Business tier includes all previous reports plus five historical analysis and vendor comparison reports for enterprise-level insights.",
    steps: [
      "Navigate to Reports section in the sidebar",
      "Access all Free, Starter, Pro, and Professional tier reports",
      "Historical Cost Changes for Materials: Track how material costs have changed over time - complete historical cost tracking",
      "Cost Update Frequency Tracking: How often material costs are updated - monitor data freshness and update patterns",
      "Biggest Cost Changes Identification: Materials with the largest cost fluctuations - identify volatile pricing patterns",
      "Price Volatility Indicators: Materials with highest price volatility patterns - risk assessment for cost planning",
      "Side-by-Side Vendor Price Comparisons: Compare material prices across different vendors - comprehensive vendor analysis"
    ],
    tips: [
      "Historical cost tracking helps predict future pricing trends and budget accordingly",
      "Update frequency analysis ensures you're maintaining current pricing data",
      "Cost change identification helps prepare for market volatility and adjust strategies",
      "Volatility indicators guide risk management and supplier diversification decisions",
      "Vendor price comparisons optimize purchasing decisions and supplier negotiations",
      "Business tier is perfect for large operations with multiple suppliers and complex supply chains"
    ],
    warnings: [
      "Advanced cost optimization recommendations require Enterprise subscription",
      "Automated savings identification features are Enterprise-only",
      "API access and custom integrations require Enterprise tier"
    ]
  },
  {
    id: "enterprise-tier-reports",
    title: "Enterprise Tier Reports",
    category: "Reports", 
    icon: FileText,
    priority: "medium",
    content: "The Enterprise tier includes all previous reports plus five advanced optimization and strategic analysis reports with automated recommendations.",
    steps: [
      "Navigate to Reports section in the sidebar",
      "Access all reports from Free through Business tiers",
      "Cost Savings Opportunities Identification: Automated recommendations for reducing formulation costs - AI-powered cost optimization",
      "Spending Distribution Across Categories: How spending is distributed across material categories - comprehensive spend analysis",
      "Category Cost Trends: Cost trend analysis by material category - strategic category planning insights",
      "High-Impact Category Identification: Categories with highest cost impact on formulations - focus areas for optimization",
      "Cost Per Unit Analysis by Category: Detailed unit cost analysis for each category - granular category-level insights"
    ],
    tips: [
      "Automated cost savings recommendations provide actionable optimization strategies",
      "Spending distribution analysis guides budget allocation and category management",
      "Category trend analysis supports long-term strategic planning and forecasting",
      "High-impact category identification helps prioritize optimization efforts",
      "Granular cost analysis enables precise category-level decision making",
      "Enterprise tier provides the most comprehensive analytics for large-scale operations",
      "Perfect for corporations, manufacturers, and businesses with complex formulation portfolios"
    ],
    warnings: [
      "Enterprise features require the highest subscription tier",
      "Some recommendations may require minimum data volumes to be effective",
      "Advanced features work best with consistent, high-quality data input"
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
  const [openTopics, setOpenTopics] = useState<string[]>([]);

  // Handle anchor links and auto-open sections
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      // Auto-open the section
      setOpenTopics([hash]);
      
      // If it's getting-started, also filter to show only that topic
      if (hash === 'getting-started') {
        setSelectedCategory('Getting Started');
      }
      
      // Scroll to the section after a brief delay for rendering
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, []);

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
      case "high": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high": return "Essential";
      case "medium": return "Helpful";
      case "low": return "Advanced";
      default: return "General";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">Everything you need to know about using PIPPS Maker Calc</p>
        
        {/* Priority Legend */}
        <div className="flex justify-center gap-3 mt-4 text-sm">
          <span className="text-gray-600">Priority levels:</span>
          <Badge className="bg-green-100 text-green-800">Essential</Badge>
          <Badge className="bg-yellow-100 text-yellow-800">Helpful</Badge>
          <Badge className="bg-gray-100 text-gray-800">Advanced</Badge>
        </div>
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
            <Card key={topic.id} id={topic.id}>
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
                              {getPriorityLabel(topic.priority)}
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