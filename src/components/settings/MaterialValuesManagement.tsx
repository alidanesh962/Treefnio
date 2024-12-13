// src/components/settings/MaterialValuesManagement.tsx
import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { db } from '../../database';

// Define the structure for material default values
interface MaterialDefaults {
  defaultDepartment: string;
  defaultStorage: string;
}

const MATERIAL_DEFAULTS_KEY = 'material_default_values';

export default function MaterialValuesManagement() {
  const [formData, setFormData] = useState<MaterialDefaults>({
    defaultDepartment: '',
    defaultStorage: ''
  });

  useEffect(() => {
    // Load saved values when component mounts
    const savedValues = localStorage.getItem(MATERIAL_DEFAULTS_KEY);
    if (savedValues) {
      setFormData(JSON.parse(savedValues));
    }
  }, []);

  const handleSave = () => {
    // Save values to localStorage
    localStorage.setItem(MATERIAL_DEFAULTS_KEY, JSON.stringify(formData));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            مقادیر پیش‌فرض مواد اولیه
          </h3>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                بخش مواد اولیه
              </label>
              <input
                type="text"
                value={formData.defaultDepartment}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  defaultDepartment: e.target.value
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="نام بخش پیش‌فرض مواد اولیه"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام انبار
              </label>
              <input
                type="text"
                value={formData.defaultStorage}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  defaultStorage: e.target.value
                }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="نام پیش‌فرض انبار"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                       rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              ذخیره تنظیمات
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}