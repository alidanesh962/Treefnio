// src/components/production/RecipesList.tsx

import React from 'react';
import { Edit2, ClipboardList } from 'lucide-react';
import { ProductRecipe, Item, MaterialUnit } from '../../types';
import { db } from '../../database';

interface RecipesListProps {
  recipes: ProductRecipe[];
  materials: Item[];
  units: MaterialUnit[];
  onEdit: (recipe: ProductRecipe) => void;
}

export default function RecipesList({
  recipes,
  materials,
  units,
  onEdit
}: RecipesListProps) {
  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m.id === materialId);
    return material?.name || 'Unknown Material';
  };

  const getUnitSymbol = (unitId: string): string => {
    const unit = units.find(u => u.id === unitId);
    return unit?.symbol || '';
  };

  const calculateTotalCost = (recipe: ProductRecipe): number => {
    return recipe.materials.reduce((total, material) => total + material.totalPrice, 0);
  };

  return (
    <div className="space-y-6">
      {recipes.map(recipe => (
        <div 
          key={recipe.id}
          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6
                   border border-gray-200/50 dark:border-gray-600/50"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                {recipe.name}
              </h4>
              {recipe.notes && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {recipe.notes}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(recipe)}
                className="p-2 text-blue-500 hover:text-blue-600 transition-colors
                         bg-white dark:bg-gray-800 rounded-lg shadow-sm"
                title="ویرایش دستور پخت"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Materials List */}
          <div className="mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ماده اولیه
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      مقدار
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      قیمت واحد
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      قیمت کل
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recipe.materials.map((material, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {getMaterialName(material.materialId)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.amount} {getUnitSymbol(material.unit)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.unitPrice.toLocaleString()} ریال
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {material.totalPrice.toLocaleString()} ریال
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white text-left">
                      جمع کل:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {calculateTotalCost(recipe).toLocaleString()} ریال
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Recipe Info */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span>
                {recipe.materials.length} ماده اولیه
              </span>
            </div>
            <div>
              آخرین بروزرسانی: {new Date(recipe.updatedAt).toLocaleDateString('fa-IR')}
            </div>
          </div>
        </div>
      ))}

      {/* Empty State */}
      {recipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            هنوز دستور پختی ثبت نشده است
          </p>
        </div>
      )}
    </div>
  );
}