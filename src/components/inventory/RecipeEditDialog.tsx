// src/components/inventory/RecipeEditDialog.tsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Item, MaterialUnit, ProductRecipe } from '../../types';

interface RecipeEditDialogProps {
  recipe: ProductRecipe;
  materials: Item[];
  units: MaterialUnit[];
  products: Item[];
  onSave: (recipe: ProductRecipe) => void;
  onCancel: () => void;
}

export default function RecipeEditDialog({
  recipe,
  materials,
  units,
  products,
  onSave,
  onCancel
}: RecipeEditDialogProps) {
  const [formData, setFormData] = useState<ProductRecipe>(recipe);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام رسپی الزامی است';
    }

    if (!formData.productId) {
      newErrors.productId = 'انتخاب محصول الزامی است';
    }

    if (formData.materials.length === 0) {
      newErrors.materials = 'حداقل یک ماده اولیه باید اضافه شود';
    }

    formData.materials.forEach((material, index) => {
      if (!material.materialId) {
        newErrors[`material_${index}`] = 'انتخاب ماده اولیه الزامی است';
      }
      if (!material.unit) {
        newErrors[`unit_${index}`] = 'انتخاب واحد الزامی است';
      }
      if (material.amount <= 0) {
        newErrors[`amount_${index}`] = 'مقدار باید بزرگتر از صفر باشد';
      }
      if (material.unitPrice < 0) {
        newErrors[`unitPrice_${index}`] = 'قیمت واحد نمی‌تواند منفی باشد';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleAddMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          materialId: '',
          unit: units[0]?.id || '',
          amount: 0,
          unitPrice: 0,
          totalPrice: 0
        }
      ]
    }));
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleMaterialChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const materials = [...prev.materials];
      materials[index] = {
        ...materials[index],
        [field]: value,
        totalPrice: field === 'amount' || field === 'unitPrice'
          ? Number(materials[index].amount || 0) * Number(materials[index].unitPrice || 0)
          : materials[index].totalPrice
      };
      return { ...prev, materials };
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {recipe.id ? 'ویرایش رسپی' : 'رسپی جدید'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipe Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام رسپی
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                محصول
              </label>
              <select
                value={formData.productId}
                onChange={e => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">انتخاب محصول</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {errors.productId && (
                <p className="mt-1 text-sm text-red-600">{errors.productId}</p>
              )}
            </div>

            {/* Materials */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  مواد اولیه
                </label>
                <button
                  type="button"
                  onClick={handleAddMaterial}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  افزودن ماده اولیه
                </button>
              </div>
              
              {errors.materials && (
                <p className="mt-1 text-sm text-red-600">{errors.materials}</p>
              )}

              <div className="space-y-4">
                {formData.materials.map((material, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1 space-y-4">
                      {/* Material Selection */}
                      <div>
                        <select
                          value={material.materialId}
                          onChange={e => handleMaterialChange(index, 'materialId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">انتخاب ماده اولیه</option>
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        {errors[`material_${index}`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`material_${index}`]}</p>
                        )}
                      </div>

                      {/* Unit Selection */}
                      <div>
                        <select
                          value={material.unit}
                          onChange={e => handleMaterialChange(index, 'unit', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="">انتخاب واحد</option>
                          {units.map(unit => (
                            <option key={unit.id} value={unit.id}>
                              {unit.name}
                            </option>
                          ))}
                        </select>
                        {errors[`unit_${index}`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`unit_${index}`]}</p>
                        )}
                      </div>

                      {/* Amount */}
                      <div>
                        <input
                          type="number"
                          value={material.amount}
                          onChange={e => handleMaterialChange(index, 'amount', Number(e.target.value))}
                          placeholder="مقدار"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {errors[`amount_${index}`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`amount_${index}`]}</p>
                        )}
                      </div>

                      {/* Unit Price */}
                      <div>
                        <input
                          type="number"
                          value={material.unitPrice}
                          onChange={e => handleMaterialChange(index, 'unitPrice', Number(e.target.value))}
                          placeholder="قیمت واحد"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        {errors[`unitPrice_${index}`] && (
                          <p className="mt-1 text-sm text-red-600">{errors[`unitPrice_${index}`]}</p>
                        )}
                      </div>

                      {/* Note */}
                      <div>
                        <input
                          type="text"
                          value={material.note || ''}
                          onChange={e => handleMaterialChange(index, 'note', e.target.value)}
                          placeholder="توضیحات (اختیاری)"
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                                   bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveMaterial(index)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="mr-2 block text-sm text-gray-900 dark:text-gray-300">
                فعال
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                ذخیره
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}