import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RawMaterial {
  id: number;
  name: string;
  unitCost: number;
  [key: string]: any;
}

interface RawMaterialsState {
  materials: RawMaterial[];
}

const initialState: RawMaterialsState = {
  materials: [],
};

const rawMaterialsSlice = createSlice({
  name: 'rawMaterials',
  initialState,
  reducers: {
    setRawMaterials(state, action: PayloadAction<RawMaterial[]>) {
      state.materials = action.payload;
    },
    updateRawMaterialPrice(state, action: PayloadAction<{ id: number; unitCost: number }>) {
      const material = state.materials.find(m => m.id === action.payload.id);
      if (material) {
        material.unitCost = action.payload.unitCost;
      }
    },
    // Add more reducers as needed
  },
});

export const { setRawMaterials, updateRawMaterialPrice } = rawMaterialsSlice.actions;
export default rawMaterialsSlice.reducer;
