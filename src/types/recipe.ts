// src/types/recipe.ts

export interface RecipeMaterial {
  materialId: string;
  unit: string;
  amount: number;
  unitPrice: number;
  totalPrice: number;
  note?: string;
}

export interface ProductRecipe {
  id: string;
  productId: string;
  name: string;
  materials: RecipeMaterial[];
  notes: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}