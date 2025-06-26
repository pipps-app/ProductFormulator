/**
 * Calculation utilities to ensure all cost calculations are done on-the-fly
 * from source data (totalCost and quantity) rather than stored unitCost values.
 */

/**
 * Calculate unit cost from material's totalCost and quantity
 * @param {Object} material - Material object with totalCost and quantity
 * @returns {number} - Calculated unit cost
 */
function calculateUnitCost(material) {
  if (!material) return 0;
  
  const totalCost = parseFloat(material.totalCost || '0');
  const quantity = parseFloat(material.quantity || '1');
  
  return quantity > 0 ? totalCost / quantity : 0;
}

/**
 * Calculate ingredient cost contribution
 * @param {Object} material - Material object with totalCost and quantity
 * @param {string|number} ingredientQuantity - Quantity of material used in formulation
 * @returns {number} - Total cost for this ingredient
 */
function calculateIngredientCost(material, ingredientQuantity) {
  const unitCost = calculateUnitCost(material);
  const quantity = parseFloat(ingredientQuantity || '0');
  
  return quantity * unitCost;
}

/**
 * Calculate formulation unit cost
 * @param {number} totalMaterialCost - Total cost of all materials
 * @param {string|number} batchSize - Batch size of the formulation
 * @returns {number} - Unit cost per item in the batch
 */
function calculateFormulationUnitCost(totalMaterialCost, batchSize) {
  const batch = parseFloat(batchSize || '1');
  return batch > 0 ? totalMaterialCost / batch : 0;
}

/**
 * Calculate profit margin
 * @param {number} markupEligibleCost - Cost eligible for markup
 * @param {string|number} markupPercentage - Markup percentage
 * @returns {number} - Calculated profit margin
 */
function calculateProfitMargin(markupEligibleCost, markupPercentage) {
  const markup = parseFloat(markupPercentage || '0');
  return (markupEligibleCost * markup) / 100;
}

/**
 * Add calculated unitCost to material object for API responses
 * @param {Object} material - Material object
 * @returns {Object} - Material with calculated unitCost
 */
function enhanceMaterialWithCalculatedCosts(material) {
  if (!material) return material;
  
  return {
    ...material,
    unitCost: calculateUnitCost(material).toFixed(4)
  };
}

/**
 * Enhance multiple materials with calculated costs
 * @param {Array} materials - Array of material objects
 * @returns {Array} - Materials with calculated unitCosts
 */
function enhanceMaterialsWithCalculatedCosts(materials) {
  if (!Array.isArray(materials)) return materials;
  
  return materials.map(enhanceMaterialWithCalculatedCosts);
}

module.exports = {
  calculateUnitCost,
  calculateIngredientCost,
  calculateFormulationUnitCost,
  calculateProfitMargin,
  enhanceMaterialWithCalculatedCosts,
  enhanceMaterialsWithCalculatedCosts
};