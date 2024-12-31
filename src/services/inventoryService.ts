import { 
  InventoryEntry, 
  InventoryTransaction, 
  StorageLocation, 
  MaterialStock 
} from '../types';
import { COLLECTIONS } from './firebaseService';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

export const useInventorySync = () => {
  const { 
    data: entries,
    loading: entriesLoading,
    error: entriesError,
    addItem: addEntry,
    updateItem: updateEntry,
    deleteItem: deleteEntry
  } = useFirebaseSync<InventoryEntry>(COLLECTIONS.INVENTORY_ENTRIES);

  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError,
    addItem: addTransaction,
    updateItem: updateTransaction,
    deleteItem: deleteTransaction
  } = useFirebaseSync<InventoryTransaction>(COLLECTIONS.INVENTORY_TRANSACTIONS);

  const {
    data: locations,
    loading: locationsLoading,
    error: locationsError,
    addItem: addLocation,
    updateItem: updateLocation,
    deleteItem: deleteLocation
  } = useFirebaseSync<StorageLocation>(COLLECTIONS.STORAGE_LOCATIONS);

  const {
    data: stocks,
    loading: stocksLoading,
    error: stocksError,
    addItem: addStock,
    updateItem: updateStock,
    deleteItem: deleteStock
  } = useFirebaseSync<MaterialStock>(COLLECTIONS.MATERIAL_STOCKS);

  const loading = entriesLoading || transactionsLoading || locationsLoading || stocksLoading;
  const error = entriesError || transactionsError || locationsError || stocksError;

  const addInventoryEntry = async (entry: Omit<InventoryEntry, 'id' | 'createdAt'>) => {
    const newEntry: InventoryEntry = {
      ...entry,
      id: `entry-${Date.now()}`,
      createdAt: Date.now()
    };
    await addEntry(newEntry);

    // Create corresponding transaction
    const transaction: Omit<InventoryTransaction, 'id' | 'createdAt'> = {
      type: 'entry',
      materialId: entry.materialId,
      quantity: entry.quantity,
      unit: entry.unit,
      unitPrice: entry.unitPrice,
      totalPrice: entry.totalPrice,
      reference: entry.documentNumber,
      notes: entry.notes,
      createdBy: entry.buyer
    };
    await addInventoryTransaction(transaction);
  };

  const updateInventoryEntry = async (id: string, entry: Partial<InventoryEntry>) => {
    await updateEntry(id, entry);
  };

  const addInventoryTransaction = async (transaction: Omit<InventoryTransaction, 'id' | 'createdAt'>) => {
    const newTransaction: InventoryTransaction = {
      ...transaction,
      id: `transaction-${Date.now()}`,
      createdAt: Date.now()
    };
    await addTransaction(newTransaction);

    // Update material stock
    const existingStock = stocks.find(s => 
      s.materialId === transaction.materialId
    );

    if (existingStock) {
      const newQuantity = transaction.type === 'entry' 
        ? existingStock.quantity + transaction.quantity
        : existingStock.quantity - transaction.quantity;

      await updateStock(existingStock.id, {
        quantity: newQuantity,
        lastUpdated: Date.now()
      });
    } else if (transaction.type === 'entry') {
      const newStock: MaterialStock = {
        id: `stock-${Date.now()}`,
        materialId: transaction.materialId,
        quantity: transaction.quantity,
        unit: transaction.unit,
        location: 'default',
        lastUpdated: Date.now()
      };
      await addStock(newStock);
    }
  };

  const addStorageLocation = async (location: Omit<StorageLocation, 'id' | 'createdAt'>) => {
    const newLocation: StorageLocation = {
      ...location,
      id: `location-${Date.now()}`,
      createdAt: Date.now()
    };
    await addLocation(newLocation);
  };

  const updateStorageLocation = async (id: string, location: Partial<StorageLocation>) => {
    await updateLocation(id, location);
  };

  const updateMaterialStock = async (materialId: string, stock: Partial<MaterialStock>) => {
    const updatedStock = {
      ...stock,
      lastUpdated: Date.now()
    };
    await updateStock(materialId, updatedStock);
  };

  return {
    // Data
    entries,
    transactions,
    locations,
    stocks,
    
    // Loading states
    loading,
    
    // Errors
    error,
    
    // Entry operations
    addInventoryEntry,
    updateInventoryEntry,
    deleteEntry,
    
    // Transaction operations
    addInventoryTransaction,
    updateTransaction,
    deleteTransaction,
    
    // Location operations
    addStorageLocation,
    updateStorageLocation,
    deleteLocation,
    
    // Stock operations
    updateMaterialStock,
    deleteStock
  };
}; 