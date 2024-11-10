// src/types/recipe.ts
export interface Recipe {
    id: string;
    name: string;
    description: string;
    ingredients: Array<{
      materialId: string;
      quantity: number;
    }>;
    finalProduct: string;
    yield: number;
    createdAt?: number;
    updatedAt?: number;
  }