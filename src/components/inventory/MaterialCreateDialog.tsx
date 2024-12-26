// src/components/inventory/MaterialCreateDialog.tsx
import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { db } from '../../database';
import { MaterialUnit } from '../../types';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

// **New import** for fetching default values:
import { getMaterialDefaults } from '../../utils/materialDefaults';

// Step 1: Add interface for material defaults
interface MaterialDefault {
  id: string;
  name: string;
  defaultDepartment: string;
  defaultStorage: string;
}

interface MaterialCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MaterialCreateDialog({
  isOpen,
  onClose,
  onSuccess
}: MaterialCreateDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    price: 0,
    stock: 0,
    minStock: 0,
    location: '',
    unit: '',
    expiryDate: ''
  });
  
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUnitForm, setShowUnitForm] = useState(false);
  const [newUnitData, setNewUnitData] = useState({ name: '', symbol: '' });

  // Step 2: Type the materialDefaults state properly
  const [materialDefaults, setMaterialDefaults] = useState<MaterialDefault[]>(getMaterialDefaults());

  // Add real-time update hook
  const { emitUpdate } = useRealTimeUpdates('unit-update', (data) => {
    switch (data.type) {
      case 'add':
        setUnits(prev => [...prev, data.unit]);
        break;
      case 'update':
        setUnits(prev => prev.map(unit => 
          unit.id === data.unit.id ? data.unit : unit
        ));
        break;
      case 'delete':
        setUnits(prev => prev.filter(unit => unit.id !== data.unitId));
        break;
    }
  });

  useEffect(() => {
    loadUnits();
  }, []);

  const loadUnits = () => {
    setUnits(db.getMaterialUnits());
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام ماده اولیه الزامی است';
    }
    if (!formData.code.trim()) {
      newErrors.code = 'کد ماده اولیه الزامی است';
    }
    if (!formData.department.trim()) {
      newErrors.department = 'بخش الزامی است';
    }
    if (formData.price < 0) {
      newErrors.price = 'قیمت نمی‌تواند منفی باشد';
    }
    if (formData.stock < 0) {
      newErrors.stock = 'موجودی نمی‌تواند منفی باشد';
    }
    if (formData.minStock < 0) {
      newErrors.minStock = 'حداقل موجودی نمی‌تواند منفی باشد';
    }
    if (!formData.unit) {
      newErrors.unit = 'واحد اندازه‌گیری الزامی است';
    }

    // Check for duplicates
    const existingMaterial = db.getMaterials().find(m => 
      m.code.toLowerCase() === formData.code.toLowerCase() || 
      m.name.toLowerCase() === formData.name.toLowerCase()
    );

    if (existingMaterial) {
      newErrors.code = 'این کد یا نام قبلاً ثبت شده است';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      if (!validate()) {
        return;
      }

      const expiryTimestamp = formData.expiryDate ? new Date(formData.expiryDate).getTime() : undefined;

      const materialData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        department: formData.department.trim(),
        price: formData.price,
        stock: formData.stock,
        minStock: formData.minStock,
        location: formData.location.trim(),
        unit: formData.unit,
        expiryDate: expiryTimestamp,
        type: 'material' as const
      };

      db.addMaterial(materialData);
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error('Error adding material:', error);
      setErrors({ submit: 'خطا در ثبت ماده اولیه' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewUnit = () => {
    const trimmedName = newUnitData.name.trim();
    const trimmedSymbol = newUnitData.symbol.trim();

    if (!trimmedName || !trimmedSymbol) {
      setErrors(prev => ({
        ...prev,
        newUnit: 'نام و نماد واحد الزامی است'
      }));
      return;
    }

    // Check for duplicates
    const isDuplicate = units.some(unit => 
      unit.name.toLowerCase() === trimmedName.toLowerCase() || 
      unit.symbol.toLowerCase() === trimmedSymbol.toLowerCase()
    );

    if (isDuplicate) {
      setErrors(prev => ({
        ...prev,
        newUnit: 'این واحد یا نماد قبلاً ثبت شده است'
      }));
      return;
    }

    const newUnit = db.addMaterialUnit(trimmedName, trimmedSymbol);
    
    // Emit update for real-time sync
    emitUpdate({
      type: 'add',
      unit: newUnit
    });

    // Update local state
    setUnits(prev => [...prev, newUnit]);
    
    // Reset form
    setNewUnitData({ name: '', symbol: '' });
    setShowUnitForm(false);
    setErrors(prev => {
      const { newUnit, ...rest } = prev;
      return rest;
    });
    
    // Set the new unit as selected
    setFormData(prev => ({ ...prev, unit: newUnit.id }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            افزودن ماده اولیه جدید
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Default Values Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
             مجموعه 
            </label>
            {/* Step 3: Update the select element's onChange handler with proper types */}
            <select
              onChange={(e) => {
                const selected = materialDefaults.find((d: MaterialDefault) => d.id === e.target.value);
                if (selected) {
                  setFormData(prev => ({
                    ...prev,
                    department: selected.defaultDepartment,
                    location: selected.defaultStorage
                  }));
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">انتخاب مقادیر پیش‌فرض...</option>
              {materialDefaults.map((def: MaterialDefault) => (
                <option key={def.id} value={def.id}>{def.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نام ماده اولیه
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
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              کد ماده اولیه
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.code 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {errors.code && (
              <p className="mt-1 text-sm text-red-500">{errors.code}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              گروه مواد غذایی
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.department 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
            />
            {errors.department && (
              <p className="mt-1 text-sm text-red-500">{errors.department}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              واحد اندازه‌گیری
            </label>
            <div className="flex gap-2">
              <select
                value={formData.unit}
                onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                className={`flex-1 px-3 py-2 rounded-lg border ${
                  errors.unit 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">انتخاب واحد...</option>
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name} ({unit.symbol})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowUnitForm(true)}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                +
              </button>
            </div>
            {errors.unit && (
              <p className="mt-1 text-sm text-red-500">{errors.unit}</p>
            )}
          </div>

          {/* New Unit Form */}
          {showUnitForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    افزودن واحد جدید
                  </h3>
                  <button
                    onClick={() => setShowUnitForm(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      نام واحد
                    </label>
                    <input
                      type="text"
                      value={newUnitData.name}
                      onChange={(e) => setNewUnitData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="مثال: کیلوگرم"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      نماد
                    </label>
                    <input
                      type="text"
                      value={newUnitData.symbol}
                      onChange={(e) => setNewUnitData(prev => ({ ...prev, symbol: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                               bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="مثال: kg"
                    />
                  </div>

                  {errors.newUnit && (
                    <p className="text-sm text-red-500">{errors.newUnit}</p>
                  )}

                  <div className="flex justify-end gap-4 mt-4">
                    <button
                      onClick={handleAddNewUnit}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                               transition-colors"
                    >
                      افزودن
                    </button>
                    <button
                      onClick={() => setShowUnitForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 
                               transition-colors"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              موجودی
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.stock 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              min="0"
            />
            {errors.stock && (
              <p className="mt-1 text-sm text-red-500">{errors.stock}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              حداقل موجودی
            </label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.minStock 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              min="0"
            />
            {errors.minStock && (
              <p className="mt-1 text-sm text-red-500">{errors.minStock}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              قیمت (ریال)
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              className={`w-full px-3 py-2 rounded-lg border ${
                errors.price 
                  ? 'border-red-300 dark:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600'
              } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              min="0"
              step="1000"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-500">{errors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              محل نگهداری
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              تاریخ انقضا
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {errors.submit && (
          <div className="mt-4 flex items-center gap-2 text-red-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{errors.submit}</p>
          </div>
        )}

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'در حال ثبت...' : 'ثبت ماده اولیه'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 
                     transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
