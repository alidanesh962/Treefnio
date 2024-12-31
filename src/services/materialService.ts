import { Material } from '../types';
import { COLLECTIONS } from './firebaseService';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

export const useMaterialSync = () => {
  const {
    data: materials,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  } = useFirebaseSync<Material>(COLLECTIONS.MATERIALS);

  const addMaterial = async (material: Omit<Material, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newMaterial: Material = {
      ...material,
      id: `material-${Date.now()}`,
      createdAt: Date.now().toString(),
      updatedAt: Date.now().toString()
    };
    await addItem(newMaterial);
  };

  const updateMaterial = async (id: string, material: Partial<Material>) => {
    const updatedMaterial = {
      ...material,
      updatedAt: Date.now().toString()
    };
    await updateItem(id, updatedMaterial);
  };

  const deleteMaterial = async (id: string) => {
    await deleteItem(id);
  };

  const getMaterialByCode = (code: string) => {
    return materials.find(m => m.code === code);
  };

  const getMaterialsByCategory = (category: string) => {
    return materials.filter(m => m.category === category);
  };

  const getLowStockMaterials = () => {
    return materials.filter(m => m.currentStock <= m.minimumStock);
  };

  const updateStock = async (id: string, quantity: number, isAddition: boolean = true) => {
    const material = materials.find(m => m.id === id);
    if (!material) return;

    const newStock = isAddition 
      ? material.currentStock + quantity
      : material.currentStock - quantity;

    await updateMaterial(id, {
      currentStock: newStock,
      updatedAt: Date.now().toString()
    });
  };

  return {
    // Data
    materials,
    
    // Loading state
    loading,
    
    // Error state
    error,
    
    // Basic operations
    addMaterial,
    updateMaterial,
    deleteMaterial,
    
    // Query operations
    getMaterialByCode,
    getMaterialsByCategory,
    getLowStockMaterials,
    
    // Stock operations
    updateStock
  };
}; 