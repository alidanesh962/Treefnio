import { db } from '../database';
import { Material, Product, Recipe } from '../types';

interface SalesReportData {
  date: string;
  department: string;
  totalAmount: number;
  productId: string;
  product_code?: string;
  quantity: number;
}

interface MaterialUsageData {
  date: string;
  material: string;
  materialId: string;
  usage: number;
  cost: number;
}

interface ProductSalesDistribution {
  name: string;
  value: number;
}

interface MaterialUsageDistribution {
  name: string;
  value: number;
}

interface SaleData {
  date: string;
  department: string;
  totalAmount: number;
  productId: string;
  product_code?: string;
  quantity: number;
}

interface RecipeIngredient {
  materialId: string;
  quantity: number;
}

interface RecipeData {
  finalProduct: string;
  ingredients: RecipeIngredient[];
}

export class ReportingService {
  private static instance: ReportingService;

  private constructor() {}

  public static getInstance(): ReportingService {
    if (!ReportingService.instance) {
      ReportingService.instance = new ReportingService();
    }
    return ReportingService.instance;
  }

  public async getSalesData(startDate: string, endDate: string, datasetId: string = 'reference'): Promise<{
    salesData: SalesReportData[];
    totalSales: number;
    productDistribution: ProductSalesDistribution[];
  }> {
    try {
      // Get sales data from the database
      let salesData: SaleData[] = [];
      
      if (datasetId === 'reference') {
        const referenceDatasetId = db.getReferenceDataset();
        if (referenceDatasetId) {
          const datasets = db.getSalesDatasets();
          const referenceDataset = datasets.find(ds => ds.id === referenceDatasetId);
          if (referenceDataset) {
            salesData = referenceDataset.data.filter(sale => {
              const saleDate = new Date(sale.date);
              return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
            });
          }
        }
      } else {
        const datasets = db.getSalesDatasets();
        const selectedDataset = datasets.find(ds => ds.id === datasetId);
        if (selectedDataset) {
          salesData = selectedDataset.data.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
          });
        }
      }
      
      // Get all products for reference
      const products: Product[] = await db.getAllProducts();
      const productsMap = new Map(products.map(p => [p.id, p]));

      // Transform sales data
      const transformedSales: SalesReportData[] = salesData.map(sale => ({
        date: new Date(sale.date).toLocaleDateString('fa-IR'),
        department: sale.department,
        totalAmount: sale.totalAmount,
        productId: sale.productId,
        product_code: sale.product_code,
        quantity: sale.quantity
      }));

      // Calculate total sales
      const totalSales = transformedSales.reduce((sum, sale) => sum + sale.totalAmount, 0);

      // Calculate product distribution
      const productSales = new Map<string, number>();
      transformedSales.forEach(sale => {
        const product = productsMap.get(sale.productId);
        if (product) {
          const currentAmount = productSales.get(product.name) || 0;
          productSales.set(product.name, currentAmount + sale.quantity);
        }
      });

      const productDistribution: ProductSalesDistribution[] = Array.from(productSales.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10); // Top 10 products

      return {
        salesData: transformedSales,
        totalSales,
        productDistribution
      };
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  }

  public async getMaterialUsageData(startDate: string, endDate: string, datasetId: string = 'reference'): Promise<{
    materialsData: MaterialUsageData[];
    totalUsage: number;
    materialDistribution: MaterialUsageDistribution[];
    totalCost: number;
  }> {
    try {
      // Get sales data from the database
      let salesData: SaleData[] = [];
      
      if (datasetId === 'reference') {
        const referenceDatasetId = db.getReferenceDataset();
        if (referenceDatasetId) {
          const datasets = db.getSalesDatasets();
          const referenceDataset = datasets.find(ds => ds.id === referenceDatasetId);
          if (referenceDataset) {
            salesData = referenceDataset.data.filter(sale => {
              const saleDate = new Date(sale.date);
              return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
            });
          }
        }
      } else {
        const datasets = db.getSalesDatasets();
        const selectedDataset = datasets.find(ds => ds.id === datasetId);
        if (selectedDataset) {
          salesData = selectedDataset.data.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
          });
        }
      }
      
      // Get all products and materials for reference
      const products: Product[] = await db.getAllProducts();
      const materials: Material[] = await db.getAllMaterials();
      const recipes: RecipeData[] = await db.getAllRecipes();

      const productsMap = new Map(products.map(p => [p.id, p]));
      const materialsMap = new Map(materials.map(m => [m.id, m]));
      const recipesMap = new Map(recipes.map(r => [r.finalProduct, r]));

      // Calculate material usage from sales and recipes
      const materialUsage = new Map<string, { usage: number; cost: number; dates: Map<string, number> }>();

      salesData.forEach(sale => {
        const product = productsMap.get(sale.productId);
        if (!product) return;

        const recipe = recipesMap.get(product.id);
        if (!recipe) return;

        recipe.ingredients.forEach(ingredient => {
          const material = materialsMap.get(ingredient.materialId);
          if (!material) return;

          const usage = ingredient.quantity * sale.quantity;
          const cost = usage * material.unitPrice;
          const date = new Date(sale.date).toLocaleDateString('fa-IR');

          const materialData = materialUsage.get(material.id) || {
            usage: 0,
            cost: 0,
            dates: new Map<string, number>()
          };

          materialData.usage += usage;
          materialData.cost += cost;
          materialData.dates.set(date, (materialData.dates.get(date) || 0) + usage);
          materialUsage.set(material.id, materialData);
        });
      });

      // Transform to daily usage data
      const materialsData: MaterialUsageData[] = [];
      materialUsage.forEach((data, materialId) => {
        const material = materialsMap.get(materialId);
        if (!material) return;

        data.dates.forEach((usage, date) => {
          materialsData.push({
            date,
            material: material.name,
            materialId,
            usage,
            cost: usage * material.unitPrice
          });
        });
      });

      // Calculate total usage and distribution
      const totalUsage = Array.from(materialUsage.values())
        .reduce((sum, data) => sum + data.usage, 0);

      const totalCost = Array.from(materialUsage.values())
        .reduce((sum, data) => sum + data.cost, 0);

      const materialDistribution: MaterialUsageDistribution[] = Array.from(materialUsage.entries())
        .map(([materialId, data]) => {
          const material = materialsMap.get(materialId);
          return {
            name: material ? material.name : materialId,
            value: data.usage
          };
        })
        .sort((a, b) => b.value - a.value);

      return {
        materialsData: materialsData.sort((a, b) => a.date.localeCompare(b.date)),
        totalUsage,
        materialDistribution,
        totalCost
      };
    } catch (error) {
      console.error('Error fetching material usage data:', error);
      throw error;
    }
  }
} 