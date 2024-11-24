// src/components/production/RecipeDefinitionForm.tsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Save, 
  Trash2, 
  Star, 
  AlertCircle 
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
    setErrors({});
    setSelectedRecipe(null);
  };

  const handleSetActive = (recipe: ProductRecipe) => {
    if (recipe.isActive) return; // Already active

    // Update in database
    db.setActiveRecipe(product.id, recipe.id);
    
    // Update local state
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
    if (!validate()) return;

    const recipeData: Omit<ProductRecipe, 'id' | 'createdAt' | 'updatedAt'> = {
      productId: product.id,
      name: formData.name,
      materials: formData.materials,
      notes: formData.notes || undefined,
      isActive: formData.isActive
    };

    if (selectedRecipe) {
      // For updates, maintain current active status unless explicitly changed
      db.updateProductRecipe({
        ...selectedRecipe,
        ...recipeData,
        isActive: formData.isActive,
        updatedAt: Date.now()
      });
    } else {
      // For new recipes, if setting as active, handle in database
      const newRecipe = db.addProductRecipe(recipeData);
      if (formData.isActive) {
        db.setActiveRecipe(product.id, newRecipe.id);
      }
    }

    loadRecipes();
    resetForm();
  };

  const handleDeleteRecipe = () => {
    if (selectedRecipe) {
      db.deleteProductRecipe(selectedRecipe.id);
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

  return (
    <div className="space-y-6">
      {/* Recipe Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
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
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
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
                            peer dark:bg-gray-700 peer-checked:after:translate-x-full 
                            peer-checked:after:border-white after:content-[''] after:absolute 
                            after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 
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
            }}
            onSetActive={handleSetActive}
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