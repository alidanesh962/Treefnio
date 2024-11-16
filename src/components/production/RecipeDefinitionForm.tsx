// src/components/production/RecipeDefinitionForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Plus, 
  Save, 
  Trash2 
} from 'lucide-react';
import { db } from '../../database';
import { 
  ProductDefinition, 
  ProductRecipe, 
  RecipeMaterial, 
  MaterialUnit, 
  Item 
} from '../../types';
import MaterialRow from './MaterialRow';
import RecipesList from './RecipesList';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface RecipeDefinitionFormProps {
  product: ProductDefinition;
  onBack: () => void;
}

const RecipeDefinitionForm: React.FC<RecipeDefinitionFormProps> = ({ product, onBack }) => {
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [materials, setMaterials] = useState<Item[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<ProductRecipe | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    materials: [] as RecipeMaterial[],
    notes: ''
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
      notes: ''
    });
    setErrors({});
    setSelectedRecipe(null);
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

    const firstMaterial = materials[0];
    const newMaterial: RecipeMaterial = {
      materialId: firstMaterial.id,
      unit: units[0]?.id || '',
      amount: 0,
      unitPrice: firstMaterial.price,
      totalPrice: 0
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'نام دستور پخت الزامی است';
    }

    if (formData.materials.length === 0) {
      newErrors.materials = 'حداقل یک ماده اولیه باید وارد شود';
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
  const handleSubmit = () => {
    if (!validateForm()) return;

    const recipeData: Omit<ProductRecipe, 'id' | 'createdAt' | 'updatedAt'> = {
      productId: product.id,
      name: formData.name,
      materials: formData.materials,
      notes: formData.notes || undefined
    };

    if (selectedRecipe) {
      db.updateProductRecipe({
        ...selectedRecipe,
        ...recipeData,
        updatedAt: Date.now()
      });
    } else {
      db.addProductRecipe(recipeData);
    }

    loadRecipes();
    resetForm();
  };

  const handleEditRecipe = (recipe: ProductRecipe) => {
    setSelectedRecipe(recipe);
    setFormData({
      name: recipe.name,
      materials: recipe.materials,
      notes: recipe.notes || ''
    });
  };

  const handleDeleteRecipe = () => {
    if (selectedRecipe) {
      db.deleteProductRecipe(selectedRecipe.id);
      loadRecipes();
      resetForm();
    }
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300
                   hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
          بازگشت به لیست محصولات
        </button>

        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          مدیریت دستور پخت - {product.name}
        </h2>
      </div>

      {/* Recipe Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
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
                placeholder="نام دستور پخت را وارد کنید"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
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
                    showHeader={index === 0} // Show header only for the first row
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

            {/* Submit Button */}
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
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         transition-colors"
              >
                {selectedRecipe ? 'بروزرسانی دستور پخت' : 'ذخیره دستور پخت'}
              </button>
            </div>
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
            onEdit={handleEditRecipe}
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
};

export default RecipeDefinitionForm;