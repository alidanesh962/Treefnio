// src/components/production/RecipePDFTemplate.tsx
import React from 'react';
import { ProductRecipe, Item, MaterialUnit, ProductDefinition } from '../../types';
import { convertEnglishToPersianNumbers } from '../../utils/fonts';

interface RecipePDFTemplateProps {
  recipes: ProductRecipe[];  // Changed from recipe to recipes
  materials: Item[];
  units: MaterialUnit[];
  product: ProductDefinition;
}

const RecipePDFTemplate: React.FC<RecipePDFTemplateProps> = ({
  recipes,  // Changed from recipe to recipes
  materials,
  units,
  product
}) => {
  // We'll use the first recipe since we're generating one at a time
  const recipe = recipes[0];

  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m.id === materialId);
    return material?.name || '';
  };

  const getUnitSymbol = (unitId: string): string => {
    const unit = units.find(u => u.id === unitId);
    return unit?.symbol || '';
  };

  const formatNumber = (num: number): string => {
    return convertEnglishToPersianNumbers(num.toLocaleString());
  };

  const calculateTotalCost = (): number => {
    return recipe.materials.reduce((total, material) => total + material.totalPrice, 0);
  };

  return (
    <div className="p-8 bg-white text-black" dir="rtl">
      {/* Header */}
      <div className="mb-8 pb-4 border-b-2 border-gray-300">
        <h1 className="text-2xl font-bold mb-2">{recipe.name}</h1>
        <div className="flex justify-between text-sm">
          <div>
            <p>محصول: {product.name}</p>
            <p>کد محصول: {product.code}</p>
          </div>
          <div>
            <p>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</p>
          </div>
        </div>
      </div>

      {/* Recipe Notes */}
      {recipe.notes && (
        <div className="mb-8 p-4 bg-gray-100 rounded">
          <h3 className="font-bold mb-2">توضیحات:</h3>
          <p>{recipe.notes}</p>
        </div>
      )}

      {/* Materials Table */}
      <table className="w-full mb-8">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2 text-right border">ماده اولیه</th>
            <th className="p-2 text-right border">مقدار</th>
            <th className="p-2 text-right border">قیمت واحد (ریال)</th>
            <th className="p-2 text-right border">قیمت کل (ریال)</th>
          </tr>
        </thead>
        <tbody>
          {recipe.materials.map((material, index) => (
            <tr key={index}>
              <td className="p-2 border">{getMaterialName(material.materialId)}</td>
              <td className="p-2 border">
                {formatNumber(material.amount)} {getUnitSymbol(material.unit)}
              </td>
              <td className="p-2 border">{formatNumber(material.unitPrice)}</td>
              <td className="p-2 border">{formatNumber(material.totalPrice)}</td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-bold">
            <td colSpan={3} className="p-2 border text-left">جمع کل:</td>
            <td className="p-2 border">{formatNumber(calculateTotalCost())}</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="text-sm text-gray-500 mt-8 pt-4 border-t">
        <div className="flex justify-between">
          <span>آخرین بروزرسانی: {new Date(recipe.updatedAt).toLocaleDateString('fa-IR')}</span>
        </div>
      </div>
    </div>
  );
};

export default RecipePDFTemplate;