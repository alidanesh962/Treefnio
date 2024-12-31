// src/components/inventory/InventoryEntry.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Calculator, Search } from 'lucide-react';
import { Item, MaterialUnit, InventoryEntry as InventoryEntryType } from '../../types';
import { db } from '../../database';
import InventoryEntryRow from './InventoryEntryRow';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';

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

interface InventoryEntryProps {
  onSuccess?: () => void;
}

export default function InventoryEntry({ onSuccess }: InventoryEntryProps) {
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
          const user = getCurrentUser();
          
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

              const unit = units.find(u => u.id === row.unit);
              if (user) {
                logUserActivity(
                  user.username,
                  user.username,
                  'create',
                  'inventory',
                  `Added ${row.quantity} ${unit?.symbol || ''} of "${material.name}" to inventory`
                );
              }
            }
          }
    
          // Reset form
          setFormData({
            rows: [{ ...initialRowState }],
            seller: '',
            buyer: '',
            invoiceNumber: '',
            documentNumber: ''
          });
          
          setIsSubmitting(false);
          if (typeof onSuccess === 'function') {
            onSuccess();
          }
        } catch (err) {
          console.error('Error submitting inventory entry:', err);
          setErrors({ submit: 'خطا در ثبت ورودی انبار' });
          setIsSubmitting(false);
        }
      };
      const totals = calculateTotals();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Form Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover-scale">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          ثبت ورودی انبار
        </h2>
        
        {/* Basic Info Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              فروشنده
            </label>
            <input
              type="text"
              value={formData.seller}
              onChange={(e) => setFormData(prev => ({ ...prev, seller: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover-scale"
            />
            {errors.seller && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.seller}</p>
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover-scale"
            />
            {errors.buyer && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.buyer}</p>
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
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover-scale"
            />
            {errors.invoiceNumber && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.invoiceNumber}</p>
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
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white hover-scale"
            />
          </div>
        </div>
      </div>

      {/* Entry Rows */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover-scale">
        <div className="space-y-4 stagger-children">
          {formData.rows.map((row, index) => (
            <div key={index} className="animate-fade-in">
              <InventoryEntryRow
                row={row}
                index={index}
                materials={materials}
                units={units}
                onChange={(index, updates) => handleRowChange(index, updates)}
                onDelete={() => handleRemoveRow(index)}
                errors={{
                  material: errors[`row_${index}_material`],
                  quantity: errors[`row_${index}_quantity`],
                  unit: errors[`row_${index}_unit`],
                  price: errors[`row_${index}_price`]
                }}
              />
            </div>
          ))}
        </div>

        <button
          onClick={handleAddRow}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 
                   dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg hover-scale"
        >
          <Plus className="h-4 w-4" />
          افزودن ردیف
        </button>
      </div>

      {/* Totals and Submit */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover-scale">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              جمع کل: {calculateTotals().grandTotal.toLocaleString()} ریال
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed hover-scale"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                در حال ثبت...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                ثبت نهایی
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg animate-fade-in">
          <ul className="list-disc list-inside space-y-1">
            {Object.entries(errors).map(([key, value]) => (
              <li key={key}>{value}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}