import { Product } from '../types';
import { COLLECTIONS } from './firebaseService';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

export const useProductSync = () => {
  const {
    data: products,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem
  } = useFirebaseSync<Product>(COLLECTIONS.PRODUCTS);

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await addItem(newProduct);
  };

  const updateProduct = async (id: string, product: Partial<Product>) => {
    const updatedProduct = {
      ...product,
      updatedAt: Date.now()
    };
    await updateItem(id, updatedProduct);
  };

  const deleteProduct = async (id: string) => {
    await deleteItem(id);
  };

  const getProductByCode = (code: string) => {
    return products.find(p => p.code === code);
  };

  const getProductsByCategory = (category: string) => {
    return products.filter(p => p.category === category);
  };

  const getActiveProducts = () => {
    return products.filter(p => p.isActive);
  };

  const updatePrice = async (id: string, newPrice: number) => {
    await updateProduct(id, {
      price: newPrice,
      updatedAt: Date.now()
    });
  };

  const toggleProductStatus = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    await updateProduct(id, {
      isActive: !product.isActive,
      updatedAt: Date.now()
    });
  };

  return {
    // Data
    products,
    
    // Loading state
    loading,
    
    // Error state
    error,
    
    // Basic operations
    addProduct,
    updateProduct,
    deleteProduct,
    
    // Query operations
    getProductByCode,
    getProductsByCategory,
    getActiveProducts,
    
    // Specific operations
    updatePrice,
    toggleProductStatus
  };
}; 