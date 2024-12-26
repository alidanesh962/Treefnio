// src/components/inventory/Recipes.tsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, MessageSquare } from 'lucide-react';
import { db } from '../../database';
import type { Item, MaterialUnit, ProductRecipe } from '../../types';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';
import RecipeEditDialog from './RecipeEditDialog';

export default function Recipes() {
  const [recipes, setRecipes] = useState<ProductRecipe[]>([]);
  const [materials, setMaterials] = useState<Item[]>([]);
  const [products, setProducts] = useState<Item[]>([]);
  const [units, setUnits] = useState<MaterialUnit[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<ProductRecipe | null>(null);
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
    setUnits(db.getMaterialUnits());
    setRecipes(db.getProductRecipes());
  };

  const handleSaveRecipe = (recipe: ProductRecipe) => {
    const now = Date.now();
    const updatedRecipe = {
      ...recipe,
      updatedAt: now,
      createdAt: recipe.createdAt || now
    };

    if (recipe.id) {
      if (db.updateProductRecipe(updatedRecipe)) {
        setRecipes(recipes.map(r => r.id === recipe.id ? updatedRecipe : r));
      }
    } else {
      const newRecipe = db.addProductRecipe({
        productId: recipe.productId,
        name: recipe.name,
        materials: recipe.materials,
        notes: recipe.notes
      });
      setRecipes([...recipes, newRecipe]);
    }
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = (id: string) => {
    if (db.deleteProductRecipe(id)) {
      setRecipes(recipes.filter(r => r.id !== id));
    }
    setShowDeleteConfirm({ isOpen: false, id: '', name: '' });
  };

  const filteredRecipes = recipes.filter(recipe => 
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (recipe.notes?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          دیریت رسپی
        </h2>
        <button
          onClick={() => setEditingRecipe({
            id: '',
            productId: products[0]?.id || '',
            name: '',
            materials: [],
            notes: '',
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
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
                  {recipe.notes}
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

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                مواد اولیه:
              </h4>
              <div className="space-y-2">
                {recipe.materials.map((material, index) => {
                  const materialItem = materials.find(m => m.id === material.materialId);
                  const unit = units.find(u => u.id === material.unit);
                  return (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {materialItem?.name || 'Unknown'} - {material.amount} {unit?.symbol || ''}
                      </span>
                      {material.note && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <MessageSquare className="h-4 w-4" />
                          <span>{material.note}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm.isOpen}
        itemName={showDeleteConfirm.name}
        onConfirm={() => handleDeleteRecipe(showDeleteConfirm.id)}
        onCancel={() => setShowDeleteConfirm({ isOpen: false, id: '', name: '' })}
      />

      {/* Recipe Edit Dialog */}
      {editingRecipe && (
        <RecipeEditDialog
          recipe={editingRecipe}
          materials={materials}
          units={units}
          products={products}
          onSave={handleSaveRecipe}
          onCancel={() => setEditingRecipe(null)}
        />
      )}
    </div>
  );
}