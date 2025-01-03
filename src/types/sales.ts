import { ProductDefinition } from './index';

export interface SaleEntry {
  id: string;
  productId: string;
  product?: ProductDefinition;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  saleDate: string; // Shamsi date string
  createdAt: number;
  updatedAt: number;
}

export interface SaleBatch {
  id: string;
  entries: SaleEntry[];
  startDate: string; // Shamsi date string
  endDate: string; // Shamsi date string
  totalRevenue: number;
  totalCost: number;
  createdAt: number;
  updatedAt: number;
}

export interface SalesImportMapping {
  productCode: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  date: string;
  [key: string]: string; // For any additional columns
}

export interface UnmappedProduct {
  code?: string;
  name: string;
  possibleMatches: ProductDefinition[];
}

export interface SalesReport {
  byDepartment: {
    [department: string]: {
      totalUnits: number;
      totalRevenue: number;
      totalCost: number;
      netRevenue: number;
      products: Array<{
        id: string;
        name: string;
        code: string;
        units: number;
        revenue: number;
        materialCost: number;
        netRevenue: number;
      }>;
    };
  };
  byProductionSegment: {
    [segment: string]: {
      totalUnits: number;
      totalRevenue: number;
      totalCost: number;
      netRevenue: number;
      products: Array<{
        id: string;
        name: string;
        code: string;
        units: number;
        revenue: number;
        materialCost: number;
        netRevenue: number;
      }>;
    };
  };
  overall: {
    totalUnits: number;
    totalRevenue: number;
    totalCost: number;
    netRevenue: number;
  };
  timeRange: {
    start: string; // Shamsi date
    end: string; // Shamsi date
  };
} 