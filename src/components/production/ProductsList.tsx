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
  LayoutList,
  Star,
  CircleDollarSign,
  HelpCircle,
  AlertOctagon,
  FileSpreadsheet
} from 'lucide-react';
import { db } from '../../database';
import { ProductDefinition, ExtendedProductDefinition } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import ProductDefinitionForm from './ProductDefinitionForm';
import ProductImport from './ProductImport';
import BulkEditProductDialog from './BulkEditProductDialog';
import { exportRecipesToPDF } from '../../utils/newRecipePDFExport';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';
import { getCurrentJalaliTimestamp } from '../../database/dateUtils';

interface ProductsListProps {
  onProductSelect: (product: ExtendedProductDefinition) => void;
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

export default function ProductsList({ onProductSelect }: ProductsListProps) {
  // Layout and basic state
  const [layout, setLayout] = useState<'grid' | 'table'>(() => {
    return localStorage.getItem('productsListLayout') as 'grid' | 'table' || 'grid';
  });
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

  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExtendedProductDefinition | null>(null);

  // Save layout preference whenever it changes
  useEffect(() => {
    localStorage.setItem('productsListLayout', layout);
  }, [layout]);

  useEffect(() => {
    const init = async () => {
      await loadProducts();
      loadDepartments();
    };
    init();
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
          // Get the department details
          const department = db.getDepartment(invProduct.department);
          const departmentId = department?.id || '';
          
          allProducts.push({
            id: invProduct.id,
            name: invProduct.name,
            code: invProduct.code,
            saleDepartment: departmentId,
            productionSegment: departmentId,
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
      const product = products.find(p => p.id === productId);
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, isActive: status }
          : p
      ));

      const user = getCurrentUser();
      if (user && product) {
        logUserActivity(
          user.username,
          user.username,
          'edit',
          'products',
          `${status ? 'Activated' : 'Deactivated'} product "${product.name}"`
        );
      }
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
            ` : '' }
          </div>

          <table style="width: 90%; border-collapse: collapse; margin-bottom: 20px;">
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

          <div style="margin-top: 20px; text-align: right; font-size: 12px; color: #666;">
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

  const calculateRawMaterialPrice = (product: ExtendedProductDefinition): number => {
    // Get the active recipe for the product
    const activeRecipe = db.getActiveRecipe(product.id);
    if (!activeRecipe) return 0;

    // Calculate total price of all materials in the recipe
    return activeRecipe.materials.reduce((total, material) => total + material.totalPrice, 0);
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

  const getBostonCategory = (product: ExtendedProductDefinition) => {
    try {
      const salesData = db.getSalesData();
      if (!salesData || !Array.isArray(salesData) || salesData.length === 0) {
        console.log('No sales data available');
        return 'noData';
      }

      // Calculate market share and growth
      const productSales = salesData.filter(sale => sale.productId === product.id);
      if (productSales.length === 0) {
        console.log('No sales for product:', product.name);
        return 'noSales';
      }

      const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      if (totalRevenue === 0) {
        console.log('Total revenue is 0');
        return 'noRevenue';
      }

      const productRevenue = productSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const marketShare = (productRevenue / totalRevenue) * 100;

      // Split data into current and previous periods
      const midPoint = new Date(salesData[Math.floor(salesData.length / 2)].date);
      const currentPeriod = productSales.filter(sale => new Date(sale.date) >= midPoint);
      const previousPeriod = productSales.filter(sale => new Date(sale.date) < midPoint);

      const currentSales = currentPeriod.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
      const previousSales = previousPeriod.reduce((sum, sale) => sum + (sale.quantity || 0), 0);

      const growthRate = previousSales ? ((currentSales - previousSales) / previousSales) * 100 : 0;

      if (marketShare >= 25 && growthRate >= 10) return 'star';
      if (marketShare >= 25 && growthRate < 10) return 'cashCow';
      if (marketShare < 25 && growthRate >= 10) return 'questionMark';
      return 'dog';
    } catch (error) {
      console.error('Error calculating Boston category:', error);
      return 'error';
    }
  };

  const getBostonIcon = (category: string | null) => {
    const renderIcon = (Icon: any, color: string, label: string, tooltip: string) => (
      <div className="group relative inline-block">
        <Icon 
          className={`h-5 w-5 ${color}`}
          aria-label={label}
        />
        <div className="invisible group-hover:visible absolute z-10 w-48 px-2 py-1 -mt-1 text-sm text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 -translate-y-full left-1/2 -translate-x-1/2">
          {tooltip}
        </div>
      </div>
    );

    switch (category) {
      case 'star':
        return renderIcon(
          Star,
          'text-orange-500',
          'ستاره',
          'ستاره: سهم بازار بالا، رشد بالا'
        );
      case 'cashCow':
        return renderIcon(
          CircleDollarSign,
          'text-green-500',
          'گاو شیرده',
          'گاو شیرده: سهم بازار بالا، رشد پایین'
        );
      case 'questionMark':
        return renderIcon(
          HelpCircle,
          'text-purple-500',
          'علامت سؤال',
          'علامت سؤال: سهم بازار پایین، رشد بالا'
        );
      case 'dog':
        return renderIcon(
          AlertOctagon,
          'text-red-500',
          'سگ',
          'سگ: سهم بازار پایین، رشد پایین'
        );
      case 'noData':
        return renderIcon(
          AlertCircle,
          'text-gray-400',
          'بدون داده',
          'داده‌های فروش موجود نیست'
        );
      case 'noSales':
        return renderIcon(
          AlertCircle,
          'text-gray-400',
          'بدون فروش',
          'فروشی برای این محصول ثبت نشده است'
        );
      case 'noRevenue':
        return renderIcon(
          AlertCircle,
          'text-gray-400',
          'بدون درآمد',
          'درآمد کل صفر است'
        );
      case 'error':
        return renderIcon(
          AlertCircle,
          'text-gray-400',
          'خطا',
          'خطا در محاسبه وضعیت بوستون'
        );
      default:
        return renderIcon(
          AlertCircle,
          'text-gray-400',
          'نامشخص',
          'وضعیت نامشخص'
        );
    }
  };

  // Add this new function for handling row selection
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

  // Update the handleSelectAll function
  const handleSelectAll = () => {
    if (selectedProducts.length === filteredAndSortedProducts.length) {
      setSelectedProducts([]);
    } else {
      const allIds = filteredAndSortedProducts.map(product => product.id);
      setSelectedProducts(allIds);
    }
  };

  const handleImportSuccess = () => {
    loadProducts();
    setShowImportDialog(false);
  };

  const handleBulkEdit = async (changes: Partial<ExtendedProductDefinition>) => {
    const user = getCurrentUser();
    if (editingProduct) {
      console.log('Starting edit with changes:', changes);
      console.log('Current editing product:', editingProduct);

      // Validate name and code if they are being changed
      if (changes.name && changes.name.trim() === '') {
        setError('نام محصول نمی‌تواند خالی باشد');
        return;
      }

      if (changes.code && changes.code.trim() === '') {
        setError('کد محصول نمی‌تواند خالی باشد');
        return;
      }

      // Check for duplicate code if code is being changed
      if (changes.code && changes.code !== editingProduct.code) {
        const existingProduct = products.find(p => 
          p.code === changes.code && p.id !== editingProduct.id
        );
        if (existingProduct) {
          setError('این کد محصول قبلاً استفاده شده است');
          return;
        }
      }

      try {
        // Create updated product with all current values
        const updatedProduct: ProductDefinition = {
          id: editingProduct.id,
          name: changes.name ?? editingProduct.name,
          code: changes.code ?? editingProduct.code,
          saleDepartment: changes.saleDepartment ?? editingProduct.saleDepartment ?? '',
          productionSegment: changes.productionSegment ?? editingProduct.productionSegment ?? '',
          createdAt: editingProduct.createdAt,
          updatedAt: getCurrentJalaliTimestamp(),
          isActive: changes.isActive ?? editingProduct.isActive ?? true
        };

        console.log('Attempting to update product with:', updatedProduct);
        
        // First update the product definition
        const updateSuccess = db.updateProductDefinition(updatedProduct);
        console.log('Update result:', updateSuccess);
        
        if (!updateSuccess) {
          throw new Error('Failed to update product definition');
        }

        // Update local state immediately
        setProducts(prevProducts => 
          prevProducts.map(p => 
            p.id === editingProduct.id 
              ? { ...p, ...updatedProduct }
              : p
          )
        );

        // Reload products to ensure we have the latest state
        await loadProducts();
        
        // Log the changes
        if (user) {
          const changesDescription = Object.entries(changes)
            .map(([key, value]) => {
              switch(key) {
                case 'name':
                  return `name from "${editingProduct.name}" to "${value}"`;
                case 'code':
                  return `code from "${editingProduct.code}" to "${value}"`;
                case 'isActive':
                  return `status to "${value ? 'active' : 'inactive'}"`;
                case 'saleDepartment':
                  return `sale department to "${getDepartmentName(value as string, 'sale')}"`;
                case 'productionSegment':
                  return `production department to "${getDepartmentName(value as string, 'production')}"`;
                default:
                  return `${key} to "${value}"`;
              }
            })
            .join(', ');

          logUserActivity(
            user.username,
            user.username,
            'edit',
            'products',
            `Updated product "${editingProduct.name}": ${changesDescription}`
          );
        }
        
        setShowBulkEdit(false);
        setEditingProduct(null);
        setError(null);
      } catch (err) {
        console.error('Detailed error:', err);
        setError('خطا در بروزرسانی محصول');
      }
    }
  };

  const renderGridView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-full">
        {filteredAndSortedProducts.map(product => (
          <div 
            key={product.id}
            className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm
                    border border-gray-200/50 dark:border-gray-700/50
                    hover:shadow-md transition-all duration-200 cursor-pointer
                    ${selectedProducts.includes(product.id) ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => handleRowClick(product)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedProducts.includes(product.id)) {
                      setSelectedProducts(prev => prev.filter(id => id !== product.id));
                    } else {
                      setSelectedProducts(prev => [...prev, product.id]);
                    }
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                    {getBostonIcon(getBostonCategory(product))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    کد: {product.code}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProduct(product);
                    setShowBulkEdit(true);
                  }}
                  className="p-1.5 text-gray-500 hover:text-gray-600 transition-colors"
                  title="ویرایش محصول"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
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

              {/* Updated department select styles (grid view) */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  واحد فروش:
                </span>
                <select
                  value={product.saleDepartment}
                  onChange={(e) => {
                    const updatedProduct = {
                      ...product,
                      saleDepartment: e.target.value
                    };
                    // Update in database
                    db.updateProductDefinition(updatedProduct);
                    // Update in local state
                    setProducts(prev => prev.map(p =>
                      p.id === product.id ? updatedProduct : p
                    ));
                    const user = getCurrentUser();
                    if (user) {
                      const newDeptName = getDepartmentName(e.target.value, 'sale');
                      logUserActivity(
                        user.username,
                        user.username,
                        'edit',
                        'products',
                        `Updated sale department of product "${product.name}" to "${newDeptName}"`
                      );
                    }
                  }}
                  className="text-sm font-medium bg-gray-50 dark:bg-gray-700 text-gray-900 
                             dark:text-white border-none focus:ring-0 rounded-lg
                             [&>option]:bg-white [&>option]:dark:bg-gray-800
                             [&>option]:text-gray-900 [&>option]:dark:text-white"
                >
                  {saleDepartments.map(dept => {
                    const department = db.getDepartment(dept);
                    return department ? (
                      <option key={dept} value={dept}>
                        {department.name}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  واحد تولید:
                </span>
                <select
                  value={product.productionSegment}
                  onChange={(e) => {
                    const updatedProduct = {
                      ...product,
                      productionSegment: e.target.value
                    };
                    // Update in database
                    db.updateProductDefinition(updatedProduct);
                    // Update in local state
                    setProducts(prev => prev.map(p =>
                      p.id === product.id ? updatedProduct : p
                    ));
                    const user = getCurrentUser();
                    if (user) {
                      const newDeptName = getDepartmentName(e.target.value, 'production');
                      logUserActivity(
                        user.username,
                        user.username,
                        'edit',
                        'products',
                        `Updated production department of product "${product.name}" to "${newDeptName}"`
                      );
                    }
                  }}
                  className="text-sm font-medium bg-gray-50 dark:bg-gray-700 text-gray-900 
                             dark:text-white border-none focus:ring-0 rounded-lg
                             [&>option]:bg-white [&>option]:dark:bg-gray-800
                             [&>option]:text-gray-900 [&>option]:dark:text-white"
                >
                  {productionDepartments.map(dept => {
                    const department = db.getDepartment(dept);
                    return department ? (
                      <option key={dept} value={dept}>
                        {department.name}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  تعداد دستور پخت:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getRecipeCount(product.id)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  قیمت خام:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {calculateRawMaterialPrice(product).toLocaleString()} ریال
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
                  checked={filteredAndSortedProducts.length > 0 && selectedProducts.length === filteredAndSortedProducts.length}
                  onChange={handleSelectAll}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نام محصول
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                تحلیل بوستون
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
                قیمت خام (ریال)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedProducts.map((product) => (
              <tr 
                key={product.id} 
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                  selectedProducts.includes(product.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
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
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex justify-center">
                    {getBostonIcon(getBostonCategory(product))}
                  </div>
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

                {/* Updated department select styles (table view) */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <select
                    value={product.saleDepartment}
                    onChange={(e) => {
                      const updatedProduct = {
                        ...product,
                        saleDepartment: e.target.value
                      };
                      // Update in database
                      db.updateProductDefinition(updatedProduct);
                      // Update in local state
                      setProducts(prev => prev.map(p =>
                        p.id === product.id ? updatedProduct : p
                      ));
                      const user = getCurrentUser();
                      if (user) {
                        const newDeptName = getDepartmentName(e.target.value, 'sale');
                        logUserActivity(
                          user.username,
                          user.username,
                          'edit',
                          'products',
                          `Updated sale department of product "${product.name}" to "${newDeptName}"`
                        );
                      }
                    }}
                    className="bg-gray-50 dark:bg-gray-700 border-none focus:ring-0 
                               text-gray-900 dark:text-white rounded-lg
                               [&>option]:bg-white [&>option]:dark:bg-gray-800
                               [&>option]:text-gray-900 [&>option]:dark:text-white"
                  >
                    {saleDepartments.map(dept => {
                      const department = db.getDepartment(dept);
                      return department ? (
                        <option key={dept} value={dept}>
                          {department.name}
                        </option>
                      ) : null;
                    })}
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <select
                    value={product.productionSegment}
                    onChange={(e) => {
                      const updatedProduct = {
                        ...product,
                        productionSegment: e.target.value
                      };
                      // Update in database
                      db.updateProductDefinition(updatedProduct);
                      // Update in local state
                      setProducts(prev => prev.map(p =>
                        p.id === product.id ? updatedProduct : p
                      ));
                      const user = getCurrentUser();
                      if (user) {
                        const newDeptName = getDepartmentName(e.target.value, 'production');
                        logUserActivity(
                          user.username,
                          user.username,
                          'edit',
                          'products',
                          `Updated production department of product "${product.name}" to "${newDeptName}"`
                        );
                      }
                    }}
                    className="bg-gray-50 dark:bg-gray-700 border-none focus:ring-0 
                               text-gray-900 dark:text-white rounded-lg
                               [&>option]:bg-white [&>option]:dark:bg-gray-800
                               [&>option]:text-gray-900 [&>option]:dark:text-white"
                  >
                    {productionDepartments.map(dept => {
                      const department = db.getDepartment(dept);
                      return department ? (
                        <option key={dept} value={dept}>
                          {department.name}
                        </option>
                      ) : null;
                    })}
                  </select>
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getRecipeCount(product.id)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {calculateRawMaterialPrice(product).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingProduct(product);
                        setShowBulkEdit(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-gray-600 transition-colors"
                      title="ویرایش محصول"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
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
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white 
                   rounded-lg hover:bg-green-600 transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" />
            ورود گروهی
          </button>
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

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Basic Information Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام محصول
              </label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="نام محصول را وارد کنید"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد محصول
              </label>
              <input
                type="text"
                value={filters.code}
                onChange={(e) => setFilters(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="کد محصول را وارد کنید"
              />
            </div>

            {/* Department Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                واحد فروش
              </label>
              <select
                value={filters.saleDepartment}
                onChange={(e) => setFilters(prev => ({ ...prev, saleDepartment: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">همه واحدهای فروش</option>
                {saleDepartments.map((deptId) => {
                  const dept = db.getDepartment(deptId);
                  return dept ? (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                واحد تولید
              </label>
              <select
                value={filters.productionSegment}
                onChange={(e) => setFilters(prev => ({ ...prev, productionSegment: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">همه واحدهای تولید</option>
                {productionDepartments.map((deptId) => {
                  const dept = db.getDepartment(deptId);
                  return dept ? (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ) : null;
                })}
              </select>
            </div>

            {/* Recipe and Status Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                دستور پخت
              </label>
              <select
                value={filters.hasRecipe}
                onChange={(e) => setFilters(prev => ({
                  ...prev, 
                  hasRecipe: e.target.value as 'all' | 'yes' | 'no'
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه</option>
                <option value="yes">دارای دستور پخت</option>
                <option value="no">بدون دستور پخت</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                وضعیت
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({
                  ...prev, 
                  status: e.target.value as 'all' | 'active' | 'inactive'
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">همه</option>
                <option value="active">فعال</option>
                <option value="inactive">غیرفعال</option>
              </select>
            </div>

            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                از تاریخ
              </label>
              <input
                type="date"
                value={filters.createdDateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, createdDateFrom: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تا تاریخ
              </label>
              <input
                type="date"
                value={filters.createdDateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, createdDateTo: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

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

      {showImportDialog && (
        <ProductImport
          onClose={() => setShowImportDialog(false)}
          onSuccess={handleImportSuccess}
        />
      )}

      {showBulkEdit && (
        <BulkEditProductDialog
          isOpen={showBulkEdit}
          onClose={() => {
            setShowBulkEdit(false);
            setEditingProduct(null);
          }}
          onConfirm={handleBulkEdit}
          selectedCount={editingProduct ? 1 : selectedProducts.length}
          departments={db.getDepartmentsByType('sale')}
          productionSegments={db.getDepartmentsByType('production')}
          editingProduct={editingProduct}
        />
      )}

      {/* Error Message Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
