// src/components/inventory/RecipeEditDialog.tsx
import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Item } from '../../database/types';
import { Recipe } from '../../types/recipe';

interface RecipeEditDialogProps {
  recipe: Recipe;
  materials: Item[];
  products: Item[];
  onSave: (recipe: Recipe) => void;
  onCancel: () => void;
}

export default function RecipeEditDialog({
  recipe,
  materials,
  products,
  onSave,
  onCancel
}: RecipeEditDialogProps) {
  const [editedRecipe, setEditedRecipe] = useState<Recipe>(recipe);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editedRecipe.name.trim()) {
      newErrors.name = 'نام رسپی الزامی است';
    }

    if (!editedRecipe.finalProduct) {
      newErrors.finalProduct = 'انتخاب محصول نهایی الزامی است';
    }

    if (editedRecipe.ingredients.length === 0) {
      newErrors.ingredients = 'حداقل یک ماده اولیه باید وجود داشته باشد';
    }

    if (editedRecipe.yield <= 0) {
      newErrors.yield = 'مقدار تولید باید بیشتر از صفر باشد';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddIngredient = () => {
    setEditedRecipe({
      ...editedRecipe,
      ingredients: [
        ...editedRecipe.ingredients,
        { materialId: materials[0]?.id || '', quantity: 1 }
      ]
    });
  };

  const handleRemoveIngredient = (index: number) => {
    setEditedRecipe({
      ...editedRecipe,
      ingredients: editedRecipe.ingredients.filter((_, i) => i !== index)
    });
  };

  const handleIngredientChange = (
    index: number, 
    field: 'materialId' | 'quantity', 
    value: string | number
  ) => {
    const newIngredients = [...editedRecipe.ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value
    };
    setEditedRecipe({
      ...editedRecipe,
      ingredients: newIngredients
    });
  };

  const handleSubmit = () => {
    if (validate()) {
      onSave(editedRecipe);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {recipe.id ? 'ویرایش رسپی' : 'افزودن رسپی جدید'}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام رسپی
              </label>
              <input
                type="text"
                value={editedRecipe.name}
                onChange={(e) => setEditedRecipe({ ...editedRecipe, name: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.name 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات
              </label>
              <textarea
                value={editedRecipe.description}
                onChange={(e) => setEditedRecipe({ ...editedRecipe, description: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                مواد اولیه
              </label>
              <button
                onClick={handleAddIngredient}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
              >
                <Plus className="h-4 w-4" />
                افزودن ماده
              </button>
            </div>

            {errors.ingredients && (
              <p className="mb-2 text-sm text-red-500">{errors.ingredients}</p>
            )}

            <div className="space-y-3">
              {editedRecipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-3">
                  <select
                    value={ingredient.materialId}
                    onChange={(e) => handleIngredientChange(index, 'materialId', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {materials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={ingredient.quantity}
                    onChange={(e) => handleIngredientChange(
                      index, 
                      'quantity', 
                      parseFloat(e.target.value) || 0
                    )}
                    className="w-24 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                             bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                    min="0"
                    step="0.1"
                  />

                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-2 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Final Product */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                محصول نهایی
              </label>
              <select
                value={editedRecipe.finalProduct}
                onChange={(e) => setEditedRecipe({ ...editedRecipe, finalProduct: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.finalProduct 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">انتخاب محصول...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {errors.finalProduct && (
                <p className="mt-1 text-sm text-red-500">{errors.finalProduct}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                مقدار تولید
              </label>
              <input
                type="number"
                value={editedRecipe.yield}
                onChange={(e) => setEditedRecipe({ 
                  ...editedRecipe, 
                  yield: parseFloat(e.target.value) || 0 
                })}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.yield 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                min="0"
                step="0.1"
              />
              {errors.yield && (
                <p className="mt-1 text-sm text-red-500">{errors.yield}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                       transition-colors"
            >
              {recipe.id ? 'بروزرسانی' : 'ایجاد'} رسپی
            </button>
            <button
              onClick={onCancel}
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