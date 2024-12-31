import { SalesDataset } from '../types';
import { COLLECTIONS } from './firebaseService';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

export const useSalesSync = () => {
  const {
    data: salesData,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  } = useFirebaseSync<SalesDataset>(COLLECTIONS.SALES_DATA);

  const addSalesDataset = async (dataset: Omit<SalesDataset, 'id' | 'importDate'>) => {
    const newDataset: SalesDataset = {
      ...dataset,
      id: `sales-${Date.now()}`,
      importDate: Date.now()
    };
    await addItem(newDataset);
  };

  const updateSalesDataset = async (id: string, dataset: Partial<SalesDataset>) => {
    await updateItem(id, dataset);
  };

  const deleteSalesDataset = async (id: string) => {
    await deleteItem(id);
  };

  return {
    // Data
    salesData,
    
    // Loading state
    loading,
    
    // Error state
    error,
    
    // Operations
    addSalesDataset,
    updateSalesDataset,
    deleteSalesDataset
  };
}; 