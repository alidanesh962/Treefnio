import { Department } from '../types';
import { COLLECTIONS } from './firebaseService';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

export const useDepartmentSync = () => {
  const {
    data: departments,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  } = useFirebaseSync<Department>(COLLECTIONS.DEPARTMENTS);

  const addDepartment = async (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDepartment: Department = {
      ...department,
      id: `dept-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true
    };
    await addItem(newDepartment);
  };

  const updateDepartment = async (id: string, department: Partial<Department>) => {
    const updatedDepartment = {
      ...department,
      updatedAt: Date.now()
    };
    await updateItem(id, updatedDepartment);
  };

  const deleteDepartment = async (id: string) => {
    await deleteItem(id);
  };

  const getDepartmentsByType = (type: 'sale' | 'production') => {
    return departments.filter(d => d.type === type);
  };

  const getActiveDepartments = () => {
    return departments.filter(d => d.isActive);
  };

  const toggleDepartmentStatus = async (id: string) => {
    const department = departments.find(d => d.id === id);
    if (!department) return;

    await updateDepartment(id, {
      isActive: !department.isActive,
      updatedAt: Date.now()
    });
  };

  const initializeDefaultDepartments = async () => {
    const saleDepts = getDepartmentsByType('sale');
    const prodDepts = getDepartmentsByType('production');
    
    if (saleDepts.length === 0) {
      await addDepartment({
        name: 'فروش عمومی',
        type: 'sale',
        isActive: true
      });
    }
    
    if (prodDepts.length === 0) {
      await addDepartment({
        name: 'تولید عمومی',
        type: 'production',
        isActive: true
      });
    }
  };

  return {
    // Data
    departments,
    
    // Loading state
    loading,
    
    // Error state
    error,
    
    // Basic operations
    addDepartment,
    updateDepartment,
    deleteDepartment,
    
    // Query operations
    getDepartmentsByType,
    getActiveDepartments,
    
    // Specific operations
    toggleDepartmentStatus,
    initializeDefaultDepartments
  };
}; 