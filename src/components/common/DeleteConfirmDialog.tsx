// src/components/common/DeleteConfirmDialog.tsx
import React from 'react';

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
  username?: string;
  type?: 'user' | 'item';
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  itemName,
  username,
  type = 'item'
}) => {
  if (!isOpen) return null;

  const title = type === 'user' ? 'حذف کاربر' : 'حذف آیتم';
  const message = type === 'user' 
    ? `آیا از حذف کاربر ${username} اطمینان دارید؟`
    : `آیا از حذف ${itemName} اطمینان دارید؟`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-right">
              <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm 
                       font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto"
            >
              حذف
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 
                       px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 
                       shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 
                       hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmDialog;