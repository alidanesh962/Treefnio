import { ProductionBatch, Recipe, Product } from '../types';
import { COLLECTIONS } from './firebaseService';
import { useFirebaseSync } from '../hooks/useFirebaseSync';

export const useProductionSync = () => {
  const {
    data: batches,
    loading: batchesLoading,
    error: batchesError,
    addItem: addBatch,
    updateItem: updateBatch,
    deleteItem: deleteBatch
  } = useFirebaseSync<ProductionBatch>(COLLECTIONS.PRODUCTION_BATCHES);

  const {
    data: recipes,
    loading: recipesLoading,
    error: recipesError,
    addItem: addRecipe,
    updateItem: updateRecipe,
    deleteItem: deleteRecipe
  } = useFirebaseSync<Recipe>(COLLECTIONS.RECIPES);

  const {
    data: products,
    loading: productsLoading,
    error: productsError,
    addItem: addProduct,
    updateItem: updateProduct,
    deleteItem: deleteProduct
  } = useFirebaseSync<Product>(COLLECTIONS.PRODUCTS);

  const loading = batchesLoading || recipesLoading || productsLoading;
  const error = batchesError || recipesError || productsError;

  const addProductionBatch = async (batch: Omit<ProductionBatch, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newBatch: ProductionBatch = {
      ...batch,
      id: `batch-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await addBatch(newBatch);
  };

  const updateProductionBatch = async (id: string, batch: Partial<ProductionBatch>) => {
    const updatedBatch = {
      ...batch,
      updatedAt: Date.now()
    };
    await updateBatch(id, updatedBatch);
  };

  const addNewRecipe = async (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true
    };
    await addRecipe(newRecipe);
  };

  const updateRecipeDetails = async (id: string, recipe: Partial<Recipe>) => {
    const updatedRecipe = {
      ...recipe,
      updatedAt: Date.now()
    };
    await updateRecipe(id, updatedRecipe);
  };

  const addNewProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: `product-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await addProduct(newProduct);
  };

  const updateProductDetails = async (id: string, product: Partial<Product>) => {
    const updatedProduct = {
      ...product,
      updatedAt: Date.now()
    };
    await updateProduct(id, updatedProduct);
  };

  return {
    // Data
    batches,
    recipes,
    products,
    
    // Loading states
    loading,
    
    // Error states
    error,
    
    // Batch operations
    addProductionBatch,
    updateProductionBatch,
    deleteBatch,
    
    // Recipe operations
    addNewRecipe,
    updateRecipeDetails,
    deleteRecipe,
    
    // Product operations
    addNewProduct,
    updateProductDetails,
    deleteProduct
  };
}; 