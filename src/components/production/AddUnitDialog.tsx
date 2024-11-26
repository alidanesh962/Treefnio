import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { db } from '../../database';

interface AddUnitDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (unitId: string) => void;
}

export default function AddUnitDialog({
  isOpen,
  onClose,
  onConfirm
}: AddUnitDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: ''
  });
  const [error, setError] = useState<string>('');

  const handleSubmit = () => {
    try {
      setError('');

      if (!formData.name.trim()) {
        setError('نام واحد الزامی است');
        return;
      }
      if (!formData.symbol.trim()) {
        setError('نماد واحد الزامی است');
        return;
      }

      // Check for duplicates
      const existingUnits = db.getMaterialUnits();
      const isDuplicate = existingUnits.some(unit => 
        unit.name === formData.name.trim() || 
        unit.symbol === formData.symbol.trim()
      );

      if (isDuplicate) {
        setError('این واحد یا نماد قبلاً ثبت شده است');
        return;
      }

      // Add new unit
      const newUnit = db.addMaterialUnit(formData.name.trim(), formData.symbol.trim());
      onConfirm(newUnit.id);
      onClose();
      setFormData({ name: '', symbol: '' });

    } catch (error) {
      console.error('Error adding unit:', error);
      setError('خطا در ثبت واحد جدید');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            افزودن واحد اندازه‌گیری جدید
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
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
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
              value={formData.symbol}
              onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                     bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="مثال: kg"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors"
            >
              ثبت واحد
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 
                     transition-colors"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}