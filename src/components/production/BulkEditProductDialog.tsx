import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ExtendedProductDefinition } from '../../types';

interface BulkEditProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (changes: Partial<ExtendedProductDefinition>) => void;
  selectedCount: number;
  departments: any[];
  productionSegments: any[];
  editingProduct?: ExtendedProductDefinition | null;
}

export default function BulkEditProductDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  departments,
  productionSegments,
  editingProduct
}: BulkEditProductDialogProps) {
  const [changes, setChanges] = useState<Partial<ExtendedProductDefinition>>({});

  // Update form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setChanges({
        name: editingProduct.name,
        code: editingProduct.code,
        saleDepartment: editingProduct.saleDepartment,
        productionSegment: editingProduct.productionSegment,
        isActive: editingProduct.isActive
      });
    } else {
      setChanges({}); // Reset form for bulk edit
    }
  }, [editingProduct]);

  const handleChange = (field: keyof ExtendedProductDefinition, value: any) => {
    setChanges(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create an object to store the actual changes
    const actualChanges: Partial<ExtendedProductDefinition> = {};
    
    // Compare each field with the original values and only include changed fields
    if (editingProduct) {
      if (changes.name !== undefined && changes.name !== editingProduct.name) {
        actualChanges.name = changes.name;
      }
      if (changes.code !== undefined && changes.code !== editingProduct.code) {
        actualChanges.code = changes.code;
      }
      if (changes.saleDepartment !== undefined && changes.saleDepartment !== editingProduct.saleDepartment) {
        actualChanges.saleDepartment = changes.saleDepartment;
      }
      if (changes.productionSegment !== undefined && changes.productionSegment !== editingProduct.productionSegment) {
        actualChanges.productionSegment = changes.productionSegment;
      }
      if (changes.isActive !== undefined && changes.isActive !== editingProduct.isActive) {
        actualChanges.isActive = changes.isActive;
      }
    } else {
      // For bulk edit, include all non-empty values
      Object.entries(changes).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          actualChanges[key as keyof ExtendedProductDefinition] = value as any;
        }
      });
    }
    
    // Only call onConfirm if there are actual changes
    if (Object.keys(actualChanges).length > 0) {
      onConfirm(actualChanges);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {selectedCount === 1 ? 'ویرایش محصول' : `ویرایش گروهی (${selectedCount} مورد)`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 
                     dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name field - only show for single product edit */}
          {selectedCount === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام محصول
              </label>
              <input
                type="text"
                value={changes.name || ''}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="نام محصول را وارد کنید"
              />
            </div>
          )}

          {/* Code field - only show for single product edit */}
          {selectedCount === 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                کد محصول
              </label>
              <input
                type="text"
                value={changes.code || ''}
                onChange={(e) => handleChange('code', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="کد محصول را وارد کنید"
              />
            </div>
          )}

          {/* Sale Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              واحد فروش
            </label>
            <select
              value={changes.saleDepartment || ''}
              onChange={(e) => handleChange('saleDepartment', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">انتخاب واحد فروش...</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Production Segment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              واحد تولید
            </label>
            <select
              value={changes.productionSegment || ''}
              onChange={(e) => handleChange('productionSegment', e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">انتخاب واحد تولید...</option>
              {productionSegments.map(segment => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
          </div>

          {/* Active Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              وضعیت
            </label>
            <select
              value={changes.isActive === undefined ? '' : changes.isActive.toString()}
              onChange={(e) => handleChange('isActive', e.target.value === 'true')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">بدون تغییر</option>
              <option value="true">فعال</option>
              <option value="false">غیرفعال</option>
            </select>
        </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 
                       dark:hover:bg-gray-700 rounded-lg"
            >
              انصراف
            </button>
          <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600 transition-colors"
          >
            اعمال تغییرات
          </button>
        </div>
        </form>
      </div>
    </div>
  );
} 