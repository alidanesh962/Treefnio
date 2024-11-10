import React from 'react';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  username?: string;  // Added username prop
}

export default function LogoutConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  username
}: LogoutConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {username ? `${username} عزیز،` : ''} آیا از خروج مطمئن هستید؟
        </h3>
        <div className="flex justify-end gap-3">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            بله
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            خیر
          </button>
        </div>
      </div>
    </div>
  );
}