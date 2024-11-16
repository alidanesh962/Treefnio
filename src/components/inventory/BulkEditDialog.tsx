// src/components/inventory/BulkEditDialog.tsx
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Item } from '../../database/types';

interface BulkEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (changes: Partial<Item>) => void;
  selectedCount: number;
}

export default function BulkEditDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedCount
}: BulkEditDialogProps) {
  const [changes, setChanges] = useState<Partial<Item>>({});

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(changes);
    setChanges({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            ویرایش گروهی ({selectedCount} مورد)
          </h3>
          <button
            onClick={() => {
              setChanges({});
              onClose();
            }}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              بخش
            </label>
            <input
              type="text"
              value={changes.department || ''}
              onChange={(e) => setChanges({ ...changes, department: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="بخش جدید..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              قیمت
            </label>
            <input
              type="number"
              value={changes.price || ''}
              onChange={(e) => setChanges({ ...changes, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="قیمت جدید..."
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
            onClick={() => {
              setChanges({});
              onClose();
            }}
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