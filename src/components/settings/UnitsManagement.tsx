import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { db } from '../../database';
import { MaterialUnit } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface FormErrors {
  name?: string;
  symbol?: string;
  similar?: string;
}

export default function UnitsManagement() {
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MaterialUnit | null>(null);
  const [formData, setFormData] = useState({ name: '', symbol: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    unitId: string;
    unitName: string;
  }>({ isOpen: false, unitId: '', unitName: '' });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = () => {
    const loadedUnits = db.getMaterialUnits();
    // Sort units alphabetically by name
    const sortedUnits = [...loadedUnits].sort((a, b) => 
      a.name.localeCompare(b.name, 'fa')
    );
    setUnits(sortedUnits);
  };

  const resetForm = () => {
    setFormData({ name: '', symbol: '' });
    setErrors({});
    setEditingUnit(null);
    setShowForm(false);
  };

  const normalizeText = (text: string): string => {
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/‌/g, '') // Remove ZWNJ
      .replace(/ي/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/ة/g, 'ه');
  };

  const validateUnit = (name: string, symbol: string): boolean => {
    const newErrors: FormErrors = {};
    
    // Normalize inputs
    const normalizedName = normalizeText(name);
    const normalizedSymbol = normalizeText(symbol);

    // Basic validation
    if (!normalizedName) {
      newErrors.name = 'نام واحد الزامی است';
    }
    if (!normalizedSymbol) {
      newErrors.symbol = 'نماد واحد الزامی است';
    }

    // Length validation
    if (normalizedName.length < 2) {
      newErrors.name = 'نام واحد باید حداقل ۲ حرف باشد';
    }
    if (normalizedSymbol.length < 1) {
      newErrors.symbol = 'نماد واحد باید حداقل ۱ حرف باشد';
    }

    // Check for exact duplicates
    const hasDuplicate = units.some(unit => {
      if (unit.id === editingUnit?.id) return false;
      
      const existingNormalizedName = normalizeText(unit.name);
      const existingNormalizedSymbol = normalizeText(unit.symbol);
      
      return existingNormalizedName === normalizedName || 
             existingNormalizedSymbol === normalizedSymbol;
    });

    if (hasDuplicate) {
      newErrors.name = 'این واحد یا نماد قبلاً ثبت شده است';
    }

    // Check for similar units
    const similarUnits = units.filter(unit => {
      if (unit.id === editingUnit?.id) return false;
      
      const existingNormalizedName = normalizeText(unit.name);
      return (
        existingNormalizedName.includes(normalizedName) ||
        normalizedName.includes(existingNormalizedName)
      );
    });

    if (similarUnits.length > 0) {
      newErrors.similar = `واحدهای مشابه: ${similarUnits.map(u => u.name).join('، ')}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    const trimmedName = formData.name.trim();
    const trimmedSymbol = formData.symbol.trim();

    if (!validateUnit(trimmedName, trimmedSymbol)) return;

    if (editingUnit) {
      db.updateMaterialUnit({
        ...editingUnit,
        name: trimmedName,
        symbol: trimmedSymbol
      });
    } else {
      db.addMaterialUnit(trimmedName, trimmedSymbol);
    }

    loadUnits();
    resetForm();
  };

  const handleEdit = (unit: MaterialUnit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      symbol: unit.symbol
    });
    setShowForm(true);
  };

  const handleDelete = () => {
    if (showDeleteConfirm.unitId) {
      // Check if unit is in use
      if (db.isMaterialUnitInUse(showDeleteConfirm.unitId)) {
        alert('این واحد در حال استفاده است و نمی‌توان آن را حذف کرد');
        setShowDeleteConfirm({ isOpen: false, unitId: '', unitName: '' });
        return;
      }

      db.deleteMaterialUnit(showDeleteConfirm.unitId);
      loadUnits();
    }
    setShowDeleteConfirm({ isOpen: false, unitId: '', unitName: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            واحدهای اندازه‌گیری
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {`${units.length} واحد تعریف شده`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن واحد جدید
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام واحد
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="مثال: کیلوگرم"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
              {errors.similar && (
                <p className="mt-1 text-sm text-orange-500">{errors.similar}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نماد
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.symbol 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                placeholder="مثال: kg"
              />
              {errors.symbol && (
                <p className="mt-1 text-sm text-red-500">{errors.symbol}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                       rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              {editingUnit ? 'بروزرسانی' : 'ذخیره'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 
                       rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X className="h-4 w-4" />
              انصراف
            </button>
          </div>
        </div>
      )}

      {/* Units List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نام واحد
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                نماد
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {units.map(unit => (
              <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {unit.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {unit.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(unit)}
                      className="p-1 text-blue-500 hover:text-blue-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({
                        isOpen: true,
                        unitId: unit.id,
                        unitName: unit.name
                      })}
                      className="p-1 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        itemName={showDeleteConfirm.unitName}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, unitId: '', unitName: '' })}
      />
    </div>
  );
}