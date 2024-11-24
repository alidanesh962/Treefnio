// src/components/inventory/BulkEditDialog.tsx
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Item, MaterialUnit } from '../../types';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (changes: Partial<Item>) => void;
  selectedCount: number;
  units: MaterialUnit[];
}

export default function BulkEditDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  units
}: BulkEditDialogProps) {
  const [changes, setChanges] = useState<Partial<Item>>({});

  useEffect(() => {
    // Reset changes when dialog opens/closes
    if (!isOpen) {
      setChanges({});
    }
  }, [isOpen]);
  if (!isOpen) return null;

  const handleConfirm = () => {
    // Filter out empty values
    const filteredChanges = Object.fromEntries(
      Object.entries(changes).filter(([_, value]) => value !== '' && value != null)
    );
    
    onConfirm(filteredChanges);
    setChanges({});
  };

  const handleChange = (field: keyof Item, value: string | number) => {
    if (value === '') {
      const newChanges = { ...changes };
      delete newChanges[field];
      setChanges(newChanges);
    } else {
      setChanges(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleClose = () => {
    setChanges({});
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            ویرایش گروهی ({selectedCount} مورد)
          </h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              گروه
            </label>
            <input
              type="text"
              value={changes.department || ''}
              onChange={(e) => handleChange('department', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="گروه جدید..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              واحد اندازه‌گیری
            </label>
            <select
              value={changes.unit || ''}
              onChange={(e) => handleChange('unit', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">انتخاب واحد...</option>
              {units.map(unit => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              قیمت (ریال)
            </label>
            <input
              type="number"
              value={changes.price || ''}
              onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="قیمت جدید..."
              min="0"
              step="1000"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors"
          >
            اعمال تغییرات
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 
                     transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}
