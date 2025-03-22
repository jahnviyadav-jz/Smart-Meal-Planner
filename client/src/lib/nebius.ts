import { apiRequest } from "./queryClient";
import type { Recipe, RecipeRecommendationRequest } from "../../../shared/schema";

/**
 * Gets recipe recommendations from Nebius API via our backend
 * This is a client-side wrapper around the server-side Nebius functionality
 * 
 * @param ingredients - List of ingredients to use in recipes
 * @param diet - Optional diet preference (e.g., 'vegetarian', 'vegan', 'high-protein')
 * @param mealType - Optional meal type (e.g., 'breakfast', 'lunch', 'dinner')
 * @returns Promise with array of recipe objects
 */
export async function getRecipeRecommendations(
  ingredients: string[],
  diet?: string,
  mealType?: string
): Promise<Recipe[]> {
  const requestData: RecipeRecommendationRequest = {
    ingredients,
    diet: diet || "none",
    mealType: mealType || "any"
  };

  try {
    const response = await apiRequest<{ recipes: Recipe[]; provider: string }>({
      method: "POST",
      url: "/api/recipe-recommendations",
      data: requestData
    });
    
    console.log(`Recipe recommendations provided by: ${response.provider}`);
    return response.recipes || [];
  } catch (error) {
    console.error("Error getting recipe recommendations:", error);
    throw error;
  }
}

/**
 * Scan an image for ingredients using Nebius AI
 * 
 * @param imageUrl - Base64 or URL to image
 * @returns Promise with identified ingredients
 */
export async function scanIngredientsFromImage(imageUrl: string) {
  try {
    const response = await apiRequest<{ ingredients: string[]; added: any[]; provider: string }>({
      method: "POST",
      url: "/api/scan-ingredients",
      data: {
        image: imageUrl
      }
    });
    
    console.log(`Image ingredients scan provided by: ${response.provider}`);
    return {
      ingredients: response.ingredients,
      added: response.added
    };
  } catch (error) {
    console.error("Error scanning ingredients from image:", error);
    throw error;
  }
}

/**
 * Query the Nebius database directly
 * 
 * @param query - SQL query to execute
 * @param params - Query parameters
 * @returns Promise with query results
 */
export async function queryNebiusDatabase(query: string, params: any = {}) {
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/api/nebius-database",
      data: {
        query,
        params
      }
    });
    
    return response;
  } catch (error) {
    console.error("Error querying Nebius database:", error);
    throw error;
  }
}