// src/components/production/ProductsList.tsx

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Edit2, 
  Trash2, 
  ChevronLeft, 
  BookOpen,
  AlertCircle,
  Loader,
  Package
} from 'lucide-react';
import { db } from '../../database';
import { ProductDefinition } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface ProductsListProps {
  onProductSelect: (product: ProductDefinition) => void;
}

export default function ProductsList({ onProductSelect }: ProductsListProps) {
  const [products, setProducts] = useState<ProductDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({ isOpen: false, productId: '', productName: '' });

  useEffect(() => {
    console.log('ProductsList mounted - Loading products');
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load products
      const loadedProducts = db.getProductDefinitions();
      console.log('Loaded products:', loadedProducts);
      setProducts(loadedProducts);

      // Load departments for reference
      const saleDepts = db.getDepartmentsByType('sale');
      const prodDepts = db.getDepartmentsByType('production');
      console.log('Available sale departments:', saleDepts);
      console.log('Available production departments:', prodDepts);

    } catch (err) {
      console.error('Error loading products:', err);
      setError('خطا در بارگیری محصولات');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirm.productId) {
      try {
        console.log('Deleting product:', deleteConfirm.productId);
        
        // Check if product has any recipes
        const recipes = db.getProductRecipes(deleteConfirm.productId);
        if (recipes.length > 0) {
          setError('این محصول دارای دستور پخت است و نمی‌توان آن را حذف کرد');
          return;
        }

        db.deleteProductDefinition(deleteConfirm.productId);
        await loadProducts(); // Reload the list
        console.log('Product deleted successfully');
        
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('خطا در حذف محصول');
      }
    }
    setDeleteConfirm({ isOpen: false, productId: '', productName: '' });
  };

  const getDepartmentName = (id: string, type: 'sale' | 'production'): string => {
    try {
      const department = db.getDepartmentsByType(type).find(d => d.id === id);
      if (!department) {
        console.warn(`Department not found - type: ${type}, id: ${id}`);
        return 'نامشخص';
      }
      return department.name;
    } catch (err) {
      console.error(`Error getting ${type} department name:`, err);
      return 'خطا';
    }
  };

  const getRecipeCount = (productId: string): number => {
    try {
      const count = db.getProductRecipes(productId).length;
      console.log(`Recipe count for product ${productId}:`, count);
      return count;
    } catch (err) {
      console.error('Error getting recipe count:', err);
      return 0;
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getDepartmentName(product.saleDepartment, 'sale').toLowerCase().includes(searchQuery.toLowerCase()) ||
    getDepartmentName(product.productionSegment, 'production').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="h-8 w-8 animate-spin text-blue-500" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">در حال بارگیری محصولات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="جستجوی محصول..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                      rounded-lg p-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div 
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm
                      border border-gray-200/50 dark:border-gray-700/50
                      hover:shadow-md transition-all duration-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    کد: {product.code}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onProductSelect(product)}
                    className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                    title="مدیریت دستور پخت"
                  >
                    <BookOpen className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({
                      isOpen: true,
                      productId: product.id,
                      productName: product.name
                    })}
                    className="p-1.5 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    واحد فروش:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getDepartmentName(product.saleDepartment, 'sale')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    واحد تولید:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getDepartmentName(product.productionSegment, 'production')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    تعداد دستور پخت:
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {getRecipeCount(product.id)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onProductSelect(product)}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 
                         bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 
                         rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
              >
                مدیریت دستور پخت
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="flex flex-col items-center justify-center">
            <Package className="h-12 w-12 text-gray-400 mb-4" />
            {searchQuery ? (
              <p className="text-gray-500 dark:text-gray-400">
                محصولی با این مشخصات یافت نشد
              </p>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">
                هنوز محصولی تعریف نشده است
              </p>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.productName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, productId: '', productName: '' })}
      />
    </div>
  );
}