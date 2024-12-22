// src/components/inventory/InventoryEntry.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Calculator, Search } from 'lucide-react';
import { Item, MaterialUnit, InventoryEntry as InventoryEntryType } from '../../types';
import { db } from '../../database';
import InventoryEntryRow from './InventoryEntryRow';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface EntryFormRow {
  materialId: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  tax: number;
  shipping: number;
  storageLocation: string;
  notes: string;
}

interface EntryFormData {
  rows: EntryFormRow[];
  seller: string;
  buyer: string;
  invoiceNumber: string;
  documentNumber: string;
}

const initialRowState: EntryFormRow = {
  materialId: '',
  quantity: 0,
  unit: '',
  unitPrice: 0,
  totalPrice: 0,
  discount: 0,
  tax: 0,
  shipping: 0,
  storageLocation: '',
  notes: ''
};

const getCurrentPersianDate = () => {
  const now = new Date();
  return new Intl.DateTimeFormat('fa-IR').format(now);
};

interface InventoryEntry {
  id: string;
  materialId: string;
  quantity: number;
  date: string;
  // Add other entry properties
}

export default function InventoryEntry() {
    const [formData, setFormData] = useState<EntryFormData>({
      rows: [{ ...initialRowState }],
      seller: '',
      buyer: '',
      invoiceNumber: '',
      documentNumber: ''
    });
    
    const [materials, setMaterials] = useState<Item[]>([]);
    const [units, setUnits] = useState<MaterialUnit[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entries, setEntries] = useState<InventoryEntry[]>([]);
  
    // Initialize real-time updates for inventory entries
    const { emitUpdate } = useRealTimeUpdates('inventory-entry-update', (data) => {
      switch (data.type) {
        case 'add':
          setEntries(prev => [...prev, data.entry]);
          break;
        case 'update':
          setEntries(prev => prev.map(entry => 
            entry.id === data.entry.id ? data.entry : entry
          ));
          break;
        case 'delete':
          setEntries(prev => prev.filter(entry => entry.id !== data.entryId));
          break;
      }
    });
  
    useEffect(() => {
      loadData();
    }, []);
  
    const loadData = () => {
      setMaterials(db.getMaterials());
      setUnits(db.getMaterialUnits());
    };
  
    const handleAddRow = () => {
      setFormData(prev => ({
        ...prev,
        rows: [...prev.rows, { ...initialRowState }]
      }));
    };
  
    const handleRemoveRow = (index: number) => {
      if (formData.rows.length > 1) {
        setFormData(prev => ({
          ...prev,
          rows: prev.rows.filter((_, i) => i !== index)
        }));
      }
    };
  
    const handleRowChange = (index: number, updates: Partial<EntryFormRow>) => {
      setFormData(prev => {
        const newRows = [...prev.rows];
        newRows[index] = {
          ...newRows[index],
          ...updates
        };
        return { ...prev, rows: newRows };
      });
    };
    const calculateTotals = () => {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;
        let totalShipping = 0;
    
        formData.rows.forEach(row => {
          subtotal += row.totalPrice;
          totalDiscount += row.discount;
          totalTax += row.tax;
          totalShipping += row.shipping;
        });
    
        const grandTotal = subtotal - totalDiscount + totalTax + totalShipping;
    
        return {
          subtotal,
          totalDiscount,
          totalTax,
          totalShipping,
          grandTotal
        };
      };
    
      const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
    
        if (formData.rows.length === 0) {
          newErrors.general = 'حداقل یک ردیف باید وجود داشته باشد';
        }
    
        if (!formData.seller.trim()) {
          newErrors.seller = 'نام فروشنده الزامی است';
        }
    
        if (!formData.buyer.trim()) {
          newErrors.buyer = 'نام خریدار الزامی است';
        }
    
        if (!formData.invoiceNumber.trim()) {
          newErrors.invoiceNumber = 'شماره فاکتور الزامی است';
        }
    
        formData.rows.forEach((row, index) => {
          if (!row.materialId) {
            newErrors[`row_${index}_material`] = 'انتخاب ماده اولیه الزامی است';
          }
          if (row.quantity <= 0) {
            newErrors[`row_${index}_quantity`] = 'میزان ورودی باید بیشتر از صفر باشد';
          }
          if (!row.unit) {
            newErrors[`row_${index}_unit`] = 'انتخاب واحد الزامی است';
          }
          if (row.unitPrice <= 0) {
            newErrors[`row_${index}_price`] = 'قیمت واحد باید بیشتر از صفر باشد';
          }
        });
    
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
      };
      const handleSubmit = async () => {
        try {
          setIsSubmitting(true);
          
          if (!validate()) {
            setIsSubmitting(false);
            return;
          }
    
          const timestamp = Date.now();
          
          // Process each row
          for (const row of formData.rows) {
            // Create entry record
            const entry: InventoryEntryType = {
              id: `entry_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
              materialId: row.materialId,
              quantity: row.quantity,
              unit: row.unit,
              unitPrice: row.unitPrice,
              totalPrice: row.totalPrice,
              discount: row.discount,
              tax: row.tax,
              shipping: row.shipping,
              storageLocation: row.storageLocation,
              notes: row.notes,
              seller: formData.seller,
              buyer: formData.buyer,
              invoiceNumber: formData.invoiceNumber,
              documentNumber: formData.documentNumber,
              createdAt: timestamp
            };
    
            // Add entry to database
            await db.addInventoryEntry(entry);
    
            // Update material stock
            const material = materials.find(m => m.id === row.materialId);
            if (material) {
              const updatedMaterial = {
                ...material,
                stock: (material.stock || 0) + row.quantity,
                lastPurchasePrice: row.unitPrice,
                lastEntryDate: timestamp
              };
              await db.updateMaterial(updatedMaterial);
            }
          }
    
          // Reset form after successful submission
          setFormData({
            rows: [{ ...initialRowState }],
            seller: '',
            buyer: '',
            invoiceNumber: '',
            documentNumber: ''
          });
    
          // Reload material data
          loadData();
    
          // Show success message or notification here if needed
          
        } catch (error) {
          console.error('Error submitting entry:', error);
          setErrors({ submit: 'خطا در ثبت ورودی' });
        } finally {
          setIsSubmitting(false);
        }
      };
      const totals = calculateTotals();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          ثبت ورودی انبار
        </h2>
        <div className="flex gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                     rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            افزودن ردیف
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white 
                     rounded-lg hover:bg-green-600 transition-colors
                     disabled:bg-green-300 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            ثبت ورودی
          </button>
        </div>
      </div>

      {/* Entry Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              فروشنده
            </label>
            <input
              type="text"
              value={formData.seller}
              onChange={(e) => setFormData(prev => ({ ...prev, seller: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.seller 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="نام فروشنده"
            />
            {errors.seller && (
              <p className="mt-1 text-sm text-red-500">{errors.seller}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              خریدار
            </label>
            <input
              type="text"
              value={formData.buyer}
              onChange={(e) => setFormData(prev => ({ ...prev, buyer: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.buyer 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="نام خریدار"
            />
            {errors.buyer && (
              <p className="mt-1 text-sm text-red-500">{errors.buyer}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              شماره فاکتور
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.invoiceNumber 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              placeholder="شماره فاکتور"
            />
            {errors.invoiceNumber && (
              <p className="mt-1 text-sm text-red-500">{errors.invoiceNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              شماره سند
            </label>
            <input
              type="text"
              value={formData.documentNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, documentNumber: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="شماره سند"
            />
          </div>
        </div>
{/* Entry Rows */}
<div className="space-y-4">
          {formData.rows.map((row, index) => (
            <InventoryEntryRow
              key={index}
              row={row}
              index={index}
              materials={materials}
              units={units}
              onChange={handleRowChange}
              onDelete={handleRemoveRow}
              errors={{
                material: errors[`row_${index}_material`],
                quantity: errors[`row_${index}_quantity`],
                unit: errors[`row_${index}_unit`],
                price: errors[`row_${index}_price`]
              }}
            />
          ))}
        </div>

        {/* Totals Section */}
        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">جمع کل:</span>
              <span className="block text-lg font-semibold">
                {totals.subtotal.toLocaleString()} ریال
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">کل تخفیف:</span>
              <span className="block text-lg font-semibold text-red-500">
                {totals.totalDiscount.toLocaleString()} ریال
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">کل مالیات:</span>
              <span className="block text-lg font-semibold">
                {totals.totalTax.toLocaleString()} ریال
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">کل باربری:</span>
              <span className="block text-lg font-semibold">
                {totals.totalShipping.toLocaleString()} ریال
              </span>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-end">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              تاریخ: {getCurrentPersianDate()}
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">مبلغ نهایی:</span>
              <span className="block text-xl font-bold text-green-500">
                {totals.grandTotal.toLocaleString()} ریال
              </span>
            </div>
          </div>
        </div>

        {/* Error Messages */}
        {errors.submit && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                       rounded-lg p-4 text-red-600 dark:text-red-400">
            {errors.submit}
          </div>
        )}

        {errors.general && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                       rounded-lg p-4 text-red-600 dark:text-red-400">
            {errors.general}
          </div>
        )}
      </div>

      {/* Additional Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-600 dark:text-blue-400">
        <ul className="list-disc list-inside space-y-1">
          <li>برای افزودن ردیف جدید از دکمه "افزودن ردیف" استفاده کنید</li>
          <li>تمامی قیمت‌ها به ریال محاسبه می‌شوند</li>
          <li>پس از ثبت، موجودی انبار به صورت خودکار به‌روزرسانی می‌شود</li>
        </ul>
      </div>
    </div>
  );
}