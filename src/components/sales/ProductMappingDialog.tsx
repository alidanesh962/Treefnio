import React, { useState } from 'react';
import { Product } from '../../types';

export interface UnmatchedProduct {
  code: string;
  name: string;
  occurrences: number;
  mappedToProductId?: string;
}

interface ProductMappingDialogProps {
  unmatchedProducts: UnmatchedProduct[];
  existingProducts: Product[];
  onSave: (mappings: { [key: string]: string }) => void;
  onCancel: () => void;
  onCreateNew: (products: UnmatchedProduct[]) => void;
}

export const ProductMappingDialog: React.FC<ProductMappingDialogProps> = ({
  unmatchedProducts,
  existingProducts,
  onSave,
  onCancel,
  onCreateNew
}) => {
  const [mappings, setMappings] = useState<{ [key: string]: string }>({});
  const [selectedForCreation, setSelectedForCreation] = useState<Set<string>>(new Set());

  const handleToggleForCreation = (productCode: string) => {
    const newSelected = new Set(selectedForCreation);
    if (newSelected.has(productCode)) {
      newSelected.delete(productCode);
    } else {
      newSelected.add(productCode);
    }
    setSelectedForCreation(newSelected);
  };

  const handleSave = () => {
    const productsToCreate = unmatchedProducts.filter(p => selectedForCreation.has(p.code));
    if (productsToCreate.length > 0) {
      onCreateNew(productsToCreate);
    }
    onSave(mappings);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          محصولات یافت نشده
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          برخی از محصولات در فایل با محصولات موجود در سیستم مطابقت ندارند. لطفاً آنها را به محصولات موجود متصل کنید یا به عنوان محصولات جدید ایجاد نمایید.
        </p>
        
        <div className="space-y-4">
          {unmatchedProducts.map((product) => (
            <div key={product.code} className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">({product.code})</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {product.occurrences} مورد در فایل
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <select
                  value={mappings[product.code] || ''}
                  onChange={(e) => {
                    const newMappings = { ...mappings };
                    if (e.target.value) {
                      newMappings[product.code] = e.target.value;
                      setSelectedForCreation(prev => {
                        const next = new Set(prev);
                        next.delete(product.code);
                        return next;
                      });
                    } else {
                      delete newMappings[product.code];
                    }
                    setMappings(newMappings);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={selectedForCreation.has(product.code)}
                >
                  <option value="">انتخاب محصول موجود</option>
                  {existingProducts.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`create-${product.code}`}
                    checked={selectedForCreation.has(product.code)}
                    onChange={() => handleToggleForCreation(product.code)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor={`create-${product.code}`}
                    className="text-sm text-gray-700 dark:text-gray-300"
                  >
                    ایجاد محصول جدید
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            انصراف
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            ذخیره و ادامه
          </button>
        </div>
      </div>
    </div>
  );
}; 