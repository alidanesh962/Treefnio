// src/components/production/RecipePrintView.tsx

import React from 'react';
import { ProductRecipe, Item, MaterialUnit, ProductDefinition } from '../../types';
import { db } from '../../database';

interface RecipePrintViewProps {
  recipe: ProductRecipe;
  product: ProductDefinition;
}

export default function RecipePrintView({ recipe, product }: RecipePrintViewProps) {
  const materials = db.getMaterials();
  const units = db.getMaterialUnits();

  const getMaterialName = (materialId: string): string => {
    const material = materials.find(m => m.id === materialId);
    return material?.name || 'Unknown Material';
  };

  const getUnitSymbol = (unitId: string): string => {
    const unit = units.find(u => u.id === unitId);
    return unit?.symbol || '';
  };

  const getDepartmentName = (id: string, type: 'sale' | 'production'): string => {
    const department = db.getDepartmentsByType(type).find(d => d.id === id);
    return department?.name || '';
  };

  const calculateTotalCost = (): number => {
    return recipe.materials.reduce((total, material) => total + material.totalPrice, 0);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto bg-white">
      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">دستور پخت {recipe.name}</h1>
        <p className="text-gray-600">محصول: {product.name} (کد: {product.code})</p>
        <div className="flex justify-center gap-4 mt-2 text-sm text-gray-500">
          <span>واحد فروش: {getDepartmentName(product.saleDepartment, 'sale')}</span>
          <span>واحد تولید: {getDepartmentName(product.productionSegment, 'production')}</span>
        </div>
      </div>

      {/* Recipe Details */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">مواد اولیه مورد نیاز:</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-right">ردیف</th>
              <th className="py-2 text-right">نام ماده</th>
              <th className="py-2 text-right">مقدار</th>
              <th className="py-2 text-right">قیمت واحد (ریال)</th>
              <th className="py-2 text-right">قیمت کل (ریال)</th>
            </tr>
          </thead>
          <tbody>
            {recipe.materials.map((material, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{index + 1}</td>
                <td className="py-2">{getMaterialName(material.materialId)}</td>
                <td className="py-2">
                  {material.amount} {getUnitSymbol(material.unit)}
                </td>
                <td className="py-2 text-left">{material.unitPrice.toLocaleString()}</td>
                <td className="py-2 text-left">{material.totalPrice.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="font-bold">
              <td colSpan={4} className="py-2 text-left">جمع کل:</td>
              <td className="py-2 text-left">{calculateTotalCost().toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">توضیحات:</h2>
          <p className="text-gray-600 whitespace-pre-line">{recipe.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-sm text-gray-500 mt-8 pt-4 border-t">
        <div className="flex justify-between">
          <span>تاریخ چاپ: {new Date().toLocaleDateString('fa-IR')}</span>
          <span>آخرین بروزرسانی: {new Date(recipe.updatedAt).toLocaleDateString('fa-IR')}</span>
        </div>
      </div>
    </div>
  );
}