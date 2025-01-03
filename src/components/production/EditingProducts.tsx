import React, { useState, useEffect } from 'react';
import { 
  Edit2, 
  Trash2, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  ArrowUpDown, 
  X 
} from 'lucide-react';
import { ExtendedProductDefinition } from '../../types';
import { db } from '../../database';
import BulkEditProductDialog from './BulkEditProductDialog';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import ProductImport from './ProductImport';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';

interface FilterState {
  search: string;
  name: string;
  code: string;
  saleDepartment: string;
  productionSegment: string;
}

interface SortState {
  field: keyof ExtendedProductDefinition | undefined;
  direction: 'asc' | 'desc';
}

const initialFilterState: FilterState = {
  search: '',
  name: '',
  code: '',
  saleDepartment: '',
  productionSegment: ''
};

export default function EditingProducts() {
  const [products, setProducts] = useState<ExtendedProductDefinition[]>([]);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [sort, setSort] = useState<SortState>({ field: undefined, direction: 'asc' });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<ExtendedProductDefinition[]>([]);
  const [layout, setLayout] = useState<'grid' | 'list'>(() => {
    return localStorage.getItem('productsListLayout') as 'grid' | 'list' || 'grid';
  });

  // Save layout preference whenever it changes
  useEffect(() => {
    localStorage.setItem('productsListLayout', layout);
  }, [layout]);

  useEffect(() => {
    loadAllProducts();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [products, filters, sort]);

  const loadAllProducts = () => {
    try {
      const definedProducts = db.getProductDefinitions();
      const inventoryProducts = db.getProducts();
      const saleDepartments = db.getDepartmentsByType('sale');
      const productionDepartments = db.getDepartmentsByType('production');
      
      const allProducts = [...definedProducts].map(product => ({
        ...product,
        isActive: db.isProductActive(product.id)
      }));
      
      // Add products from inventory if they don't exist in definitions
      inventoryProducts.forEach(invProduct => {
        if (!definedProducts.some(defProduct => defProduct.code === invProduct.code)) {
          // Find matching departments
          const saleDepartment = saleDepartments.find(d => d.id === invProduct.department);
          const productionDepartment = productionDepartments.find(d => d.id === invProduct.department);
          
          allProducts.push({
            id: invProduct.id,
            name: invProduct.name,
            code: invProduct.code,
            saleDepartment: saleDepartment?.id || '',
            productionSegment: productionDepartment?.id || '',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true
          });
        }
      });

      setProducts(allProducts);
    } catch (err) {
      console.error('Error loading products:', err);
    }
  };

  const normalizeString = (str: string | number): string => {
    return String(str).toLowerCase().trim();
  };

  const isNumeric = (str: string): boolean => {
    if (typeof str !== 'string') return false;
    return !isNaN(parseFloat(str)) && isFinite(Number(str));
  };

  const getDepartmentName = (id: string, type: 'sale' | 'production'): string => {
    if (!id) return 'نامشخص';
    try {
      const departments = db.getDepartmentsByType(type);
      const department = departments.find(d => d.id === id);
      return department?.name || 'نامشخص';
    } catch (err) {
      console.error(`Error getting ${type} department name:`, err);
      return 'خطا';
    }
  };

  // Fixed Selection Handlers
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      const allIds = filteredProducts.map(product => product.id);
      setSelectedProducts(allIds);
    }
  };

  const handleRowClick = (product: ExtendedProductDefinition) => {
    setSelectedProducts(prev => {
      const isSelected = prev.includes(product.id);
      if (isSelected) {
        return prev.filter(id => id !== product.id);
      } else {
        return [...prev, product.id];
      }
    });
  };

  const handleSort = (field: keyof ExtendedProductDefinition) => {
    setSort(prevSort => ({
      field,
      direction: 
        prevSort.field === field && prevSort.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters(initialFilterState);
    setSort({ field: undefined, direction: 'asc' });
  };

  const handleBulkEdit = (changes: Partial<ExtendedProductDefinition>) => {
    const user = getCurrentUser();
    selectedProducts.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product) {
        const updatedProduct: ExtendedProductDefinition = { ...product, ...changes };
        
        // Update the active status if it was changed
        if (changes.isActive !== undefined) {
          db.updateProductStatus(id, changes.isActive);
        }
        
        // Update other product fields
        db.updateProductDefinition(updatedProduct);
        
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'edit',
            'products',
            `Updated product "${product.name}"`
          );
        }
      }
    });
    loadAllProducts();
    setShowBulkEdit(false);
    setSelectedProducts([]);
  };

  const handleBulkDelete = () => {
    const user = getCurrentUser();
    selectedProducts.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product) {
        db.deleteProductDefinition(id);
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'delete',
            'products',
            `Deleted product "${product.name}"`
          );
        }
      }
    });
    loadAllProducts();
    setShowDeleteConfirm(false);
    setSelectedProducts([]);
  };

  const handleFilterChange = (field: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleImportSuccess = () => {
    loadAllProducts();
    setShowImportDialog(false);
  };

  const applyFiltersAndSort = () => {
    let result = [...products];

    // Apply filters
    result = result.filter(product => {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = !filters.search || 
        Object.entries(product).some(([key, value]) => {
          if (typeof value === 'string') {
            return value.toLowerCase().includes(searchLower);
          }
          if (typeof value === 'boolean') {
            return value.toString().toLowerCase().includes(searchLower);
          }
          return String(value).toLowerCase().includes(searchLower);
        });

      const matchesName = !filters.name || 
        product.name.toLowerCase().includes(filters.name.toLowerCase());

      const matchesCode = !filters.code || 
        product.code.toLowerCase().includes(filters.code.toLowerCase());

      const matchesSaleDepartment = !filters.saleDepartment || 
        product.saleDepartment.toLowerCase().includes(filters.saleDepartment.toLowerCase());

      const matchesProductionSegment = !filters.productionSegment || 
        product.productionSegment.toLowerCase().includes(filters.productionSegment.toLowerCase());

      return matchesSearch && matchesName && matchesCode && 
             matchesSaleDepartment && matchesProductionSegment;
    });

    // Apply sorting
    if (sort.field) {
      result.sort((a, b) => {
        let valueA = a[sort.field!];
        let valueB = b[sort.field!];

        // Handle undefined values
        if (valueA === undefined && valueB === undefined) return 0;
        if (valueA === undefined) return sort.direction === 'asc' ? -1 : 1;
        if (valueB === undefined) return sort.direction === 'asc' ? 1 : -1;

        if (typeof valueA === 'string' && typeof valueB === 'string') {
          valueA = normalizeString(valueA);
          valueB = normalizeString(valueB);
        }

        if (sort.field === 'isActive') {
          return sort.direction === 'asc'
            ? ((valueA as boolean) === (valueB as boolean) ? 0 : (valueA as boolean) ? -1 : 1)
            : ((valueA as boolean) === (valueB as boolean) ? 0 : (valueA as boolean) ? 1 : -1);
        }

        if (valueA < valueB) return sort.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredProducts(result);
  };

  const handleEditProduct = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Add edit functionality
    console.log('Edit product:', productId);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            ویرایش کالا
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportDialog(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white 
                       rounded-lg hover:bg-green-600 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              ورود گروهی
            </button>
            {selectedProducts.length > 0 && (
              <>
                <button
                  onClick={() => setShowBulkEdit(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                           hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  ویرایش گروهی ({selectedProducts.length})
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg
                           hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  حذف گروهی
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="space-y-4">
          {/* Global Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="جستجوی کلی..."
              value={filters.search}
              onChange={handleSearchChange}
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
            {Object.values(filters).some(value => value !== '') && (
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
      </div>
      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام
              </label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => handleFilterChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد
              </label>
              <input
                type="text"
                value={filters.code}
                onChange={(e) => handleFilterChange('code', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                بخش
              </label>
              <input
                type="text"
                value={filters.saleDepartment}
                onChange={(e) => handleFilterChange('saleDepartment', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                بخش
              </label>
              <input
                type="text"
                value={filters.productionSegment}
                onChange={(e) => handleFilterChange('productionSegment', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}
      {/* Results Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          نمایش {filteredProducts.length} مورد از {products.length} مورد
        </div>
        {selectedProducts.length > 0 && (
          <div className="text-sm text-blue-600 dark:text-blue-400">
            {selectedProducts.length} مورد انتخاب شده
          </div>
        )}
      </div>

      {/* Table Section with Fixed Checkbox Behavior */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                  onChange={handleSelectAll}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              {[
                { key: 'name' as const, label: 'نام' },
                { key: 'code' as const, label: 'کد' },
                { key: 'saleDepartment' as const, label: 'واحد فروش' },
                { key: 'productionSegment' as const, label: 'واحد تولید' },
                { key: 'isActive' as const, label: 'وضعیت' }
              ].map(column => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 
                           uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown className={`h-4 w-4 ${
                      sort.field === column.key 
                        ? 'text-blue-500' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProducts.map((product) => (
              <tr 
                key={product.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                onClick={() => handleRowClick(product)}
              >
                <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProducts(prev => [...prev, product.id]);
                      } else {
                        setSelectedProducts(prev => prev.filter(id => id !== product.id));
                      }
                    }}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {product.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getDepartmentName(product.saleDepartment, 'sale')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getDepartmentName(product.productionSegment, 'production')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {product.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditProduct(product.id, e)}
                      className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                      title="ویرایش"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedProducts([product.id]);
                        setShowDeleteConfirm(true);
                      }}
                      className="p-1.5 text-red-500 hover:text-red-600 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  موردی یافت نشد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Dialogs */}
      {showBulkEdit && (
        <BulkEditProductDialog
          isOpen={showBulkEdit}
          onClose={() => setShowBulkEdit(false)}
          onConfirm={handleBulkEdit}
          selectedCount={selectedProducts.length}
          departments={db.getDepartmentsByType('sale')}
          productionSegments={db.getDepartmentsByType('production')}
        />
      )}

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        itemName={`${selectedProducts.length} مورد انتخاب شده`}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {showImportDialog && (
        <ProductImport
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
}