// src/components/production/MaterialUnitManagement.tsx

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { db } from '../../database';
import { MaterialUnit } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface UnitFormData {
  name: string;
  symbol: string;
}

export default function MaterialUnitManagement() {
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<MaterialUnit | null>(null);
  const [formData, setFormData] = useState<UnitFormData>({ name: '', symbol: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    unitId: string;
    unitName: string;
  }>({ isOpen: false, unitId: '', unitName: '' });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = () => {
    setUnits(db.getMaterialUnits());
  };

  const resetForm = () => {
    setFormData({ name: '', symbol: '' });
    setErrors({});
    setEditingUnit(null);
    setShowForm(false);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام واحد الزامی است';
    }
    if (!formData.symbol.trim()) {
      newErrors.symbol = 'نماد واحد الزامی است';
    }

    // Check for duplicates
    const isDuplicate = units.some(unit => 
      unit.id !== editingUnit?.id && (
        unit.name === formData.name.trim() || 
        unit.symbol === formData.symbol.trim()
      )
    );

    if (isDuplicate) {
      newErrors.name = 'این واحد یا نماد قبلاً ثبت شده است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (editingUnit) {
      db.updateMaterialUnit({
        ...editingUnit,
        name: formData.name.trim(),
        symbol: formData.symbol.trim()
      });
    } else {
      db.addMaterialUnit(formData.name.trim(), formData.symbol.trim());
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
      db.deleteMaterialUnit(showDeleteConfirm.unitId);
      loadUnits();
    }
    setShowDeleteConfirm({ isOpen: false, unitId: '', unitName: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          مدیریت واحدهای اندازه‌گیری
        </h2>
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
              <tr key={unit.id}>
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