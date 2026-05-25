import { useContext } from 'react';
import { StoreContext } from '../context/storeContext';

export function useApp() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useApp must be used within AppProvider');
  }
  return ctx;
}
