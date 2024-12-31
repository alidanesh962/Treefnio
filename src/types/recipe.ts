// src/types/recipe.ts

export interface Recipe {
  id: string;
  name: string;
  productId: string;
  materials: Array<{
    materialId: string;
    quantity: number;
    unit: string;
    note?: string;
  }>;
  notes?: string;
  createdAt?: string | number;
  updatedAt?: string | number;
  isActive?: boolean;
}