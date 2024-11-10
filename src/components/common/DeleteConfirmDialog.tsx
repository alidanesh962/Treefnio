// src/components/common/DeleteConfirmDialog.tsx
import React from 'react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmDialog({
  isOpen,
  itemName,
  onConfirm,
  onCancel
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          آیا از حذف "{itemName}" مطمئن هستید؟
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          این عمل قابل بازگشت نیست.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            بله، حذف شود
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}