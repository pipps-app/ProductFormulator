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
  isActive: boolean;
  ingredients: Ingredient[];
  [key: string]: any;
}

// 1. Create the thunks
export const fetchFormulations = createAsyncThunk(
  'formulations/fetchAll',
  async () => {
    const res = await fetch('/api/formulations');
    return (await res.json()) as Formulation[];
  }
);

export const fetchArchivedFormulations = createAsyncThunk(
  'formulations/fetchArchived',
  async () => {
    const res = await fetch('/api/formulations/archived');
    return (await res.json()) as Formulation[];
  }
);

export const deleteFormulation = createAsyncThunk(
  'formulations/delete',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/formulations/${id}`, { method: 'DELETE' });
      const result = await res.json();
      
      if (!res.ok) {
        return rejectWithValue(result.error || 'Failed to delete formulation');
      }
      
      return { id, result };
    } catch (error) {
      return rejectWithValue('Network error while deleting formulation');
    }
  }
);

export const archiveFormulation = createAsyncThunk(
  'formulations/archive',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/formulations/${id}/archive`, { method: 'PATCH' });
      const result = await res.json();
      
      if (!res.ok) {
        return rejectWithValue(result.error || 'Failed to archive formulation');
      }
      
      return result.formulation;
    } catch (error) {
      return rejectWithValue('Network error while archiving formulation');
    }
  }
);

export const restoreFormulation = createAsyncThunk(
  'formulations/restore',
  async (id: number, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/formulations/${id}/restore`, { method: 'PATCH' });
      const result = await res.json();
      
      if (!res.ok) {
        return rejectWithValue(result.error || 'Failed to restore formulation');
      }
      
      return result.formulation;
    } catch (error) {
      return rejectWithValue('Network error while restoring formulation');
    }
  }
);

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
    removeFormulation: (state, action: PayloadAction<number>) => {
      return state.filter(f => f.id !== action.payload);
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchFormulations.fulfilled, (_state, action) => action.payload)
      .addCase(deleteFormulation.fulfilled, (state, action) => {
        const { id, result } = action.payload;
        if (result.deleted) {
          // Remove from state if permanently deleted
          return state.filter(f => f.id !== id);
        } else if (result.archived) {
          // Update isActive to false if archived
          const idx = state.findIndex(f => f.id === id);
          if (idx !== -1) {
            state[idx] = { ...state[idx], isActive: false };
          }
        }
      })
      .addCase(archiveFormulation.fulfilled, (state, action) => {
        const idx = state.findIndex(f => f.id === action.payload.id);
        if (idx !== -1) {
          state[idx] = action.payload;
        }
      })
      .addCase(restoreFormulation.fulfilled, (state, action) => {
        const idx = state.findIndex(f => f.id === action.payload.id);
        if (idx !== -1) {
          state[idx] = action.payload;
        }
      });
  }
});

// 3. Export actions & reducer
export const { addFormulation, updateFormulation } = formulationsSlice.actions;
export default formulationsSlice.reducer;
