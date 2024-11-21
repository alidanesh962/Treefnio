// src/components/inventory/MaterialEditRow.tsx
import React, { useState, useEffect } from 'react';
import { Edit2, X, Check } from 'lucide-react';
import type { MaterialUnit } from '../../types';

export interface PreviewMaterial {
  name: string;
  code: string;
  department: string;
  price: number;
  unit: string;
  isSelected: boolean;
  hasError?: boolean;
  errorMessage?: string;
}

interface MaterialEditRowProps {
  material: PreviewMaterial;
  index: number;
  units: MaterialUnit[];
  isEditing: boolean;
  onEdit: (index: number) => void;
  onSave: (index: number, updatedMaterial: PreviewMaterial) => void;
  onCancel: (index: number) => void;
  onToggleSelect: (index: number, checked: boolean) => void;
}

const MaterialEditRow: React.FC<MaterialEditRowProps> = ({
  material,
  index,
  units,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onToggleSelect
}) => {
  const [editedValues, setEditedValues] = useState<PreviewMaterial>({
    name: material.name,
    code: material.code,
    department: material.department,
    price: material.price,
    unit: material.unit,
    isSelected: material.isSelected
  });

  useEffect(() => {
    setEditedValues({
      name: material.name,
      code: material.code,
      department: material.department,
      price: material.price,
      unit: material.unit,
      isSelected: material.isSelected
    });
  }, [material]);

  const handleSave = () => {
    onSave(index, editedValues);
  };

  const handleCancel = () => {
    setEditedValues({
      name: material.name,
      code: material.code,
      department: material.department,
      price: material.price,
      unit: material.unit,
      isSelected: material.isSelected
    });
    onCancel(index);
  };

  const getUnitDisplay = (unitId: string): string => {
    const unit = units.find(u => u.id === unitId);
    return unit ? `${unit.name} (${unit.symbol})` : '-';
  };

  if (!isEditing) {
    return (
      <tr className={material.hasError ? 'bg-red-50 dark:bg-red-900/20' : ''}>
        <td className="p-4">
          <input
            type="checkbox"
            checked={material.isSelected}
            onChange={(e) => onToggleSelect(index, e.target.checked)}
            disabled={material.hasError}
            className="rounded text-blue-500 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {material.name}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {material.code}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {material.department}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {getUnitDisplay(material.unit)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {material.price.toLocaleString()}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <div className="flex items-center gap-2">
            {material.hasError ? (
              <span 
                className="text-red-500 hover:text-red-600 cursor-help" 
                title={material.errorMessage}
              >
                خطا در اطلاعات
              </span>
            ) : (
              <>
                <span className="text-green-500">آماده برای ثبت</span>
                <button
                  onClick={() => onEdit(index)}
                  className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50 dark:bg-blue-900/20">
      <td className="p-4">
        <input
          type="checkbox"
          checked={material.isSelected}
          onChange={(e) => onToggleSelect(index, e.target.checked)}
          disabled={material.hasError}
          className="rounded text-blue-500 focus:ring-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedValues.name}
          onChange={(e) => setEditedValues(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          placeholder="نام کالا"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedValues.code}
          onChange={(e) => setEditedValues(prev => ({ ...prev, code: e.target.value }))}
          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          placeholder="کد کالا"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="text"
          value={editedValues.department}
          onChange={(e) => setEditedValues(prev => ({ ...prev, department: e.target.value }))}
          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          placeholder="بخش"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 
                     bg-gray-100 dark:bg-gray-600 text-sm text-gray-900 dark:text-white">
          {getUnitDisplay(material.unit)}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="number"
          value={editedValues.price}
          onChange={(e) => setEditedValues(prev => ({ 
            ...prev, 
            price: parseFloat(e.target.value) || 0 
          }))}
          className="w-full px-2 py-1 rounded border border-gray-300 dark:border-gray-600 
                   bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
          min="0"
          step="1000"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="p-1 text-green-500 hover:text-green-600 transition-colors"
            title="ذخیره تغییرات"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 text-red-500 hover:text-red-600 transition-colors"
            title="لغو تغییرات"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default MaterialEditRow;