// src/components/production/MaterialRow.tsx

import React from 'react';
import { Trash2 } from 'lucide-react';
import { Item, MaterialUnit, RecipeMaterial } from '../../types';

interface MaterialRowProps {
  material: RecipeMaterial;
  index: number;
  materials: Item[];
  units: MaterialUnit[];
  onChange: (index: number, updates: Partial<RecipeMaterial>) => void;
  onDelete: (index: number) => void;
  error?: string;
  showHeader?: boolean;
}

const MaterialRow: React.FC<MaterialRowProps> = ({
  material,
  index,
  materials,
  units,
  onChange,
  onDelete,
  error,
  showHeader = false
}) => {
  const handleQuantityChange = (value: number) => {
    const selectedMaterial = materials.find(m => m.id === material.materialId);
    if (selectedMaterial) {
      const totalPrice = value * selectedMaterial.price;
      onChange(index, {
        amount: value,
        unitPrice: selectedMaterial.price,
        totalPrice: totalPrice
      });
    } else {
      onChange(index, {
        amount: value,
        totalPrice: value * material.unitPrice
      });
    }
  };

  const handleMaterialChange = (materialId: string) => {
    const selectedMaterial = materials.find(m => m.id === materialId);
    if (selectedMaterial) {
      const totalPrice = material.amount * selectedMaterial.price;
      onChange(index, {
        materialId,
        unitPrice: selectedMaterial.price,
        totalPrice: totalPrice
      });
    }
  };

  return (
    <div>
      {showHeader && (
        <div className="grid grid-cols-12 gap-4 mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          <div className="col-span-1"></div>
          <div className="col-span-3">نام ماده اولیه</div>
          <div className="col-span-2">مقدار</div>
          <div className="col-span-2">واحد</div>
          <div className="col-span-2">قیمت واحد (ریال)</div>
          <div className="col-span-2">قیمت کل (ریال)</div>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4 items-start bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        {/* Delete Button */}
        <div className="col-span-1 flex justify-center">
          <button
            onClick={() => onDelete(index)}
            className="p-2 text-red-500 hover:text-red-600 transition-colors
                     hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            title="حذف"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        {/* Material Selection */}
        <div className="col-span-3">
          <select
            value={material.materialId}
            onChange={(e) => handleMaterialChange(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">انتخاب ماده اولیه...</option>
            {materials.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* Amount Input */}
        <div className="col-span-2">
          <input
            type="number"
            value={material.amount || ''}
            onChange={(e) => handleQuantityChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-left"
            min="0"
            step="0.01"
            placeholder="مقدار"
            dir="ltr"
          />
        </div>

        {/* Unit Selection */}
        <div className="col-span-2">
          <select
            value={material.unit}
            onChange={(e) => onChange(index, { unit: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name} ({unit.symbol})
              </option>
            ))}
          </select>
        </div>

        {/* Unit Price Display */}
        <div className="col-span-2">
          <input
            type="text"
            value={material.unitPrice.toLocaleString()}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
            readOnly
            dir="ltr"
          />
        </div>

        {/* Total Price Display */}
        <div className="col-span-2">
          <input
            type="text"
            value={material.totalPrice.toLocaleString()}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white text-left"
            readOnly
            dir="ltr"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 text-sm text-red-500">
          {error}
        </div>
      )}
    </div>
  );
};

export default MaterialRow;