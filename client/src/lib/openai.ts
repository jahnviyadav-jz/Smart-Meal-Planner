import { apiRequest } from "@/lib/queryClient";
import { Recipe } from "@shared/schema";

/**
 * Gets recipe recommendations from OpenAI API via our backend
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
  try {
    const response = await apiRequest("POST", "/api/recipe-recommendations", {
      ingredients,
      diet: diet || "none",
      mealType: mealType || "any"
    });
    
    // Parse JSON response
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting recipe recommendations:", error);
    throw error;
  }
}

/**
 * Analyze a recipe for additional nutritional insights
 * 
 * @param recipeTitle - Title of the recipe
 * @param ingredients - List of ingredients in the recipe
 * @returns Promise with nutritional analysis
 */
export async function analyzeRecipe(recipeTitle: string, ingredients: string[]) {
  try {
    const response = await apiRequest("POST", "/api/recipe-analysis", {
      title: recipeTitle,
      ingredients
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error analyzing recipe:", error);
    throw error;
  }
}

/**
 * Scan an image for ingredients using AI
 * 
 * @param imageUrl - Base64 or URL to image
 * @returns Promise with identified ingredients
 */
export async function scanIngredientsFromImage(imageUrl: string) {
  try {
    const response = await apiRequest("POST", "/api/scan-ingredients", {
      image: imageUrl
    });
    
    return await response.json();
  } catch (error) {
    console.error("Error scanning ingredients from image:", error);
    throw error;
  }
}
