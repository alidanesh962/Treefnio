// src/components/inventory/Recipes.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { db } from '../../database';
import type { Item } from '../../database/types';
import { Recipe } from '../../types/recipe';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import RecipeEditDialog from './RecipeEditDialog';

export default function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [materials, setMaterials] = useState<Item[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({ isOpen: false, id: '', name: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setMaterials(db.getMaterials());
    setProducts(db.getProducts());
    setRecipes(db.getRecipes());
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    const now = Date.now();
    const updatedRecipe = {
      ...recipe,
      updatedAt: now,
      createdAt: recipe.createdAt || now
    };

    if (recipe.id) {
      if (db.updateRecipe(updatedRecipe)) {
        setRecipes(recipes.map(r => r.id === recipe.id ? updatedRecipe : r));
      }
    } else {
      const newRecipe = db.addRecipe(updatedRecipe);
      setRecipes([...recipes, newRecipe]);
    }
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = (id: string) => {
    if (db.deleteRecipe(id)) {
      setRecipes(recipes.filter(r => r.id !== id));
    }
    setShowDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          مدیریت رسپی
        </h2>
        <button
          onClick={() => setEditingRecipe({
            id: '',
            name: '',
            description: '',
            ingredients: [],
            finalProduct: products[0]?.id || '',
            yield: 1
          })}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                   hover:bg-blue-600 transition-colors"
        >
          <Plus className="h-5 w-5" />
          افزودن رسپی جدید
        </button>
      </div>

      {/* Search Section */}
      <div className="relative">
        <input
          type="text"
          placeholder="جستجوی رسپی..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 
                   bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {/* Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => (
          <div key={recipe.id} 
               className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm
                        border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {recipe.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {recipe.description}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingRecipe(recipe)}
                  className="p-1.5 text-blue-500 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm({
                    isOpen: true,
                    id: recipe.id,
                    name: recipe.name
                  })}
                  className="p-1.5 text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مواد اولیه:
                </h4>
                <ul className="space-y-1">
                  {recipe.ingredients.map(ingredient => {
                    const material = materials.find(m => m.id === ingredient.materialId);
                    return (
                      <li key={ingredient.materialId} 
                          className="text-sm text-gray-600 dark:text-gray-400">
                        {material?.name}: {ingredient.quantity} واحد
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  محصول نهایی:
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {products.find(p => p.id === recipe.finalProduct)?.name}
                  {' - '}
                  {recipe.yield} واحد
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recipe Edit Dialog */}
      {editingRecipe && (
        <RecipeEditDialog
          recipe={editingRecipe}
          materials={materials}
          products={products}
          onSave={handleSaveRecipe}
          onCancel={() => setEditingRecipe(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        itemName={showDeleteConfirm.name}
        onConfirm={() => handleDeleteRecipe(showDeleteConfirm.id)}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />
    </div>
  );
}