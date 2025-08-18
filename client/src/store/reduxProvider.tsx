import { Provider } from 'react-redux';
import { store } from './index';
import React from 'react';

export const ReduxProvider = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);
