import { storage } from "./storage";
import type { User, RawMaterial, Formulation, FormulationIngredient, Vendor, MaterialCategory, AuditLog } from "@shared/schema";

export interface ReportData {
  title: string;
  description: string;
  data: any;
  generatedAt: string;
  tier: string;
}

export class ReportsService {
  
  // Free Tier Reports
  async generateFreeReports(userId: number): Promise<ReportData[]> {
    const reports: ReportData[] = [];
    
    // Total material database value
    const materialValue = await this.getTotalMaterialValue(userId);
    reports.push({
      title: "Total Material Database Value",
      description: "Sum of all material unit costs in your database",
      data: materialValue,
      generatedAt: new Date().toISOString(),
      tier: "free"
    });

    // Average cost per material category
    const avgCostByCategory = await this.getAverageCostByCategory(userId);
    reports.push({
      title: "Average Cost Per Material Category",
      description: "Average unit cost for materials in each category",
      data: avgCostByCategory,
      generatedAt: new Date().toISOString(),
      tier: "free"
    });

    // Most/least expensive materials
    const expensiveMaterials = await this.getMostExpensiveMaterials(userId);
    reports.push({
      title: "Most vs Least Expensive Materials",
      description: "Comparison of highest and lowest cost materials",
      data: expensiveMaterials,
      generatedAt: new Date().toISOString(),
      tier: "free"
    });

    // Unit cost calculations based on batch size
    const batchCostCalculations = await this.getBatchCostCalculations(userId);
    reports.push({
      title: "Unit Cost Calculations Based on Batch Size",
      description: "Cost analysis for different batch sizes",
      data: batchCostCalculations,
      generatedAt: new Date().toISOString(),
      tier: "free"
    });

    // Basic profit margin calculations
    const profitMargins = await this.getBasicProfitMargins(userId);
    reports.push({
      title: "Basic Profit Margin Calculations",
      description: "Profit margins for all active formulations",
      data: profitMargins,
      generatedAt: new Date().toISOString(),
      tier: "free"
    });

    // Cost per ingredient breakdown
    const ingredientBreakdown = await this.getCostPerIngredientBreakdown(userId);
    reports.push({
      title: "Cost Per Ingredient Breakdown",
      description: "Detailed cost breakdown for each formulation ingredient",
      data: ingredientBreakdown,
      generatedAt: new Date().toISOString(),
      tier: "free"
    });

    return reports;
  }

  // Pro Tier Reports
  async generateProReports(userId: number): Promise<ReportData[]> {
    const reports: ReportData[] = [];

    // Complete material cost listing
    const completeMaterialListing = await this.getCompleteMaterialListing(userId);
    reports.push({
      title: "Complete Material Cost Listing",
      description: "Comprehensive list of all materials with detailed cost information",
      data: completeMaterialListing,
      generatedAt: new Date().toISOString(),
      tier: "pro"
    });

    // Cost per unit by category
    const costPerUnitByCategory = await this.getCostPerUnitByCategory(userId);
    reports.push({
      title: "Cost Per Unit by Category",
      description: "Unit cost analysis grouped by material categories",
      data: costPerUnitByCategory,
      generatedAt: new Date().toISOString(),
      tier: "pro"
    });

    // Top 5 most expensive materials per unit
    const top5ExpensiveMaterials = await this.getTop5ExpensiveMaterials(userId);
    reports.push({
      title: "Top 5 Most Expensive Materials Per Unit",
      description: "Highest cost materials ranked by unit price",
      data: top5ExpensiveMaterials,
      generatedAt: new Date().toISOString(),
      tier: "pro"
    });

    // Materials ranked by usage frequency
    const materialUsageFrequency = await this.getMaterialUsageFrequency(userId);
    reports.push({
      title: "Materials Ranked by Usage Frequency Across Formulations",
      description: "Materials sorted by how often they're used in formulations",
      data: materialUsageFrequency,
      generatedAt: new Date().toISOString(),
      tier: "pro"
    });

    // Number of formulations using each material
    const formulationsPerMaterial = await this.getFormulationsPerMaterial(userId);
    reports.push({
      title: "Number of Formulations Using Each Material",
      description: "Count of formulations that use each material",
      data: formulationsPerMaterial,
      generatedAt: new Date().toISOString(),
      tier: "pro"
    });

    // Total cost contribution across all formulations
    const totalCostContribution = await this.getTotalCostContribution(userId);
    reports.push({
      title: "Total Cost Contribution Across All Formulations",
      description: "How much each material contributes to total formulation costs",
      data: totalCostContribution,
      generatedAt: new Date().toISOString(),
      tier: "pro"
    });

    // Unused materials identification
    const unusedMaterials = await this.getUnusedMaterials(userId);
    reports.push({
      title: "Unused Materials Identification",
      description: "Materials in database not used in any formulations",
      data: unusedMaterials,
      generatedAt: new Date().toISOString(),
      tier: "pro"
    });

    return reports;
  }

  // Business Tier Reports
  async generateBusinessReports(userId: number): Promise<ReportData[]> {
    const reports: ReportData[] = [];

    // Historical cost changes
    const historicalCostChanges = await this.getHistoricalCostChanges(userId);
    reports.push({
      title: "Historical Cost Changes for Materials",
      description: "Track how material costs have changed over time",
      data: historicalCostChanges,
      generatedAt: new Date().toISOString(),
      tier: "business"
    });

    // Cost update frequency tracking
    const costUpdateFrequency = await this.getCostUpdateFrequency(userId);
    reports.push({
      title: "Cost Update Frequency Tracking",
      description: "How often material costs are updated",
      data: costUpdateFrequency,
      generatedAt: new Date().toISOString(),
      tier: "business"
    });

    // Biggest cost changes identification
    const biggestCostChanges = await this.getBiggestCostChanges(userId);
    reports.push({
      title: "Biggest Cost Changes Identification",
      description: "Materials with the largest cost fluctuations",
      data: biggestCostChanges,
      generatedAt: new Date().toISOString(),
      tier: "business"
    });

    // Price volatility indicators
    const priceVolatility = await this.getPriceVolatilityIndicators(userId);
    reports.push({
      title: "Price Volatility Indicators for Materials",
      description: "Materials with highest price volatility patterns",
      data: priceVolatility,
      generatedAt: new Date().toISOString(),
      tier: "business"
    });

    // Vendor price comparison
    const vendorPriceComparison = await this.getVendorPriceComparison(userId);
    reports.push({
      title: "Side-by-Side Vendor Price Comparisons",
      description: "Compare material prices across different vendors",
      data: vendorPriceComparison,
      generatedAt: new Date().toISOString(),
      tier: "business"
    });

    return reports;
  }

  // Enterprise Tier Reports
  async generateEnterpriseReports(userId: number): Promise<ReportData[]> {
    const reports: ReportData[] = [];

    // Cost savings opportunities
    const costSavingsOpportunities = await this.getCostSavingsOpportunities(userId);
    reports.push({
      title: "Cost Savings Opportunities Identification",
      description: "Automated recommendations for reducing formulation costs",
      data: costSavingsOpportunities,
      generatedAt: new Date().toISOString(),
      tier: "enterprise"
    });

    // Spending distribution across categories
    const spendingDistribution = await this.getSpendingDistribution(userId);
    reports.push({
      title: "Spending Distribution Across Categories",
      description: "How spending is distributed across material categories",
      data: spendingDistribution,
      generatedAt: new Date().toISOString(),
      tier: "enterprise"
    });

    // Category cost trends
    const categoryCostTrends = await this.getCategoryCostTrends(userId);
    reports.push({
      title: "Category Cost Trends",
      description: "Cost trend analysis by material category",
      data: categoryCostTrends,
      generatedAt: new Date().toISOString(),
      tier: "enterprise"
    });

    // High-impact category identification
    const highImpactCategories = await this.getHighImpactCategories(userId);
    reports.push({
      title: "High-Impact Category Identification",
      description: "Categories with highest cost impact on formulations",
      data: highImpactCategories,
      generatedAt: new Date().toISOString(),
      tier: "enterprise"
    });

    // Cost per unit analysis by category
    const costPerUnitAnalysis = await this.getCostPerUnitAnalysByCategory(userId);
    reports.push({
      title: "Cost Per Unit Analysis by Category",
      description: "Detailed unit cost analysis for each category",
      data: costPerUnitAnalysis,
      generatedAt: new Date().toISOString(),
      tier: "enterprise"
    });

    return reports;
  }

  // Implementation methods for each report type

  private async getTotalMaterialValue(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const totalValue = materials.reduce((sum, material) => {
      return sum + (parseFloat(material.totalCost) || 0);
    }, 0);
    
    return {
      totalValue: totalValue.toFixed(2),
      materialCount: materials.length,
      averageValue: materials.length > 0 ? (totalValue / materials.length).toFixed(2) : '0.00'
    };
  }

  private async getAverageCostByCategory(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const categories = await storage.getMaterialCategories(userId);
    
    const categoryStats = categories.map(category => {
      const categoryMaterials = materials.filter(m => m.categoryId === category.id);
      const totalCost = categoryMaterials.reduce((sum, m) => sum + (parseFloat(m.unitCost) || 0), 0);
      const avgCost = categoryMaterials.length > 0 ? totalCost / categoryMaterials.length : 0;
      
      return {
        category: category.name,
        averageCost: avgCost.toFixed(4),
        materialCount: categoryMaterials.length,
        totalCost: totalCost.toFixed(2)
      };
    });

    return categoryStats.sort((a, b) => parseFloat(b.averageCost) - parseFloat(a.averageCost));
  }

  private async getMostExpensiveMaterials(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const sorted = materials.sort((a, b) => parseFloat(b.unitCost) - parseFloat(a.unitCost));
    
    return {
      mostExpensive: sorted.slice(0, 5).map(m => ({
        name: m.name,
        unitCost: m.unitCost,
        unit: m.unit,
        category: m.categoryId
      })),
      leastExpensive: sorted.slice(-5).reverse().map(m => ({
        name: m.name,
        unitCost: m.unitCost,
        unit: m.unit,
        category: m.categoryId
      }))
    };
  }

  private async getBatchCostCalculations(userId: number) {
    const formulations = await storage.getFormulations(userId);
    const batchSizes = [1, 5, 10, 25, 50, 100];
    
    const calculations = await Promise.all(formulations.map(async (formulation) => {
      const ingredients = await storage.getFormulationIngredients(formulation.id);
      const baseCost = parseFloat(formulation.totalCost) || 0;
      
      const batchCosts = batchSizes.map(size => ({
        batchSize: size,
        totalCost: (baseCost * size).toFixed(2),
        unitCost: baseCost.toFixed(4)
      }));
      
      return {
        formulation: formulation.name,
        batchCalculations: batchCosts
      };
    }));
    
    return calculations;
  }

  private async getBasicProfitMargins(userId: number) {
    const formulations = await storage.getFormulations(userId);
    
    return formulations.map(formulation => {
      const totalCost = parseFloat(formulation.totalCost) || 0;
      const unitCost = parseFloat(formulation.unitCost) || 0;
      const profitMargin = parseFloat(formulation.profitMargin) || 0;
      const sellingPrice = unitCost / (1 - profitMargin / 100);
      
      return {
        name: formulation.name,
        totalCost: totalCost.toFixed(2),
        unitCost: unitCost.toFixed(4),
        profitMargin: profitMargin.toFixed(2),
        sellingPrice: sellingPrice.toFixed(4),
        profit: (sellingPrice - unitCost).toFixed(4)
      };
    });
  }

  private async getCostPerIngredientBreakdown(userId: number) {
    const formulations = await storage.getFormulations(userId);
    const materials = await storage.getRawMaterials(userId);
    
    const breakdown = await Promise.all(formulations.map(async (formulation) => {
      const ingredients = await storage.getFormulationIngredients(formulation.id);
      
      const ingredientCosts = ingredients.map(ingredient => {
        const material = materials.find(m => m.id === ingredient.materialId);
        const quantity = parseFloat(ingredient.quantity) || 0;
        const unitCost = material ? parseFloat(material.unitCost) : 0;
        const totalCost = quantity * unitCost;
        
        return {
          materialName: material?.name || 'Unknown',
          quantity: quantity,
          unit: material?.unit || '',
          unitCost: unitCost.toFixed(4),
          totalCost: totalCost.toFixed(4),
          percentage: 0 // Will calculate after
        };
      });
      
      const totalFormulationCost = ingredientCosts.reduce((sum, ing) => sum + parseFloat(ing.totalCost), 0);
      
      // Calculate percentages
      ingredientCosts.forEach(ing => {
        ing.percentage = totalFormulationCost > 0 ? 
          ((parseFloat(ing.totalCost) / totalFormulationCost) * 100).toFixed(2) : '0.00';
      });
      
      return {
        formulation: formulation.name,
        totalCost: totalFormulationCost.toFixed(4),
        ingredients: ingredientCosts.sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost))
      };
    }));
    
    return breakdown;
  }

  private async getCompleteMaterialListing(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const categories = await storage.getMaterialCategories(userId);
    const vendors = await storage.getVendors(userId);
    
    return materials.map(material => {
      const category = categories.find(c => c.id === material.categoryId);
      const vendor = vendors.find(v => v.id === material.vendorId);
      
      return {
        name: material.name,
        sku: material.sku,
        category: category?.name || 'Uncategorized',
        vendor: vendor?.name || 'No Vendor',
        totalCost: material.totalCost,
        quantity: material.quantity,
        unit: material.unit,
        unitCost: material.unitCost,
        notes: material.notes
      };
    }).sort((a, b) => parseFloat(b.unitCost) - parseFloat(a.unitCost));
  }

  private async getCostPerUnitByCategory(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const categories = await storage.getMaterialCategories(userId);
    
    const categoryAnalysis = categories.map(category => {
      const categoryMaterials = materials.filter(m => m.categoryId === category.id);
      
      if (categoryMaterials.length === 0) {
        return {
          category: category.name,
          materialCount: 0,
          averageUnitCost: '0.0000',
          minUnitCost: '0.0000',
          maxUnitCost: '0.0000',
          materials: []
        };
      }
      
      const unitCosts = categoryMaterials.map(m => parseFloat(m.unitCost));
      const avgCost = unitCosts.reduce((sum, cost) => sum + cost, 0) / unitCosts.length;
      const minCost = Math.min(...unitCosts);
      const maxCost = Math.max(...unitCosts);
      
      return {
        category: category.name,
        materialCount: categoryMaterials.length,
        averageUnitCost: avgCost.toFixed(4),
        minUnitCost: minCost.toFixed(4),
        maxUnitCost: maxCost.toFixed(4),
        materials: categoryMaterials.map(m => ({
          name: m.name,
          unitCost: m.unitCost,
          unit: m.unit
        })).sort((a, b) => parseFloat(b.unitCost) - parseFloat(a.unitCost))
      };
    });
    
    return categoryAnalysis.sort((a, b) => parseFloat(b.averageUnitCost) - parseFloat(a.averageUnitCost));
  }

  private async getTop5ExpensiveMaterials(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const categories = await storage.getMaterialCategories(userId);
    const vendors = await storage.getVendors(userId);
    
    const sorted = materials.sort((a, b) => parseFloat(b.unitCost) - parseFloat(a.unitCost));
    
    return sorted.slice(0, 5).map(material => {
      const category = categories.find(c => c.id === material.categoryId);
      const vendor = vendors.find(v => v.id === material.vendorId);
      
      return {
        name: material.name,
        unitCost: material.unitCost,
        unit: material.unit,
        category: category?.name || 'Uncategorized',
        vendor: vendor?.name || 'No Vendor',
        totalCost: material.totalCost,
        quantity: material.quantity
      };
    });
  }

  private async getMaterialUsageFrequency(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const formulations = await storage.getFormulations(userId);
    
    const usage = await Promise.all(materials.map(async (material) => {
      let usageCount = 0;
      const usedInFormulations: string[] = [];
      
      for (const formulation of formulations) {
        const ingredients = await storage.getFormulationIngredients(formulation.id);
        const isUsed = ingredients.some(ing => ing.materialId === material.id);
        if (isUsed) {
          usageCount++;
          usedInFormulations.push(formulation.name);
        }
      }
      
      return {
        materialName: material.name,
        usageCount,
        usedInFormulations,
        unitCost: material.unitCost,
        category: material.categoryId
      };
    }));
    
    return usage.sort((a, b) => b.usageCount - a.usageCount);
  }

  private async getFormulationsPerMaterial(userId: number) {
    return await this.getMaterialUsageFrequency(userId);
  }

  private async getTotalCostContribution(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const formulations = await storage.getFormulations(userId);
    
    const contributions = await Promise.all(materials.map(async (material) => {
      let totalContribution = 0;
      const formulationContributions: any[] = [];
      
      for (const formulation of formulations) {
        const ingredients = await storage.getFormulationIngredients(formulation.id);
        const ingredient = ingredients.find(ing => ing.materialId === material.id);
        
        if (ingredient) {
          const quantity = parseFloat(ingredient.quantity) || 0;
          const unitCost = parseFloat(material.unitCost) || 0;
          const contribution = quantity * unitCost;
          totalContribution += contribution;
          
          formulationContributions.push({
            formulation: formulation.name,
            quantity,
            contribution: contribution.toFixed(4)
          });
        }
      }
      
      return {
        materialName: material.name,
        totalContribution: totalContribution.toFixed(4),
        formulationContributions,
        unitCost: material.unitCost
      };
    }));
    
    return contributions.sort((a, b) => parseFloat(b.totalContribution) - parseFloat(a.totalContribution));
  }

  private async getUnusedMaterials(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const formulations = await storage.getFormulations(userId);
    const categories = await storage.getMaterialCategories(userId);
    const vendors = await storage.getVendors(userId);
    
    const unused = [];
    
    for (const material of materials) {
      let isUsed = false;
      
      for (const formulation of formulations) {
        const ingredients = await storage.getFormulationIngredients(formulation.id);
        if (ingredients.some(ing => ing.materialId === material.id)) {
          isUsed = true;
          break;
        }
      }
      
      if (!isUsed) {
        const category = categories.find(c => c.id === material.categoryId);
        const vendor = vendors.find(v => v.id === material.vendorId);
        
        unused.push({
          name: material.name,
          category: category?.name || 'Uncategorized',
          vendor: vendor?.name || 'No Vendor',
          totalCost: material.totalCost,
          unitCost: material.unitCost,
          unit: material.unit,
          notes: material.notes
        });
      }
    }
    
    return unused.sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost));
  }

  private async getHistoricalCostChanges(userId: number) {
    const auditLogs = await storage.getAuditLogs(userId, 1000);
    const materialUpdates = auditLogs.filter(log => 
      log.action === 'update' && log.entityType === 'raw_material'
    );
    
    const changes = materialUpdates.map(log => {
      const oldData = log.oldData ? JSON.parse(log.oldData) : {};
      const newData = log.newData ? JSON.parse(log.newData) : {};
      
      const oldCost = parseFloat(oldData.unitCost) || 0;
      const newCost = parseFloat(newData.unitCost) || 0;
      const changeAmount = newCost - oldCost;
      const changePercent = oldCost > 0 ? ((changeAmount / oldCost) * 100) : 0;
      
      return {
        materialId: log.entityId,
        materialName: newData.name || oldData.name || 'Unknown',
        date: log.createdAt,
        oldCost: oldCost.toFixed(4),
        newCost: newCost.toFixed(4),
        changeAmount: changeAmount.toFixed(4),
        changePercent: changePercent.toFixed(2)
      };
    }).filter(change => parseFloat(change.changeAmount) !== 0);
    
    return changes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  private async getCostUpdateFrequency(userId: number) {
    const auditLogs = await storage.getAuditLogs(userId, 1000);
    const materialUpdates = auditLogs.filter(log => 
      log.action === 'update' && log.entityType === 'raw_material'
    );
    
    const frequency: { [key: string]: number } = {};
    const materials = await storage.getRawMaterials(userId);
    
    materialUpdates.forEach(log => {
      const material = materials.find(m => m.id === log.entityId);
      if (material) {
        frequency[material.name] = (frequency[material.name] || 0) + 1;
      }
    });
    
    return Object.entries(frequency).map(([name, count]) => ({
      materialName: name,
      updateCount: count,
      lastUpdated: materialUpdates
        .filter(log => {
          const material = materials.find(m => m.id === log.entityId);
          return material?.name === name;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]?.createdAt
    })).sort((a, b) => b.updateCount - a.updateCount);
  }

  private async getBiggestCostChanges(userId: number) {
    const changes = await this.getHistoricalCostChanges(userId);
    return changes
      .sort((a, b) => Math.abs(parseFloat(b.changePercent)) - Math.abs(parseFloat(a.changePercent)))
      .slice(0, 10);
  }

  private async getPriceVolatilityIndicators(userId: number) {
    const changes = await this.getHistoricalCostChanges(userId);
    const volatility: { [key: string]: any } = {};
    
    changes.forEach(change => {
      if (!volatility[change.materialName]) {
        volatility[change.materialName] = {
          changes: [],
          totalChanges: 0
        };
      }
      volatility[change.materialName].changes.push(parseFloat(change.changePercent));
      volatility[change.materialName].totalChanges++;
    });
    
    return Object.entries(volatility).map(([name, data]: [string, any]) => {
      const changes = data.changes;
      const mean = changes.reduce((sum: number, val: number) => sum + val, 0) / changes.length;
      const variance = changes.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / changes.length;
      const stdDev = Math.sqrt(variance);
      
      return {
        materialName: name,
        totalChanges: data.totalChanges,
        averageChange: mean.toFixed(2),
        volatilityIndex: stdDev.toFixed(2),
        maxChange: Math.max(...changes).toFixed(2),
        minChange: Math.min(...changes).toFixed(2)
      };
    }).sort((a, b) => parseFloat(b.volatilityIndex) - parseFloat(a.volatilityIndex));
  }

  private async getVendorPriceComparison(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const vendors = await storage.getVendors(userId);
    const categories = await storage.getMaterialCategories(userId);
    
    // Group materials by category and look for similar materials across vendors
    const categoryGroups: { [key: string]: any[] } = {};
    
    materials.forEach(material => {
      const category = categories.find(c => c.id === material.categoryId);
      const categoryName = category?.name || 'Uncategorized';
      
      if (!categoryGroups[categoryName]) {
        categoryGroups[categoryName] = [];
      }
      
      const vendor = vendors.find(v => v.id === material.vendorId);
      categoryGroups[categoryName].push({
        ...material,
        vendorName: vendor?.name || 'No Vendor'
      });
    });
    
    const comparisons = Object.entries(categoryGroups).map(([category, materials]) => {
      const vendorStats = materials.reduce((acc: any, material) => {
        if (!acc[material.vendorName]) {
          acc[material.vendorName] = {
            materials: [],
            avgUnitCost: 0,
            totalMaterials: 0
          };
        }
        
        acc[material.vendorName].materials.push({
          name: material.name,
          unitCost: material.unitCost,
          unit: material.unit
        });
        acc[material.vendorName].totalMaterials++;
        
        return acc;
      }, {});
      
      // Calculate average costs
      Object.keys(vendorStats).forEach(vendor => {
        const totalCost = vendorStats[vendor].materials.reduce(
          (sum: number, m: any) => sum + parseFloat(m.unitCost), 0
        );
        vendorStats[vendor].avgUnitCost = (totalCost / vendorStats[vendor].totalMaterials).toFixed(4);
      });
      
      return {
        category,
        vendorComparison: vendorStats
      };
    });
    
    return comparisons;
  }

  private async getCostSavingsOpportunities(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const formulations = await storage.getFormulations(userId);
    const categories = await storage.getMaterialCategories(userId);
    const vendors = await storage.getVendors(userId);
    
    const opportunities = [];
    
    // Find expensive materials with cheaper alternatives in same category
    for (const category of categories) {
      const categoryMaterials = materials.filter(m => m.categoryId === category.id);
      if (categoryMaterials.length < 2) continue;
      
      const sorted = categoryMaterials.sort((a, b) => parseFloat(a.unitCost) - parseFloat(b.unitCost));
      const cheapest = sorted[0];
      const expensive = sorted.slice(1);
      
      for (const expensiveMaterial of expensive) {
        const savings = parseFloat(expensiveMaterial.unitCost) - parseFloat(cheapest.unitCost);
        if (savings > 0.01) { // Only show meaningful savings
          
          // Check if this expensive material is used in formulations
          let totalPotentialSavings = 0;
          const affectedFormulations = [];
          
          for (const formulation of formulations) {
            const ingredients = await storage.getFormulationIngredients(formulation.id);
            const ingredient = ingredients.find(ing => ing.materialId === expensiveMaterial.id);
            
            if (ingredient) {
              const quantity = parseFloat(ingredient.quantity) || 0;
              const formulationSavings = quantity * savings;
              totalPotentialSavings += formulationSavings;
              
              affectedFormulations.push({
                name: formulation.name,
                quantity,
                savingsPerBatch: formulationSavings.toFixed(4)
              });
            }
          }
          
          if (totalPotentialSavings > 0) {
            opportunities.push({
              type: 'Material Substitution',
              description: `Replace "${expensiveMaterial.name}" with "${cheapest.name}" in ${category.name} category`,
              currentMaterial: {
                name: expensiveMaterial.name,
                unitCost: expensiveMaterial.unitCost,
                vendor: vendors.find(v => v.id === expensiveMaterial.vendorId)?.name || 'No Vendor'
              },
              suggestedMaterial: {
                name: cheapest.name,
                unitCost: cheapest.unitCost,
                vendor: vendors.find(v => v.id === cheapest.vendorId)?.name || 'No Vendor'
              },
              savingsPerUnit: savings.toFixed(4),
              totalPotentialSavings: totalPotentialSavings.toFixed(4),
              affectedFormulations,
              impact: totalPotentialSavings > 10 ? 'High' : totalPotentialSavings > 5 ? 'Medium' : 'Low'
            });
          }
        }
      }
    }
    
    // Find materials with high usage frequency that could benefit from bulk purchasing
    const usage = await this.getMaterialUsageFrequency(userId);
    const highUsageMaterials = usage.filter(u => u.usageCount >= 3);
    
    for (const material of highUsageMaterials) {
      const materialData = materials.find(m => m.name === material.materialName);
      if (materialData) {
        opportunities.push({
          type: 'Bulk Purchasing',
          description: `"${material.materialName}" is used in ${material.usageCount} formulations - consider bulk purchasing`,
          currentMaterial: {
            name: material.materialName,
            unitCost: material.unitCost,
            usageCount: material.usageCount
          },
          suggestion: 'Negotiate bulk pricing with vendor for better unit costs',
          potentialSavings: 'Estimated 10-20% cost reduction',
          impact: material.usageCount > 5 ? 'High' : 'Medium'
        });
      }
    }
    
    return opportunities.sort((a, b) => {
      const impactOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return impactOrder[b.impact as keyof typeof impactOrder] - impactOrder[a.impact as keyof typeof impactOrder];
    });
  }

  private async getSpendingDistribution(userId: number) {
    const materials = await storage.getRawMaterials(userId);
    const categories = await storage.getMaterialCategories(userId);
    const formulations = await storage.getFormulations(userId);
    
    const distribution = await Promise.all(categories.map(async (category) => {
      const categoryMaterials = materials.filter(m => m.categoryId === category.id);
      let totalSpending = 0;
      let formulationUsage = 0;
      
      for (const material of categoryMaterials) {
        // Calculate total spending based on formulation usage
        for (const formulation of formulations) {
          const ingredients = await storage.getFormulationIngredients(formulation.id);
          const ingredient = ingredients.find(ing => ing.materialId === material.id);
          
          if (ingredient) {
            const quantity = parseFloat(ingredient.quantity) || 0;
            const unitCost = parseFloat(material.unitCost) || 0;
            totalSpending += quantity * unitCost;
            formulationUsage++;
          }
        }
      }
      
      return {
        category: category.name,
        totalSpending: totalSpending.toFixed(2),
        materialCount: categoryMaterials.length,
        formulationUsage,
        averageSpendingPerMaterial: categoryMaterials.length > 0 ? 
          (totalSpending / categoryMaterials.length).toFixed(2) : '0.00'
      };
    }));
    
    const totalSpending = distribution.reduce((sum, d) => sum + parseFloat(d.totalSpending), 0);
    
    return distribution.map(d => ({
      ...d,
      percentage: totalSpending > 0 ? 
        ((parseFloat(d.totalSpending) / totalSpending) * 100).toFixed(2) : '0.00'
    })).sort((a, b) => parseFloat(b.totalSpending) - parseFloat(a.totalSpending));
  }

  private async getCategoryCostTrends(userId: number) {
    const auditLogs = await storage.getAuditLogs(userId, 1000);
    const materials = await storage.getRawMaterials(userId);
    const categories = await storage.getMaterialCategories(userId);
    
    const materialUpdates = auditLogs.filter(log => 
      log.action === 'update' && log.entityType === 'raw_material'
    );
    
    const trends = categories.map(category => {
      const categoryMaterials = materials.filter(m => m.categoryId === category.id);
      const categoryUpdates = materialUpdates.filter(log => {
        const material = categoryMaterials.find(m => m.id === log.entityId);
        return material !== undefined;
      });
      
      const changes = categoryUpdates.map(log => {
        const oldData = log.oldData ? JSON.parse(log.oldData) : {};
        const newData = log.newData ? JSON.parse(log.newData) : {};
        
        const oldCost = parseFloat(oldData.unitCost) || 0;
        const newCost = parseFloat(newData.unitCost) || 0;
        const changePercent = oldCost > 0 ? ((newCost - oldCost) / oldCost) * 100 : 0;
        
        return {
          date: log.createdAt,
          changePercent
        };
      }).filter(change => change.changePercent !== 0);
      
      const averageChange = changes.length > 0 ? 
        changes.reduce((sum, c) => sum + c.changePercent, 0) / changes.length : 0;
      
      return {
        category: category.name,
        materialCount: categoryMaterials.length,
        totalUpdates: categoryUpdates.length,
        averageCostChange: averageChange.toFixed(2),
        trend: averageChange > 2 ? 'Increasing' : averageChange < -2 ? 'Decreasing' : 'Stable',
        lastUpdate: changes.length > 0 ? 
          changes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null
      };
    });
    
    return trends.sort((a, b) => Math.abs(parseFloat(b.averageCostChange)) - Math.abs(parseFloat(a.averageCostChange)));
  }

  private async getHighImpactCategories(userId: number) {
    const distribution = await this.getSpendingDistribution(userId);
    const trends = await this.getCategoryCostTrends(userId);
    
    return distribution.map(dist => {
      const trend = trends.find(t => t.category === dist.category);
      const impactScore = parseFloat(dist.percentage) + Math.abs(parseFloat(trend?.averageCostChange || '0'));
      
      return {
        category: dist.category,
        spendingPercentage: dist.percentage,
        totalSpending: dist.totalSpending,
        costTrend: trend?.trend || 'Unknown',
        averageCostChange: trend?.averageCostChange || '0.00',
        impactScore: impactScore.toFixed(2),
        impact: impactScore > 20 ? 'High' : impactScore > 10 ? 'Medium' : 'Low',
        recommendation: this.getCategoryRecommendation(dist, trend)
      };
    }).sort((a, b) => parseFloat(b.impactScore) - parseFloat(a.impactScore));
  }

  private getCategoryRecommendation(distribution: any, trend: any) {
    const spending = parseFloat(distribution.percentage);
    const change = parseFloat(trend?.averageCostChange || '0');
    
    if (spending > 25 && change > 5) {
      return 'High spending category with increasing costs - prioritize cost optimization';
    } else if (spending > 25) {
      return 'High spending category - monitor closely for cost changes';
    } else if (change > 10) {
      return 'Rapidly increasing costs - investigate alternative suppliers';
    } else if (change < -10) {
      return 'Decreasing costs - good opportunity to increase usage';
    } else {
      return 'Stable category - maintain current sourcing strategy';
    }
  }

  private async getCostPerUnitAnalysByCategory(userId: number) {
    return await this.getCostPerUnitByCategory(userId);
  }
}

export const reportsService = new ReportsService();