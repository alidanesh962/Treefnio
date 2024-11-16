// src/components/production/DepartmentDialog.tsx

import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface DepartmentDialogProps {
  isOpen: boolean;
  type: 'sale' | 'production';
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export default function DepartmentDialog({
  isOpen,
  type,
  onClose,
  onConfirm
}: DepartmentDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setName('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateName = (value: string) => {
    // Remove extra spaces and check length
    const trimmedName = value.trim();
    if (trimmedName.length < 2) {
      return 'نام باید حداقل ۲ کاراکتر باشد';
    }
    if (trimmedName.length > 50) {
      return 'نام نباید بیشتر از ۵۰ کاراکتر باشد';
    }
    return '';
  };

  const handleSubmit = async () => {
    try {
      console.log(`Attempting to add new ${type} department:`, name);
      setIsSubmitting(true);
      setError('');

      const validationError = validateName(name);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Check for duplicates in localStorage
      const departments = JSON.parse(localStorage.getItem('restaurant_departments') || '[]');
      const isDuplicate = departments.some(
        (dept: any) => dept.name.toLowerCase() === name.trim().toLowerCase() && dept.type === type
      );

      if (isDuplicate) {
        setError('این نام قبلاً استفاده شده است');
        return;
      }

      onConfirm(name.trim());
      console.log(`Successfully added ${type} department:`, name);
    } catch (err) {
      console.error(`Error adding ${type} department:`, err);
      setError('خطا در ثبت اطلاعات');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {type === 'sale' ? 'افزودن واحد فروش جدید' : 'افزودن واحد تولید جدید'}
          </h3>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              نام
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              disabled={isSubmitting}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
                       disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={type === 'sale' ? 'نام واحد فروش' : 'نام واحد تولید'}
              autoFocus
            />
            {error && (
              <div className="mt-2 flex items-center gap-1 text-red-500">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block animate-spin">⌛</span>
                  در حال ثبت...
                </>
              ) : (
                'تایید'
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}