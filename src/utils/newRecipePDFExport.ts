// src/utils/newRecipePDFExport.ts
import html2pdf from 'html2pdf.js';
import { ProductRecipe, Item, MaterialUnit, ProductDefinition } from '../types';

export interface PDFExportOptions {
  recipes: ProductRecipe[];
  materials: Item[];
  units: MaterialUnit[];
  product: ProductDefinition;
}

export const exportRecipesToPDF = async (container: HTMLElement, options: PDFExportOptions): Promise<void> => {
  try {
    // Wait for any React renders to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    // Define PDF options
    const pdfOptions = {
      margin: [15, 15, 15, 15],
      filename: `recipe-${options.product.code}-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        scrollY: 0,
        scrollX: 0,
        letterRendering: true,
        logging: true
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    // Clone the container to avoid modifying the original
    const clonedContainer = container.cloneNode(true) as HTMLElement;
    
    // Style the cloned container
    clonedContainer.style.width = '210mm';
    clonedContainer.style.margin = '0';
    clonedContainer.style.padding = '20px';
    clonedContainer.style.backgroundColor = 'white';
    clonedContainer.style.direction = 'rtl';
    
    // Create a temporary wrapper
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-9999px';
    wrapper.style.top = '0';
    wrapper.appendChild(clonedContainer);
    document.body.appendChild(wrapper);

    try {
      // Generate PDF
      await html2pdf()
        .from(clonedContainer)
        .set(pdfOptions)
        .save();
    } finally {
      // Clean up
      document.body.removeChild(wrapper);
    }

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};