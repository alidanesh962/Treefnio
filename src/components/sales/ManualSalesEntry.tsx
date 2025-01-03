import React, { useState, useEffect } from 'react';
import { ProductDefinition } from '../../types';
import { SaleEntry } from '../../types/sales';
import { ProductSelector, ShamsiDatePicker } from '../common';
import { Trash2, Plus, Calendar, AlertCircle, Loader, Package, DollarSign, CircleDollarSign } from 'lucide-react';
import { db } from '../../database';
import { ShamsiDate } from '../../utils/shamsiDate';

interface ManualSalesEntryProps {
  onSave: (entries: SaleEntry[]) => void;
  products: ProductDefinition[];
}

interface EntryWithDetails {
  id: string;
  product?: ProductDefinition;
  quantity: number;
  unitPrice: number;
  saleDepartment?: string;
  productionSegment?: string;
  materialCost?: number;
}

interface TotalSummary {
  totalQuantity: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
}

export default function ManualSalesEntry({ onSave, products }: ManualSalesEntryProps) {
  const [entries, setEntries] = useState<EntryWithDetails[]>([]);
  const [startDate, setStartDate] = useState<string>(ShamsiDate.getCurrentShamsiDate());
  const [endDate, setEndDate] = useState<string>(ShamsiDate.getCurrentShamsiDate());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
<<<<<<< HEAD
=======
  const [showHeader] = useState(true);
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f

  const getDepartmentName = (id: string, type: 'sale' | 'production'): string => {
    try {
      const department = db.getDepartmentsByType(type).find(d => d.id === id);
      return department?.name || 'نامشخص';
    } catch (err) {
      console.error(`Error getting ${type} department name:`, err);
      return 'خطا';
    }
  };

  const addEntry = () => {
    setEntries([
      ...entries,
      {
        id: Date.now().toString(),
        quantity: 0,
        unitPrice: 0,
      },
    ]);
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter((entry) => entry.id !== id));
  };

  const updateEntry = async (
    id: string,
    field: keyof EntryWithDetails,
    value: any
  ) => {
    const updatedEntries = entries.map((entry) => {
      if (entry.id !== id) return entry;

      const updatedEntry = { ...entry, [field]: value };

      // If product is updated, fetch additional details
      if (field === 'product' && value) {
        try {
          // Try to get product details from product definitions
          const productDetails = db.getProductDetails(value.id);
          const activeRecipe = db.getProductRecipes(value.id).find(r => r.isActive);
          const materialCost = activeRecipe ? db.calculateRecipeCost(activeRecipe.id) : 0;

          return {
            ...updatedEntry,
            saleDepartment: productDetails.saleDepartment,
            productionSegment: productDetails.productionSegment,
            materialCost
          };
        } catch (error) {
          // If product is from inventory, get its department ID
          const department = db.getDepartment(value.department || '');
          const departmentId = department?.id || '';
          
          return {
            ...updatedEntry,
            saleDepartment: departmentId,
            productionSegment: departmentId,
            materialCost: 0
          };
        }
      }

      return updatedEntry;
    });

    setEntries(updatedEntries);
    validateEntry(id, updatedEntries.find(e => e.id === id)!);
  };

  const validateEntry = (id: string, entry: EntryWithDetails) => {
    const errors: Record<string, string> = {};

    if (!entry.product) {
      errors[`${id}-product`] = 'محصول باید انتخاب شود';
    }
    if (entry.quantity <= 0) {
      errors[`${id}-quantity`] = 'تعداد باید بیشتر از صفر باشد';
    }
    if (entry.unitPrice <= 0) {
      errors[`${id}-price`] = 'قیمت باید بیشتر از صفر باشد';
    }

    setValidationErrors(prev => ({
      ...prev,
      ...errors
    }));

    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!startDate || !endDate) {
      setValidationErrors(prev => ({
        ...prev,
        date: 'بازه زمانی باید مشخص شود'
      }));
      return;
    }

    const isValid = entries.every(entry => validateEntry(entry.id, entry));
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const salesEntries: SaleEntry[] = entries
        .filter((entry) => entry.product)
        .map((entry) => ({
          id: entry.id,
          productId: entry.product!.id,
          product: entry.product,
          quantity: entry.quantity,
          unitPrice: entry.unitPrice,
          totalPrice: entry.quantity * entry.unitPrice,
          saleDate: startDate,
          saleDepartment: entry.saleDepartment || '',
          productionSegment: entry.productionSegment || '',
          materialCost: entry.materialCost || 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }));

      await onSave(salesEntries);
      
      // Reset form after successful save
      setEntries([]);
      setStartDate(ShamsiDate.getCurrentShamsiDate());
      setEndDate(ShamsiDate.getCurrentShamsiDate());
      setValidationErrors({});
    } catch (err) {
      setError('خطا در ذخیره اطلاعات فروش');
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = () => {
    return (
      entries.length > 0 &&
      entries.every(
        (entry) =>
          entry.product && entry.quantity > 0 && entry.unitPrice > 0
      ) &&
      startDate &&
      endDate
    );
  };

  const calculateTotals = (): TotalSummary => {
    return entries.reduce(
      (acc: TotalSummary, entry: EntryWithDetails) => {
        const totalPrice = entry.quantity * entry.unitPrice;
        const materialCost = entry.materialCost || 0;
        return {
          totalQuantity: acc.totalQuantity + entry.quantity,
          totalRevenue: acc.totalRevenue + totalPrice,
          totalCost: acc.totalCost + (materialCost * entry.quantity),
          totalProfit: acc.totalProfit + (totalPrice - (materialCost * entry.quantity))
        };
      },
      { totalQuantity: 0, totalRevenue: 0, totalCost: 0, totalProfit: 0 }
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            بازه زمانی فروش
          </h3>
          <div className="flex gap-4">
            <ShamsiDatePicker
              label="تاریخ شروع"
              value={startDate}
              onChange={setStartDate}
              error={!!validationErrors.date}
              helperText={validationErrors.date}
            />
            <ShamsiDatePicker
              label="تاریخ پایان"
              value={endDate}
              onChange={setEndDate}
              error={!!validationErrors.date}
              helperText={validationErrors.date}
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
              <Package className="h-4 w-4" />
              تعداد کل
            </div>
            <div className="text-2xl font-semibold text-blue-900 dark:text-blue-100">
              {calculateTotals().totalQuantity.toLocaleString()}
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-300 mb-2">
              <DollarSign className="h-4 w-4" />
              درآمد کل
            </div>
            <div className="text-2xl font-semibold text-green-900 dark:text-green-100">
              {calculateTotals().totalRevenue.toLocaleString()} ریال
            </div>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-300 mb-2">
              <CircleDollarSign className="h-4 w-4" />
              هزینه مواد
            </div>
            <div className="text-2xl font-semibold text-red-900 dark:text-red-100">
              {calculateTotals().totalCost.toLocaleString()} ریال
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              <CircleDollarSign className="h-4 w-4" />
              سود خالص
            </div>
            <div className="text-2xl font-semibold text-purple-900 dark:text-purple-100">
              {calculateTotals().totalProfit.toLocaleString()} ریال
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  محصول
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  بخش فروش
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  بخش تولید
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  تعداد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  قیمت واحد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  هزینه مواد
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  قیمت کل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-300 uppercase">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <ProductSelector
                        value={entry.product || null}
                        onChange={(product) =>
                          updateEntry(entry.id, 'product', product)
                        }
                        suggestedProducts={products}
                      />
                      {validationErrors[`${entry.id}-product`] && (
                        <p className="text-xs text-red-500">
                          {validationErrors[`${entry.id}-product`]}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.saleDepartment ? getDepartmentName(entry.saleDepartment, 'sale') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.productionSegment ? getDepartmentName(entry.productionSegment, 'production') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <input
                        type="number"
                        value={entry.quantity}
                        onChange={(e) =>
                          updateEntry(
                            entry.id,
                            'quantity',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="block w-24 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 text-sm"
                      />
                      {validationErrors[`${entry.id}-quantity`] && (
                        <p className="text-xs text-red-500">
                          {validationErrors[`${entry.id}-quantity`]}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <input
                        type="number"
                        value={entry.unitPrice}
                        onChange={(e) =>
                          updateEntry(
                            entry.id,
                            'unitPrice',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="block w-24 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 text-sm"
                      />
                      {validationErrors[`${entry.id}-price`] && (
                        <p className="text-xs text-red-500">
                          {validationErrors[`${entry.id}-price`]}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {entry.materialCost?.toLocaleString() || '-'} ریال
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {(entry.quantity * entry.unitPrice).toLocaleString()} ریال
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
=======
        <div className="overflow-visible">
          {showHeader && (
            <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              <div className="col-span-1"></div>
              <div className="col-span-3">محصول</div>
              <div className="col-span-2">تعداد</div>
              <div className="col-span-2">قیمت واحد (ریال)</div>
              <div className="col-span-2">هزینه مواد</div>
              <div className="col-span-2">قیمت کل (ریال)</div>
            </div>
          )}

          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-12 gap-4 items-start bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg relative">
                <div className="col-span-1 flex justify-center">
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="p-2 text-red-500 hover:text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                    title="حذف"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="col-span-3">
                  <div className="space-y-1">
                    <ProductSelector
                      value={entry.product || null}
                      onChange={(product) => updateEntry(entry.id, 'product', product)}
                      suggestedProducts={products}
                    />
                    {validationErrors[`${entry.id}-product`] && (
                      <p className="text-xs text-red-500">
                        {validationErrors[`${entry.id}-product`]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <div className="space-y-1">
                    <input
                      type="number"
                      value={entry.quantity || ''}
                      onChange={(e) => updateEntry(entry.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
                      min="0"
                      step="1"
                      placeholder="تعداد"
                      dir="ltr"
                    />
                    {validationErrors[`${entry.id}-quantity`] && (
                      <p className="text-xs text-red-500">
                        {validationErrors[`${entry.id}-quantity`]}
                      </p>
                    )}
                  </div>
                </div>

                <div className="col-span-2">
                  <input
                    type="number"
                    value={entry.unitPrice || ''}
                    onChange={(e) => updateEntry(entry.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
                    min="0"
                    step="1000"
                    placeholder="قیمت واحد"
                    dir="ltr"
                  />
                  {validationErrors[`${entry.id}-price`] && (
                    <p className="text-xs text-red-500">
                      {validationErrors[`${entry.id}-price`]}
                    </p>
                  )}
                </div>

                <div className="col-span-2">
                  <input
                    type="text"
                    value={entry.materialCost?.toLocaleString() || '-'}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
                    readOnly
                    dir="ltr"
                  />
                </div>

                <div className="col-span-2">
                  <input
                    type="text"
                    value={(entry.quantity * entry.unitPrice).toLocaleString() || ''}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
                    readOnly
                    dir="ltr"
                  />
                </div>
              </div>
            ))}
          </div>
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <button
            onClick={addEntry}
<<<<<<< HEAD
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
=======
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 
                     bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg 
                     hover:bg-gray-100 dark:hover:bg-gray-600/50 focus:outline-none focus:ring-2 
                     focus:ring-offset-2 focus:ring-blue-500 transition-colors"
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
          >
            <Plus className="h-4 w-4" />
            افزودن محصول
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !isValid()}
<<<<<<< HEAD
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
=======
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
>>>>>>> 51896f95d56e0aada20772cb05d7612324bb812f
              isLoading || !isValid()
                ? 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isLoading && <Loader className="h-4 w-4 animate-spin" />}
            {isLoading ? 'در حال ذخیره...' : 'ذخیره اطلاعات فروش'}
          </button>
        </div>
      </div>
    </div>
  );
} 