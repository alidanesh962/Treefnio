// src/utils/recipePDFExport.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ProductRecipe, Item, MaterialUnit, ProductDefinition } from '../types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export interface PDFExportOptions {
  recipes: ProductRecipe[];
  materials: Item[];
  units: MaterialUnit[];
  product: ProductDefinition;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to format date
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const exportRecipesToPDF = async ({
  recipes,
  materials,
  units,
  product
}: PDFExportOptions): Promise<void> => {
  try {
    // Create new PDF document
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    recipes.forEach((recipe, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Header Background
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 0, 210, 35, 'F');

      // Add decorative lines
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([2, 2], 0);
      for (let i = 0; i < 5; i++) {
        doc.line(0, i * 7, 210, i * 7);
      }
      doc.setLineDashPattern([], 0);

      // Header Content
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text('Recipe Card', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const dateStr = formatDate(new Date());
      doc.text(dateStr, 195, 20, { align: 'right' });

      // Recipe Info Container
      doc.setFillColor(250, 250, 250);
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      doc.rect(15, 45, 180, 50, 'F');
      doc.rect(15, 45, 180, 50, 'S');

      // Recipe Details
      doc.setTextColor(59, 130, 246);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(recipe.name, 25, 60);

      // Product Information
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const infoLines = [
        `Product Code: ${product.code}`,
        `Product Name: ${product.name}`,
        `Last Updated: ${formatDate(new Date(recipe.updatedAt))}`
      ];
      
      infoLines.forEach((line, idx) => {
        doc.text(line, 25, 70 + (idx * 7));
      });

      // Notes Section (if exists)
      let startY = 105;
      if (recipe.notes) {
        doc.setFillColor(255, 250, 240);
        doc.rect(15, startY, 180, 25, 'F');
        doc.rect(15, startY, 180, 25, 'S');
        
        doc.setTextColor(246, 173, 85);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text('Notes:', 25, startY + 7);
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(recipe.notes, 25, startY + 15);
        
        startY += 35;
      }

      // Create table data
      const tableData = recipe.materials.map(material => {
        const materialItem = materials.find(m => m.id === material.materialId);
        const unit = units.find(u => u.id === material.unit);
        
        return [
          materialItem?.name || '',
          material.amount.toString(),
          unit?.symbol || '',
          `$${formatCurrency(material.unitPrice)}`,
          `$${formatCurrency(material.totalPrice)}`
        ];
      });

      const totalCost = recipe.materials.reduce((sum, mat) => sum + mat.totalPrice, 0);

      // Generate table
      doc.autoTable({
        startY: startY,
        head: [['Material Name', 'Amount', 'Unit', 'Unit Price', 'Total Price']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [220, 220, 220],
          lineWidth: 0.1,
          font: "helvetica",
          textColor: [80, 80, 80]
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 25, halign: 'center' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        foot: [[
          { 
            content: 'Total Cost:', 
            colSpan: 4, 
            styles: { 
              halign: 'right', 
              fontStyle: 'bold',
              fillColor: [59, 130, 246],
              textColor: 255
            } 
          },
          { 
            content: `$${formatCurrency(totalCost)}`,
            styles: { 
              halign: 'right', 
              fontStyle: 'bold',
              fillColor: [59, 130, 246],
              textColor: 255
            } 
          }
        ]],
        didDrawPage: (data: any) => {
          // Footer
          const pageHeight = doc.internal.pageSize.height;
          
          // Footer background
          doc.setFillColor(248, 250, 252);
          doc.rect(0, pageHeight - 20, 210, 20, 'F');
          
          // Footer separator line
          doc.setDrawColor(230, 230, 230);
          doc.setLineWidth(0.1);
          doc.line(0, pageHeight - 20, 210, pageHeight - 20);

          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          
          // Left side
          doc.text(
            `Generated: ${formatDate(new Date())}`,
            15, 
            pageHeight - 10
          );

          // Center
          doc.text(
            'Restaurant Management System',
            105,
            pageHeight - 10,
            { align: 'center' }
          );

          // Right side
          doc.text(
            `Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.getNumberOfPages()}`,
            195,
            pageHeight - 10,
            { align: 'right' }
          );
        }
      });

      // Add Summary Box
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      if (finalY < doc.internal.pageSize.height - 60) {
        // Summary container
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(230, 230, 230);
        doc.rect(15, finalY + 15, 180, 35, 'F');
        doc.rect(15, finalY + 15, 180, 35, 'S');
        
        // Summary content
        doc.setFontSize(12);
        doc.setTextColor(59, 130, 246);
        doc.setFont("helvetica", "bold");
        doc.text('Recipe Summary', 25, finalY + 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", "normal");
        doc.text([
          `Total Materials: ${recipe.materials.length}`,
          `Total Cost: $${formatCurrency(totalCost)}`
        ], 25, finalY + 40);
      }
    });

    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`recipe-${product.code}-${timestamp}.pdf`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};