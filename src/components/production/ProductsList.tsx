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
  Package,
  Plus,
  Filter,
  X,
  ArrowUpDown
} from 'lucide-react';
import { db } from '../../database';
import { ProductDefinition } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import ProductDefinitionForm from './ProductDefinitionForm';

interface ProductsListProps {
  onProductSelect: (product: ProductDefinition) => void;
}

interface FilterState {
  name: string;
  code: string;
  saleDepartment: string;
  productionSegment: string;
  hasRecipe: 'all' | 'yes' | 'no';
  createdDateFrom: string;
  createdDateTo: string;
}

const initialFilterState: FilterState = {
  name: '',
  code: '',
  saleDepartment: '',
  productionSegment: '',
  hasRecipe: 'all',
  createdDateFrom: '',
  createdDateTo: ''
};

interface SortConfig {
  field: keyof ProductDefinition;
  direction: 'asc' | 'desc';
}
export default function ProductsList({ onProductSelect }: ProductsListProps) {
  const [products, setProducts] = useState<ProductDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDefinitionForm, setShowDefinitionForm] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [saleDepartments, setSaleDepartments] = useState<string[]>([]);
  const [productionDepartments, setProductionDepartments] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({ isOpen: false, productId: '', productName: '' });

  useEffect(() => {
    loadProducts();
    loadDepartments();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const definedProducts = db.getProductDefinitions();
      const inventoryProducts = db.getProducts();
      
      const allProducts = [...definedProducts];
      
      inventoryProducts.forEach(invProduct => {
        if (!definedProducts.some(defProduct => defProduct.code === invProduct.code)) {
          allProducts.push({
            id: invProduct.id,
            name: invProduct.name,
            code: invProduct.code,
            saleDepartment: invProduct.department,
            productionSegment: invProduct.department,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
      });

      setProducts(allProducts);

    } catch (err) {
      console.error('Error loading products:', err);
      setError('خطا در بارگیری محصولات');
    } finally {
      setIsLoading(false);
    }
  };
  const loadDepartments = () => {
    const saleDepts = db.getDepartmentsByType('sale');
    const prodDepts = db.getDepartmentsByType('production');
    setSaleDepartments(saleDepts.map(d => d.id));
    setProductionDepartments(prodDepts.map(d => d.id));
  };

  const handleDefinitionSuccess = () => {
    loadProducts();
    setShowDefinitionForm(false);
  };

  const handleSort = (field: keyof ProductDefinition) => {
    setSortConfig(current => {
      if (!current || current.field !== field) {
        return { field, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return null;
    });
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    setSortConfig(null);
    setSearchQuery('');
  };

  const getDepartmentName = (id: string, type: 'sale' | 'production'): string => {
    try {
      const department = db.getDepartmentsByType(type).find(d => d.id === id);
      return department?.name || 'نامشخص';
    } catch (err) {
      console.error(`Error getting ${type} department name:`, err);
      return 'خطا';
    }
  };

  const getRecipeCount = (productId: string): number => {
    try {
      return db.getProductRecipes(productId).length;
    } catch (err) {
      console.error('Error getting recipe count:', err);
      return 0;
    }
  };
  const filteredAndSortedProducts = React.useMemo(() => {
    let result = [...products];

    // Apply search query
    if (searchQuery) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply advanced filters
    if (filters.name) {
      result = result.filter(product =>
        product.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.code) {
      result = result.filter(product =>
        product.code.toLowerCase().includes(filters.code.toLowerCase())
      );
    }
    if (filters.saleDepartment) {
      result = result.filter(product =>
        product.saleDepartment === filters.saleDepartment
      );
    }
    if (filters.productionSegment) {
      result = result.filter(product =>
        product.productionSegment === filters.productionSegment
      );
    }
    if (filters.hasRecipe !== 'all') {
      const hasRecipes = filters.hasRecipe === 'yes';
      result = result.filter(product => {
        const recipeCount = db.getProductRecipes(product.id).length;
        return hasRecipes ? recipeCount > 0 : recipeCount === 0;
      });
    }
    if (filters.createdDateFrom) {
      const fromDate = new Date(filters.createdDateFrom).getTime();
      result = result.filter(product => product.createdAt >= fromDate);
    }
    if (filters.createdDateTo) {
      const toDate = new Date(filters.createdDateTo).getTime() + (24 * 60 * 60 * 1000 - 1);
      result = result.filter(product => product.createdAt <= toDate);
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.field] < b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.field] > b[sortConfig.field]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [products, searchQuery, filters, sortConfig]);
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
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          لیست محصولات
        </h2>
        <button
          onClick={() => setShowDefinitionForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          تعریف محصول جدید
        </button>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        {/* Global Search */}
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

        {/* Advanced Filters Toggle */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
          >
            <Filter className="h-4 w-4" />
            {showAdvancedFilters ? 'مخفی کردن فیلترها' : 'نمایش فیلترهای پیشرفته'}
          </button>
          {(Object.values(filters).some(value => 
            value !== '' && value !== null && value !== 'all') ||
            searchQuery
          ) && (
            <button
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-600 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              پاک کردن فیلترها
            </button>
          )}
        </div>
      </div>
      {/* Products Grid - Fixed width container */}
      <div className="w-full">
        {filteredAndSortedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-full">
            {filteredAndSortedProducts.map(product => (
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
              <p className="text-gray-500 dark:text-gray-400">
                موردی یافت نشد
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Product Definition Form Dialog */}
      {showDefinitionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
            <ProductDefinitionForm 
              onBack={() => setShowDefinitionForm(false)}
              onSuccess={handleDefinitionSuccess}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteConfirm.isOpen}
        itemName={deleteConfirm.productName}
        onConfirm={() => {
          if (deleteConfirm.productId) {
            db.deleteProductDefinition(deleteConfirm.productId);
            loadProducts();
          }
          setDeleteConfirm({ isOpen: false, productId: '', productName: '' });
        }}
        onCancel={() => setDeleteConfirm({ isOpen: false, productId: '', productName: '' })}
      />
    </div>
  );
}