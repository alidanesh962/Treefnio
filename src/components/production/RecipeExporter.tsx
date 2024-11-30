// src/components/production/RecipeExporter.tsx

import React, { useRef } from 'react';
import { ProductRecipe, Item, MaterialUnit, ProductDefinition } from '../../types';
import RecipePDFTemplate from './RecipePDFTemplate';
import { exportRecipesToPDF } from '../../utils/newRecipePDFExport';

interface RecipeExporterProps {
  recipes: ProductRecipe[];
  materials: Item[];
  units: MaterialUnit[];
  product: ProductDefinition;
}

const RecipeExporter: React.FC<RecipeExporterProps> = (props) => {
  const templateRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!templateRef.current) return;

    try {
      await exportRecipesToPDF(templateRef.current, props);
    } catch (error) {
      // Here you might want to show an error notification to the user
      console.error('Failed to export PDF:', error);
    }
  };

  return (
    <div>
      {/* Hidden template that will be converted to PDF */}
      <div className="hidden">
        <div ref={templateRef}>
          <RecipePDFTemplate {...props} />
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white 
                 rounded-lg hover:bg-blue-600 transition-colors"
      >
        <span>دریافت PDF</span>
      </button>
    </div>
  );
};

export default RecipeExporter;