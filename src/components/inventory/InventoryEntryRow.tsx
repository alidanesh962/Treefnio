// src/components/inventory/InventoryEntryRow.tsx

import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Search, Calculator, ChevronDown, MessageSquare } from 'lucide-react';
import { Item, MaterialUnit } from '../../types';

interface EntryRow {
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

interface InventoryEntryRowProps {
  row: EntryRow;
  index: number;
  materials: Item[];
  units: MaterialUnit[];
  onChange: (index: number, updates: Partial<EntryRow>) => void;
  onDelete: (index: number) => void;
  errors?: {
    material?: string;
    quantity?: string;
    unit?: string;
    price?: string;
  };
}

export default function InventoryEntryRow({
  row,
  index,
  materials,
  units,
  onChange,
  onDelete,
  errors = {}
}: InventoryEntryRowProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isDropdownOpen]);

  const handleQuantityChange = (value: number) => {
    const newQty = value || 0;
    const newTotal = newQty * row.unitPrice;
    onChange(index, {
      quantity: newQty,
      totalPrice: newTotal
    });
  };

  const handleUnitPriceChange = (value: number) => {
    const newPrice = value || 0;
    const newTotal = row.quantity * newPrice;
    onChange(index, {
      unitPrice: newPrice,
      totalPrice: newTotal
    });
  };

  const handleMaterialSelect = (materialId: string) => {
    const material = materials.find(m => m.id === materialId);
    if (material) {
      const updates: Partial<EntryRow> = {
        materialId,
        unit: material.unit || units[0]?.id || '',
        unitPrice: material.lastPurchasePrice || material.price || 0
      };
      onChange(index, updates);
    }
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  const filteredMaterials = materials.filter(material =>
    material.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    material.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMaterial = materials.find(m => m.id === row.materialId);

  return (
    <div className="grid grid-cols-12 gap-4 items-start p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      {/* Material Selection */}
      <div className="col-span-3 relative" ref={dropdownRef}>
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.material 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600'
          } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer
          flex items-center justify-between`}
        >
          <span className="truncate">
            {selectedMaterial ? selectedMaterial.name : 'انتخاب ماده اولیه...'}
          </span>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </div>

        {errors.material && (
          <p className="mt-1 text-sm text-red-500">{errors.material}</p>
        )}

        {isDropdownOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg 
                       border border-gray-200 dark:border-gray-700">
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                placeholder="جستجو..."
              />
            </div>

            <div className="max-h-48 overflow-y-auto">
              {filteredMaterials.map((material) => (
                <div
                  key={material.id}
                  onClick={() => handleMaterialSelect(material.id)}
                  className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                >
                  <div className="text-sm text-gray-900 dark:text-white">
                    {material.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    کد: {material.code}
                  </div>
                </div>
              ))}
              {filteredMaterials.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                  موردی یافت نشد
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quantity */}
      <div className="col-span-2">
        <input
          type="number"
          value={row.quantity || ''}
          onChange={(e) => handleQuantityChange(parseFloat(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.quantity 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600'
          } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left`}
          dir="ltr"
          min="0"
          step="0.01"
          placeholder="میزان"
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-500">{errors.quantity}</p>
        )}
      </div>

      {/* Unit */}
      <div className="col-span-1">
        <select
          value={row.unit}
          onChange={(e) => onChange(index, { unit: e.target.value })}
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.unit 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600'
          } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
        >
          <option value="">واحد</option>
          {units.map(unit => (
            <option key={unit.id} value={unit.id}>
              {unit.symbol}
            </option>
          ))}
        </select>
        {errors.unit && (
          <p className="mt-1 text-sm text-red-500">{errors.unit}</p>
        )}
      </div>

      {/* Unit Price */}
      <div className="col-span-2">
        <input
          type="number"
          value={row.unitPrice || ''}
          onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value))}
          className={`w-full px-3 py-2 rounded-lg border ${
            errors.price 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600'
          } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left`}
          dir="ltr"
          min="0"
          step="1000"
          placeholder="قیمت واحد"
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-500">{errors.price}</p>
        )}
      </div>

      {/* Total Price */}
      <div className="col-span-2">
        <input
          type="text"
          value={row.totalPrice?.toLocaleString() || ''}
          readOnly
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
          dir="ltr"
          placeholder="قیمت کل"
        />
      </div>
{/* Actions */}
<div className="col-span-2 flex gap-2">
        <button
          onClick={() => setShowNotes(!showNotes)}
          className={`p-2 rounded-lg transition-colors ${
            showNotes || row.notes
              ? 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={row.notes ? 'مشاهده جزئیات' : 'افزودن جزئیات'}
        >
          <MessageSquare className="h-5 w-5" />
        </button>
        <button
          onClick={() => onDelete(index)}
          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 
                   rounded-lg transition-colors"
          title="حذف ردیف"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      {/* Additional Details Section */}
      {showNotes && (
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تخفیف (ریال)
            </label>
            <input
              type="number"
              value={row.discount || ''}
              onChange={(e) => onChange(index, { discount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
              dir="ltr"
              min="0"
              step="1000"
              placeholder="مبلغ تخفیف"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              مالیات (ریال)
            </label>
            <input
              type="number"
              value={row.tax || ''}
              onChange={(e) => onChange(index, { tax: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
              dir="ltr"
              min="0"
              step="1000"
              placeholder="مبلغ مالیات"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              باربری (ریال)
            </label>
            <input
              type="number"
              value={row.shipping || ''}
              onChange={(e) => onChange(index, { shipping: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
              dir="ltr"
              min="0"
              step="1000"
              placeholder="هزینه باربری"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              محل نگهداری
            </label>
            <input
              type="text"
              value={row.storageLocation || ''}
              onChange={(e) => onChange(index, { storageLocation: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="محل نگهداری در انبار"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              یادداشت
            </label>
            <textarea
              value={row.notes || ''}
              onChange={(e) => onChange(index, { notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-y"
              rows={2}
              placeholder="توضیحات اضافی..."
            />
          </div>
        </div>
      )}
    </div>
  );
}