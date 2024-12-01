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
  ArrowUpDown,
  FileText,
  ToggleLeft,
  ToggleRight,
  CheckSquare,
  Square,
  Grid,
  LayoutList
} from 'lucide-react';
import { db } from '../../database';
import { ProductDefinition } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import ProductDefinitionForm from './ProductDefinitionForm';
import { exportRecipesToPDF } from '../../utils/newRecipePDFExport';

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
  status: 'all' | 'active' | 'inactive';
}

const initialFilterState: FilterState = {
  name: '',
  code: '',
  saleDepartment: '',
  productionSegment: '',
  hasRecipe: 'all',
  createdDateFrom: '',
  createdDateTo: '',
  status: 'all'
};

interface SortConfig {
  field: keyof ProductDefinition;
  direction: 'asc' | 'desc';
}

interface ExtendedProductDefinition extends ProductDefinition {
  isActive: boolean;
}
export default function ProductsList({ onProductSelect }: ProductsListProps) {
  // Layout and basic state
  const [layout, setLayout] = useState<'grid' | 'table'>('grid');
  const [products, setProducts] = useState<ExtendedProductDefinition[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI state
  const [showDefinitionForm, setShowDefinitionForm] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(initialFilterState);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  // Department state
  const [saleDepartments, setSaleDepartments] = useState<string[]>([]);
  const [productionDepartments, setProductionDepartments] = useState<string[]>([]);
  
  // Selection and deletion state
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productIds: string[];
    count: number;
  }>({ isOpen: false, productIds: [], count: 0 });

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
      
      const allProducts = [...definedProducts].map(product => ({
        ...product,
        isActive: db.isProductActive(product.id)
      }));
      
      // Add products from inventory if they don't exist in definitions
      inventoryProducts.forEach(invProduct => {
        if (!definedProducts.some(defProduct => defProduct.code === invProduct.code)) {
          allProducts.push({
            id: invProduct.id,
            name: invProduct.name,
            code: invProduct.code,
            saleDepartment: invProduct.department,
            productionSegment: invProduct.department,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isActive: true
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

  const handleProductStatus = async (productId: string, status: boolean) => {
    try {
      await db.updateProductStatus(productId, status);
      setProducts(prev => prev.map(product => 
        product.id === productId 
          ? { ...product, isActive: status }
          : product
      ));
    } catch (err) {
      console.error('Error updating product status:', err);
      setError('خطا در بروزرسانی وضعیت محصول');
    }
  };

  const handleDeleteSelected = () => {
    setDeleteConfirm({
      isOpen: true,
      productIds: selectedProducts,
      count: selectedProducts.length
    });
  };

  const handleDeleteConfirm = () => {
    deleteConfirm.productIds.forEach(id => {
      db.deleteProductDefinition(id);
    });
    loadProducts();
    setSelectedProducts([]);
    setDeleteConfirm({ isOpen: false, productIds: [], count: 0 });
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
    setSelectedProducts([]);
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
  const handleExportRecipes = async (product: ExtendedProductDefinition) => {
    try {
      const recipes = db.getProductRecipes(product.id);
      if (recipes.length === 0) {
        setError('هیچ دستور پختی برای این محصول یافت نشد');
        return;
      }

      const materials = db.getMaterials();
      const units = db.getMaterialUnits();

      // Create PDF content container
      const pdfContent = document.createElement('div');
      pdfContent.className = 'pdf-container';
      
      // Add each recipe to the PDF content
      recipes.forEach(recipe => {
        const getMaterialName = (materialId: string): string => {
          const material = materials.find(m => m.id === materialId);
          return material?.name || '';
        };

        const getUnitSymbol = (unitId: string): string => {
          const unit = units.find(u => u.id === unitId);
          return unit?.symbol || '';
        };

        const totalCost = recipe.materials.reduce((sum, material) => sum + material.totalPrice, 0);

        const recipeDiv = document.createElement('div');
        recipeDiv.className = 'recipe-page';
        recipeDiv.innerHTML = `
          <div style="margin-bottom: 20px;">
            <h2 style="font-size: 24px; margin-bottom: 10px;">${recipe.name}</h2>
            <div style="margin-bottom: 10px;">
              <p>محصول: ${product.name}</p>
              <p>کد محصول: ${product.code}</p>
            </div>
            ${recipe.notes ? `
              <div style="background-color: #f3f4f6; padding: 10px; margin: 10px 0;">
                <h3 style="margin-bottom: 5px;">توضیحات:</h3>
                <p>${recipe.notes}</p>
              </div>
            ` : ''}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">ماده اولیه</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">مقدار</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">قیمت واحد (ریال)</th>
                <th style="padding: 10px; border: 1px solid #e5e7eb; text-align: right;">قیمت کل (ریال)</th>
              </tr>
            </thead>
            <tbody>
              ${recipe.materials.map(material => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #e5e7eb;">${getMaterialName(material.materialId)}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; direction: ltr;">${material.amount} ${getUnitSymbol(material.unit)}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">${material.unitPrice.toLocaleString()}</td>
                  <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: left;">${material.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f3f4f6;">
                <td colspan="3" style="padding: 10px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">
                  جمع کل:
                </td>
                <td style="padding: 10px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">
                  ${totalCost.toLocaleString()} ریال
                </td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: left; font-size: 12px; color: #666;">
            <p>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
          </div>
        `;

        pdfContent.appendChild(recipeDiv);
      });

      await exportRecipesToPDF(pdfContent, {
        recipes,
        materials,
        units,
        product
      });

    } catch (error) {
      console.error('Error exporting recipes:', error);
      setError('خطا در خروجی گرفتن از دستور پخت‌ها');
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

    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(product =>
        filters.status === 'active' ? product.isActive : !product.isActive
      );
    }

    // Apply other filters
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
        const recipeCount = getRecipeCount(product.id);
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
  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-full">
        {filteredAndSortedProducts.map(product => (
          <div 
            key={product.id}
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm
                    border border-gray-200/50 dark:border-gray-700/50
                    hover:shadow-md transition-all duration-200
                    ${selectedProducts.includes(product.id) ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedProducts(prev => 
                      prev.includes(product.id)
                        ? prev.filter(id => id !== product.id)
                        : [...prev, product.id]
                    );
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 
                           dark:hover:text-gray-300"
                >
                  {selectedProducts.includes(product.id) ? (
                    <CheckSquare className="h-5 w-5" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    کد: {product.code}
                  </p>
                </div>
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
                  onClick={() => handleExportRecipes(product)}
                  className="p-1.5 text-green-500 hover:text-green-600 transition-colors"
                  title="دریافت PDF همه دستورات پخت"
                >
                  <FileText className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  وضعیت:
                </span>
                <button
                  onClick={() => handleProductStatus(product.id, !product.isActive)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm
                            ${product.isActive
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                >
                  {product.isActive ? (
                    <>
                      <ToggleRight className="h-4 w-4" />
                      فعال
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="h-4 w-4" />
                      غیرفعال
                    </>
                  )}
                </button>
              </div>

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
    );
  };
  const renderTableView = () => {
    return (
      <div className="w-full overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === filteredAndSortedProducts.length && filteredAndSortedProducts.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedProducts(filteredAndSortedProducts.map(p => p.id));
                    } else {
                      setSelectedProducts([]);
                    }
                  }}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نام محصول
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                کد
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                وضعیت
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                واحد فروش
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                واحد تولید
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                تعداد دستور پخت
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedProducts.map(product => (
              <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-4 py-4">
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleProductStatus(product.id, !product.isActive)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm
                              ${product.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}
                  >
                    {product.isActive ? (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        فعال
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        غیرفعال
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getDepartmentName(product.saleDepartment, 'sale')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getDepartmentName(product.productionSegment, 'production')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getRecipeCount(product.id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onProductSelect(product)}
                      className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                      title="مدیریت دستور پخت"
                    >
                      <BookOpen className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleExportRecipes(product)}
                      className="p-1.5 text-green-500 hover:text-green-600 transition-colors"
                      title="دریافت PDF همه دستورات پخت"
                    >
                      <FileText className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
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
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            لیست محصولات
          </h2>
          {/* Layout toggle buttons */}
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setLayout('grid')}
              className={`p-1.5 rounded ${
                layout === 'grid'
                  ? 'bg-white dark:bg-gray-600 text-blue-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title="نمایش شبکه‌ای"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLayout('table')}
              className={`p-1.5 rounded ${
                layout === 'table'
                  ? 'bg-white dark:bg-gray-600 text-blue-500 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title="نمایش جدولی"
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          {selectedProducts.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white 
                     rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              حذف {selectedProducts.length} محصول
            </button>
          )}
          <button
            onClick={() => setShowDefinitionForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            تعریف محصول جدید
          </button>
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        {/* Global Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجوی کلی..."
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
            value !== '' && value !== 'all') ||
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

      {/* Products List */}
      {filteredAndSortedProducts.length > 0 ? (
        layout === 'grid' ? (
          renderGridView()
        ) : (
          renderTableView()
        )
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
        itemName={`${deleteConfirm.count} محصول انتخاب شده`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, productIds: [], count: 0 })}
      />
    </div>
  );
}