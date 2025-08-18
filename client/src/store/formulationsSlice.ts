import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Ingredient {
  id: string;
  materialId: number;
  quantity: number;
  unit: string;
  totalCost: number;
  includeInMarkup: boolean;
  [key: string]: any;
}

export interface Formulation {
  id: number;
  name: string;
  batchSize: number;
  batchUnit: string;
  targetPrice?: number;
  markupPercentage: number;
  ingredients: Ingredient[];
  [key: string]: any;
}

// 1. Create the thunk
export const fetchFormulations = createAsyncThunk(
  'formulations/fetchAll',
  async () => {
    const res = await fetch('/api/formulations');
    return (await res.json()) as Formulation[];
  }
);

// 2. Wire it into the slice
const formulationsSlice = createSlice({
  name: 'formulations',
  initialState: [] as Formulation[],
  reducers: {
    addFormulation: (state, action: PayloadAction<Formulation>) => {
      state.push(action.payload);
    },
    updateFormulation: (state, action: PayloadAction<Formulation>) => {
      const idx = state.findIndex(f => f.id === action.payload.id);
      if (idx !== -1) {
        state[idx] = action.payload;
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchFormulations.fulfilled, (_state, action) => action.payload);
  }
});

// 3. Export actions & reducer
export const { addFormulation, updateFormulation } = formulationsSlice.actions;
export default formulationsSlice.reducer;
