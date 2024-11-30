// src/components/production/RecipesList.tsx
import React, { useState, useRef } from 'react';
import { Edit2, ClipboardList, Star, StarOff, FileText, MessageSquare } from 'lucide-react';
import { ProductRecipe, Item, MaterialUnit, ProductDefinition } from '../../types';
import { exportRecipesToPDF } from '../../utils/newRecipePDFExport';

interface RecipesListProps {
  recipes: ProductRecipe[];
  materials: Item[];
  units: MaterialUnit[];
  onEdit: (recipe: ProductRecipe) => void;
  onSetActive: (recipe: ProductRecipe) => void;
  product: ProductDefinition;
}

const RecipesList: React.FC<RecipesListProps> = ({
  recipes,
  materials,
  units,
  onEdit,
  onSetActive,
  product
}) => {
  const [exportingRecipeId, setExportingRecipeId] = useState<string | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const getMaterialName = (materialId: string): string => {
    const foundMaterial = materials.find(m => m.id === materialId);
    return foundMaterial?.name || '';
  };

  const getUnitSymbol = (unitId: string): string => {
    const unit = units.find(u => u.id === unitId);
    return unit?.symbol || '';
  };

  const calculateTotalCost = (recipe: ProductRecipe): number => {
    return recipe.materials.reduce((total, material) => total + material.totalPrice, 0);
  };

  const handleExportPDF = async (recipe: ProductRecipe) => {
    try {
      setExportingRecipeId(recipe.id);

      // Create PDF content container
      const pdfContent = document.createElement('div');
      pdfContent.className = 'pdf-container';
      pdfContent.innerHTML = `
        <div class="recipe-page">
          <div class="header">
            <h1 style="font-size: 24px; margin-bottom: 16px;">${recipe.name}</h1>
            <div style="margin-bottom: 24px;">
              <p style="margin: 4px 0;">محصول: ${product.name}</p>
              <p style="margin: 4px 0;">کد محصول: ${product.code}</p>
            </div>
          </div>

          ${recipe.notes ? `
            <div style="margin-bottom: 24px; padding: 12px; background-color: #f3f4f6;">
              <h3 style="margin-bottom: 8px;">توضیحات:</h3>
              <p>${recipe.notes}</p>
            </div>
          ` : ''}

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">ماده اولیه</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">مقدار</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">قیمت واحد (ریال)</th>
                <th style="padding: 12px; text-align: right; border: 1px solid #e5e7eb;">قیمت کل (ریال)</th>
              </tr>
            </thead>
            <tbody>
              ${recipe.materials.map(material => `
                <tr>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${getMaterialName(material.materialId)}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${material.amount} ${getUnitSymbol(material.unit)}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${material.unitPrice.toLocaleString()}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${material.totalPrice.toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr style="background-color: #f3f4f6;">
                <td colspan="3" style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; font-weight: bold;">جمع کل:</td>
                <td style="padding: 12px; border: 1px solid #e5e7eb; font-weight: bold;">${calculateTotalCost(recipe).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div style="margin-top: 24px; font-size: 12px; color: #6b7280;">
            <p>تاریخ چاپ: ${new Date().toLocaleDateString('fa-IR')}</p>
          </div>
        </div>
      `;

      await exportRecipesToPDF(pdfContent, {
        recipes: [recipe],
        materials,
        units,
        product
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExportingRecipeId(null);
    }
  };
  return (
    <div className="space-y-6">
      {recipes.map(recipe => (
        <div key={recipe.id} 
          className={`bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6
                   border border-gray-200/50 dark:border-gray-600/50
                   ${recipe.isActive ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-3">
              <button
                onClick={() => onSetActive(recipe)}
                className={`p-1.5 rounded-lg transition-colors ${
                  recipe.isActive
                    ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                title={recipe.isActive ? 'دستور پخت فعال' : 'تنظیم به عنوان دستور پخت فعال'}
              >
                {recipe.isActive ? (
                  <Star className="h-5 w-5 fill-current" />
                ) : (
                  <StarOff className="h-5 w-5" />
                )}
              </button>
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  {recipe.name}
                  {recipe.isActive && (
                    <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-1 rounded-full">
                      فعال
                    </span>
                  )}
                </h4>
                {recipe.notes && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {recipe.notes}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportPDF(recipe)}
                disabled={exportingRecipeId === recipe.id}
                className="p-2 text-green-500 hover:text-green-600 transition-colors
                         bg-white dark:bg-gray-800 rounded-lg shadow-sm
                         disabled:opacity-50 disabled:cursor-not-allowed"
                title="خروجی PDF"
              >
                <FileText className="h-5 w-5" />
              </button>
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
          <div className="mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      ماده اولیه
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      مقدار
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      قیمت واحد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      قیمت کل
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      توضیحات
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
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {material.note ? (
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-gray-400" />
                            <span>{material.note}</span>
                          </div>
                        ) : null}
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
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

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
      {recipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            هنوز دستور پختی ثبت نشده است
          </p>
        </div>
      )}
    </div>
  );
};

export default RecipesList;