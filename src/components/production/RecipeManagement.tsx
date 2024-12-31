import React, { useState } from 'react';
import { Plus, Edit2, Trash2, PlusCircle, MinusCircle } from 'lucide-react';
import { Recipe, Product, Material } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';
import { useFirebaseSync } from '../../hooks/useFirebaseSync';
import { COLLECTIONS } from '../../services/firebaseService';

interface RecipeFormData {
  name: string;
  productId: string;
  materials: Array<{
    materialId: string;
    quantity: number;
    unit: string;
    note?: string;
  }>;
  notes?: string;
}

export default function RecipeManagement() {
  const { data: recipes, loading, error, addItem, updateItem, deleteItem } = useFirebaseSync<Recipe>(COLLECTIONS.RECIPES);
  const { data: products } = useFirebaseSync<Product>(COLLECTIONS.PRODUCTS);
  const { data: materials } = useFirebaseSync<Material>(COLLECTIONS.MATERIALS);
  
  const [showForm, setShowForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [formData, setFormData] = useState<RecipeFormData>({
    name: '',
    productId: '',
    materials: [],
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    recipeId: string;
    recipeName: string;
  }>({ isOpen: false, recipeId: '', recipeName: '' });

  const resetForm = () => {
    setFormData({
      name: '',
      productId: '',
      materials: [],
      notes: ''
    });
    setErrors({});
    setEditingRecipe(null);
    setShowForm(false);
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [
        ...prev.materials,
        { materialId: '', quantity: 0, unit: '' }
      ]
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام دستور پخت الزامی است';
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
      if (material.quantity <= 0) {
        newErrors[`quantity_${index}`] = 'مقدار باید بزرگتر از صفر باشد';
      }
      if (!material.unit) {
        newErrors[`unit_${index}`] = 'انتخاب واحد الزامی است';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const newRecipe = {
      ...formData,
      id: editingRecipe?.id || `recipe-${Date.now()}`,
      createdAt: editingRecipe?.createdAt || Date.now(),
      updatedAt: Date.now(),
      isActive: true
    };

    try {
      if (editingRecipe) {
        await updateItem(newRecipe.id, newRecipe);
        const user = getCurrentUser();
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'edit',
            'recipes',
            `Updated recipe "${newRecipe.name}"`
          );
        }
      } else {
        await addItem(newRecipe);
        const user = getCurrentUser();
        if (user) {
          logUserActivity(
            user.username,
            user.username,
            'create',
            'recipes',
            `Created new recipe "${newRecipe.name}"`
          );
        }
      }
      resetForm();
    } catch (error) {
      console.error('Error saving recipe:', error);
      setErrors({ submit: 'Error saving recipe. Please try again.' });
    }
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      name: recipe.name,
      productId: recipe.productId,
      materials: recipe.materials,
      notes: recipe.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (showDeleteConfirm.recipeId) {
      try {
        const recipe = recipes.find(r => r.id === showDeleteConfirm.recipeId);
        await deleteItem(showDeleteConfirm.recipeId);
        const user = getCurrentUser();
        if (user && recipe) {
          logUserActivity(
            user.username,
            user.username,
            'delete',
            'recipes',
            `Deleted recipe "${recipe.name}"`
          );
        }
      } catch (error) {
        console.error('Error deleting recipe:', error);
      }
    }
    setShowDeleteConfirm({ isOpen: false, recipeId: '', recipeName: '' });
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading recipes: {error.message}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
          مدیریت دستور پخت
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                   rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-4 w-4" />
          افزودن دستور پخت جدید
        </button>
      </div>

      {/* Recipe Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                نام دستور پخت
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                محصول
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg border ${
                  errors.productId 
                    ? 'border-red-300 dark:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600'
                } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
              >
                <option value="">انتخاب محصول...</option>
                {products?.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              {errors.productId && (
                <p className="mt-1 text-sm text-red-500">{errors.productId}</p>
              )}
            </div>

            {/* Materials List */}
            <div className="md:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  مواد اولیه
                </label>
                <button
                  onClick={addMaterial}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                >
                  <PlusCircle className="h-4 w-4" />
                  افزودن ماده اولیه
                </button>
              </div>
              
              {errors.materials && (
                <p className="mt-1 text-sm text-red-500 mb-2">{errors.materials}</p>
              )}

              {formData.materials.map((material, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <select
                      value={material.materialId}
                      onChange={(e) => updateMaterial(index, 'materialId', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors[`material_${index}`]
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                    >
                      <option value="">انتخاب ماده اولیه...</option>
                      {materials?.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    {errors[`material_${index}`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`material_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="number"
                      value={material.quantity}
                      onChange={(e) => updateMaterial(index, 'quantity', Number(e.target.value))}
                      placeholder="مقدار"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors[`quantity_${index}`]
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                    {errors[`quantity_${index}`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`quantity_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={material.unit}
                      onChange={(e) => updateMaterial(index, 'unit', e.target.value)}
                      placeholder="واحد"
                      className={`w-full px-3 py-2 rounded-lg border ${
                        errors[`unit_${index}`]
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-gray-600'
                      } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                    />
                    {errors[`unit_${index}`] && (
                      <p className="mt-1 text-sm text-red-500">{errors[`unit_${index}`]}</p>
                    )}
                  </div>

                  <div className="flex items-center">
                    <button
                      onClick={() => removeMaterial(index)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <MinusCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                توضیحات
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                         bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-4">
            <button
              onClick={resetForm}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 
                       dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600 transition-colors"
            >
              {editingRecipe ? 'ویرایش' : 'افزودن'}
            </button>
          </div>
        </div>
      )}

      {/* Recipes List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                نام
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                محصول
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                تعداد مواد اولیه
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {recipes.map((recipe) => {
              const product = products?.find(p => p.id === recipe.productId);
              return (
                <tr key={recipe.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {recipe.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {product?.name || 'Unknown Product'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {recipe.materials.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(recipe)}
                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 
                                 dark:hover:text-blue-300 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({
                          isOpen: true,
                          recipeId: recipe.id,
                          recipeName: recipe.name
                        })}
                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 
                                 dark:hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        title="حذف دستور پخت"
        message={`آیا از حذف "${showDeleteConfirm.recipeName}" اطمینان دارید؟`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, recipeId: '', recipeName: '' })}
      />
    </div>
  );
} 