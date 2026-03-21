import { createContext, useContext } from 'react';
import type { BIMContextType } from './BIMProvider';

export const BIMContext = createContext<BIMContextType | undefined>(undefined);

export const useBIMContext = () => {
  const context = useContext(BIMContext);
  if (!context) {
    throw new Error('useBIMEngine must be used within a BIMProvider');
  }
  return context;
};
