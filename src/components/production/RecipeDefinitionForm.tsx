// src/components/production/RecipeDefinitionForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Save, 
  Trash2, 
  Star,
  AlertCircle,
  Calculator,
  Package 
} from 'lucide-react';
import { db } from '../../database';
import { 
  Item, 
  MaterialUnit, 
  ProductDefinition, 
  ProductRecipe, 
  RecipeMaterial 
} from '../../types';
import MaterialRow from './MaterialRow';
import RecipesList from './RecipesList';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import { exportRecipesToPDF } from '../../utils/recipePDFExport';
import { logUserActivity } from '../../utils/userActivity';
import { getCurrentUser } from '../../utils/auth';

interface RecipeDefinitionFormProps {
  product: ProductDefinition;
  onBack: () => void;
}
export default function RecipeDefinitionForm({ product, onBack }: RecipeDefinitionFormProps) {
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [materials, setMaterials] = useState<Item[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<ProductRecipe | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [batchSize, setBatchSize] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    materials: [] as RecipeMaterial[],
    notes: '',
    isActive: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMaterials(db.getMaterials());
    setUnits(db.getMaterialUnits());
    loadRecipes();
  }, [product.id]);
  const loadRecipes = () => {
    setRecipes(db.getProductRecipes(product.id));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      materials: [],
      notes: '',
      isActive: false
    });
    setBatchSize(1);
    setErrors({});
    setSelectedRecipe(null);
  };

  const handleSetActive = (recipe: ProductRecipe) => {
    if (recipe.isActive) return;
    db.setActiveRecipe(product.id, recipe.id);
    setRecipes(prevRecipes => 
      prevRecipes.map(r => ({
        ...r,
        isActive: r.id === recipe.id
      }))
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام رسپی الزامی است';
    }

    if (formData.materials.length === 0) {
      newErrors.materials = 'حداقل یک ماده اولیه باید وارد شود';
    }

    if (batchSize <= 0) {
      newErrors.batchSize = 'تعداد محصول باید بزرگتر از صفر باشد';
    }

    formData.materials.forEach((material, index) => {
      if (!material.materialId) {
        newErrors[`material_${index}`] = 'انتخاب ماده اولیه الزامی است';
      }
      if (material.amount <= 0) {
        newErrors[`amount_${index}`] = 'مقدار باید بیشتر از صفر باشد';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const calculateSingleUnitAmounts = (materials: RecipeMaterial[]): RecipeMaterial[] => {
    return materials.map(material => ({
      ...material,
      amount: material.amount / batchSize,
      totalPrice: (material.amount / batchSize) * material.unitPrice
    }));
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const singleUnitMaterials = calculateSingleUnitAmounts(formData.materials);

    const shouldBeActive = recipes.length === 0 ? true : formData.isActive;

    const recipeData: Omit<ProductRecipe, 'id' | 'createdAt' | 'updatedAt'> = {
      productId: product.id,
      name: formData.name,
      materials: singleUnitMaterials,
      notes: formData.notes || undefined,
      isActive: shouldBeActive
    };

    const user = getCurrentUser();

    if (selectedRecipe) {
      db.updateProductRecipe({
        ...selectedRecipe,
        ...recipeData,
        isActive: shouldBeActive,
        updatedAt: Date.now()
      });
      if (user) {
        logUserActivity(
          user.username,
          user.username,
          'edit',
          'recipes',
          `Updated recipe "${formData.name}" for product "${product.name}"`
        );
      }
    } else {
      const newRecipe = db.addProductRecipe(recipeData);
      if (shouldBeActive) {
        db.setActiveRecipe(product.id, newRecipe.id);
      }
      if (user) {
        logUserActivity(
          user.username,
          user.username,
          'create',
          'recipes',
          `Created new recipe "${formData.name}" for product "${product.name}"`
        );
      }
    }

    loadRecipes();
    resetForm();
  };

  const handleDeleteRecipe = () => {
    if (selectedRecipe) {
      db.deleteProductRecipe(selectedRecipe.id);
      const user = getCurrentUser();
      if (user) {
        logUserActivity(
          user.username,
          user.username,
          'delete',
          'recipes',
          `Deleted recipe "${selectedRecipe.name}" for product "${product.name}"`
        );
      }
      loadRecipes();
      resetForm();
    }
    setShowDeleteConfirm(false);
  };

  const handleMaterialChange = (index: number, updates: Partial<RecipeMaterial>) => {
    const updatedMaterials = [...formData.materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      ...updates
    };
    setFormData(prev => ({ ...prev, materials: updatedMaterials }));
  };

  const handleAddMaterial = () => {
    if (materials.length === 0) return;

    const newMaterial: RecipeMaterial = {
      materialId: '',
      unit: units[0]?.id || '',
      amount: 0,
      unitPrice: 0,
      totalPrice: 0,
      note: undefined
    };

    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, newMaterial]
    }));
  };

  const handleRemoveMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleExportPDF = async (selectedRecipes: ProductRecipe[]) => {
    try {
      await exportRecipesToPDF({
        recipes: selectedRecipes,
        materials,
        units,
        product
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
    }
  };
  return (
    <div className="space-y-6">
      {/* Product Info Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border-r-4 border-blue-500">
        <div className="flex items-center gap-3">
          <Package className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {product.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              کد محصول: {product.code}
            </p>
          </div>
        </div>
      </div>

      {/* Recipe Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {/* Batch Size Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                تعداد محصول برای محاسبه مواد
              </label>
              <div className="flex gap-2 items-start">
                <input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Math.max(1, parseFloat(e.target.value) || 1))}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    errors.batchSize 
                      ? 'border-red-300 dark:border-red-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  } bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white`}
                  min="1"
                  step="1"
                />
                <div className="flex flex-col justify-center">
                  <Calculator className="h-5 w-5 text-gray-400" />
                </div>
              </div>
              {errors.batchSize && (
                <p className="mt-1 text-sm text-red-500">{errors.batchSize}</p>
              )}
            </div>
          </div>

          {/* Active Recipe Toggle */}
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 
                            peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full 
                            peer dark:bg-gray-700 peer-checked:after:translate-x-5
                            peer-checked:after:border-white after:content-[''] after:absolute 
                            after:top-[2px] after:right-[22px] after:bg-white after:border-gray-300 
                            after:border after:rounded-full after:h-5 after:w-5 after:transition-all 
                            dark:border-gray-600 peer-checked:bg-blue-600"></div>
              <span className="mr-3 text-sm font-medium text-gray-900 dark:text-gray-300 flex items-center gap-2">
                <Star className={`h-4 w-4 ${formData.isActive ? 'text-yellow-500' : 'text-gray-400'}`} />
                تنظیم به عنوان دستور پخت فعال
              </span>
            </label>
          </div>
          {/* Materials Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                مواد اولیه
              </label>
              <button
                onClick={handleAddMaterial}
                className="flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 
                        text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 
                        dark:hover:bg-blue-900/40 transition-colors"
              >
                <Plus className="h-4 w-4" />
                افزودن ماده اولیه
              </button>
            </div>

            {errors.materials && (
              <p className="mb-2 text-sm text-red-500">{errors.materials}</p>
            )}

            <div className="space-y-4">
              {formData.materials.map((material, index) => (
                <MaterialRow
                  key={index}
                  material={material}
                  index={index}
                  materials={materials}
                  units={units}
                  onChange={handleMaterialChange}
                  onDelete={handleRemoveMaterial}
                  error={errors[`material_${index}`] || errors[`amount_${index}`]}
                  showHeader={index === 0}
                  batchSize={batchSize}
                />
              ))}
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              توضیحات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                       bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="توضیحات اضافی..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            {selectedRecipe && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 
                         transition-colors"
              >
                حذف دستور پخت
              </button>
            )}
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600 transition-colors"
            >
              <Save className="h-4 w-4" />
              {selectedRecipe ? 'بروزرسانی' : 'ذخیره'} دستور پخت
            </button>
          </div>
        </div>
      </div>
      {/* Recipes List */}
      {recipes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            دستورهای پخت موجود
          </h3>
          <RecipesList
            recipes={recipes}
            materials={materials}
            units={units}
            onEdit={recipe => {
              setSelectedRecipe(recipe);
              setFormData({
                name: recipe.name,
                materials: recipe.materials,
                notes: recipe.notes || '',
                isActive: recipe.isActive
              });
              setBatchSize(1);
            }}
            onSetActive={handleSetActive}
            product={product}
            
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        itemName={selectedRecipe?.name || ''}
        onConfirm={handleDeleteRecipe}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}