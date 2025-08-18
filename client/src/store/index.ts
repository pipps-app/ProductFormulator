import { configureStore } from '@reduxjs/toolkit';
import rawMaterialsReducer from './rawMaterialsSlice';
import formulationsReducer from './formulationsSlice';

export const store = configureStore({
  reducer: {
    rawMaterials: rawMaterialsReducer,
    formulations: formulationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
