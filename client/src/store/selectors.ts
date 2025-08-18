import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

export const selectRawMaterials = (state: RootState) => state.rawMaterials.materials;
export const selectFormulations = (state: RootState) => state.formulations.formulations;

// Example: get formulation with calculated costs
export const makeSelectFormulationWithCosts = () =>
  createSelector(
    [selectFormulations, selectRawMaterials, (_: RootState, id: number) => id],
    (formulations, materials, id) => {
      const formulation = formulations.find(f => f.id === id);
      if (!formulation) return undefined;
      // Recalculate costs using latest material prices
      const ingredients = formulation.ingredients.map(ing => {
        const material = materials.find(m => m.id === ing.materialId);
        const unitCost = material ? material.unitCost : 0;
        const totalCost = unitCost * ing.quantity;
        return { ...ing, unitCost, totalCost };
      });
      const totalMaterialCost = ingredients.reduce((sum, ing) => sum + ing.totalCost, 0);
      const batchSize = formulation.batchSize || 1;
      const unitCost = batchSize > 0 ? totalMaterialCost / batchSize : 0;
      const markupEligibleCost = ingredients.reduce((sum, ing) => ing.includeInMarkup ? sum + ing.totalCost : sum, 0);
      const markupPercentage = formulation.markupPercentage || 30;
      const suggestedPrice = markupEligibleCost * (1 + markupPercentage / 100);
      const targetPrice = formulation.targetPrice || suggestedPrice;
      const profit = targetPrice - markupEligibleCost;
      const profitMargin = targetPrice > 0 ? (profit / targetPrice) * 100 : 0;
      return {
        ...formulation,
        ingredients,
        totalMaterialCost,
        unitCost,
        suggestedPrice,
        profitMargin,
      };
    }
  );
