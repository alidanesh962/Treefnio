export interface Material {
  id: string;
  name: string;
  code: string;
  unit: string;
  unitPrice: number;
  currentStock: number;
  minimumStock: number;
  description?: string;
  category: string;
  foodGroup: string;
  storageLocation: string;
  expiryDate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} 