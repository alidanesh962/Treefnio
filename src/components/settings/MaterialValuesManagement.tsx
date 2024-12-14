// src/components/settings/MaterialValuesManagement.tsx
import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2 } from 'lucide-react';
import { db } from '../../database';

// Updated interface for material default values
interface MaterialDefaults {
  id: string;
  name: string;
  defaultDepartment: string;
  defaultStorage: string;
}

const MATERIAL_DEFAULTS_KEY = 'material_default_values';

export default function MaterialValuesManagement() {
  const [values, setValues] = useState<MaterialDefaults[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<Omit<MaterialDefaults, 'id'>>({
    name: '',
    defaultDepartment: '',
    defaultStorage: ''
  });

  useEffect(() => {
    loadValues();
  }, []);

  const loadValues = () => {
    const savedValues = localStorage.getItem(MATERIAL_DEFAULTS_KEY);
    if (savedValues) {
      setValues(JSON.parse(savedValues));
    }
  };

  const handleSave = () => {
    const updatedValues = [...values];
    if (editingId) {
      const index = values.findIndex(v => v.id === editingId);
      if (index !== -1) {
        updatedValues[index] = { ...values[index], ...newValue };
      }
    } else {
      updatedValues.push({
        id: Date.now().toString(),
        ...newValue
      });
    }

    localStorage.setItem(MATERIAL_DEFAULTS_KEY, JSON.stringify(updatedValues));
    setValues(updatedValues);
    resetForm();
  };

  const handleEdit = (value: MaterialDefaults) => {
    setEditingId(value.id);
    setNewValue({
      name: value.name,
      defaultDepartment: value.defaultDepartment,
      defaultStorage: value.defaultStorage
    });
  };

  const handleDelete = (id: string) => {
    const updatedValues = values.filter(v => v.id !== id);
    localStorage.setItem(MATERIAL_DEFAULTS_KEY, JSON.stringify(updatedValues));
    setValues(updatedValues);
  };

  const resetForm = () => {
    setEditingId(null);
    setNewValue({
      name: '',
      defaultDepartment: '',
      defaultStorage: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            مقادیر پیش‌فرض مواد اولیه
          </h3>

          {/* Form for new/editing values */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام مجموعه مقادیر
              </label>
              <input
                type="text"
                value={newValue.name}
                onChange={(e) => setNewValue(prev => ({
                  ...prev,
                  name: e.target.value
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="نام مجموعه مقادیر پیش‌فرض"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                بخش مواد اولیه
              </label>
              <input
                type="text"
                value={newValue.defaultDepartment}
                onChange={(e) => setNewValue(prev => ({
                  ...prev,
                  defaultDepartment: e.target.value
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="بخش پیش‌فرض"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام انبار
              </label>
              <input
                type="text"
                value={newValue.defaultStorage}
                onChange={(e) => setNewValue(prev => ({
                  ...prev,
                  defaultStorage: e.target.value
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="انبار پیش‌فرض"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                         rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Save className="h-4 w-4" />
                {editingId ? 'بروزرسانی' : 'ذخیره'}
              </button>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-800 
                           rounded-lg hover:bg-gray-300 transition-colors"
                >
                  انصراف
                </button>
              )}
            </div>
          </div>

          {/* List of existing values */}
          <div className="mt-8">
            <h4 className="text-md font-medium text-gray-800 dark:text-white mb-4">
              مقادیر موجود
            </h4>
            <div className="space-y-4">
              {values.map(value => (
                <div
                  key={value.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg
                             flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-medium text-gray-900 dark:text-white">
                      {value.name}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      بخش: {value.defaultDepartment} | انبار: {value.defaultStorage}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(value)}
                      className="p-1 text-blue-500 hover:text-blue-600"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(value.id)}
                      className="p-1 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {values.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  هیچ مقدار پیش‌فرضی تعریف نشده است
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
