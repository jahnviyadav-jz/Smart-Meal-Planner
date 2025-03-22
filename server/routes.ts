import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";
import { 
  insertIngredientSchema,
  insertGroceryItemSchema,
  recipeRecommendationRequestSchema,
  insertRecipeSchema,
  insertNutritionDataSchema
} from "../shared/schema";

// Initialize OpenAI API with API key from environment variable
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "sk-" // Default to a prefix that will fail gracefully
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ingredients API
  app.get("/api/ingredients", async (req, res) => {
    try {
      const userId = 1; // For now, use a default user ID
      const ingredients = await storage.getUserIngredients(userId);
      res.json(ingredients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ingredients" });
    }
  });

  app.post("/api/ingredients", async (req, res) => {
    try {
      const userId = 1; // For now, use a default user ID
      const data = { ...req.body, userId };
      const validatedData = insertIngredientSchema.parse(data);
      const ingredient = await storage.addIngredient(validatedData);
      res.status(201).json(ingredient);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid ingredient data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add ingredient" });
      }
    }
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeIngredient(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove ingredient" });
    }
  });

  // Recipe API
  app.post("/api/recipe-recommendations", async (req, res) => {
    try {
      const data = recipeRecommendationRequestSchema.parse(req.body);
      
      // Use OpenAI to generate recipe recommendations based on ingredients
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a culinary expert who provides recipe recommendations based on available ingredients. Create recipes that maximize the ingredients provided and keep suggestions practical. Return a JSON object with a 'recipes' array. Each recipe should have: title, description, instructions (step by step), imageUrl (leave empty string), prepTime (realistic estimate in minutes), calories (realistic estimate per serving)."
          },
          {
            role: "user",
            content: `I have these ingredients: ${data.ingredients.join(", ")}. ${data.diet && data.diet !== 'none' ? `Please suggest ${data.diet} recipes only.` : ""} Suggest 3 diverse recipes I can make with these ingredients. Provide detailed cooking instructions.`
          }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the JSON response
      const recipesResult = JSON.parse(response.choices[0].message.content);
      
      if (!recipesResult.recipes || !Array.isArray(recipesResult.recipes)) {
        throw new Error("Invalid response format from AI");
      }
      
      // Store recipe recommendations in memory
      const storedRecipes = await Promise.all(
        recipesResult.recipes.map((recipe: any) => 
          storage.addRecipe({
            title: recipe.title,
            description: recipe.description,
            instructions: recipe.instructions,
            imageUrl: recipe.imageUrl || "",
            prepTime: recipe.prepTime || 30,
            calories: recipe.calories || 300,
            saved: false
          })
        )
      );

      res.json(storedRecipes);
    } catch (error) {
      console.error("Recipe recommendation error:", error);
      res.status(500).json({ message: "Failed to get recipe recommendations" });
    }
  });

  app.get("/api/recipes", async (req, res) => {
    try {
      const recipes = await storage.getAllRecipes();
      res.json(recipes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipes" });
    }
  });

  app.get("/api/recipes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      res.json(recipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recipe" });
    }
  });

  app.patch("/api/recipes/:id/save", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recipe = await storage.getRecipe(id);
      if (!recipe) {
        return res.status(404).json({ message: "Recipe not found" });
      }
      
      const updatedRecipe = await storage.updateRecipe(id, {
        ...recipe,
        saved: !recipe.saved
      });
      
      res.json(updatedRecipe);
    } catch (error) {
      res.status(500).json({ message: "Failed to update recipe" });
    }
  });
  
  // Recipe Analysis API - Detailed nutritional analysis using OpenAI
  app.post("/api/recipe-analysis", async (req, res) => {
    try {
      const { title, ingredients } = req.body;
      
      if (!title || !ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ message: "Invalid request. Title and ingredients array are required." });
      }
      
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a nutrition expert who analyzes recipes and provides accurate nutritional information. Return detailed nutritional analysis in JSON format."
          },
          {
            role: "user",
            content: `Analyze this recipe: "${title}" with ingredients: ${ingredients.join(", ")}. 
            Provide a nutritional breakdown including calories, protein, carbs, fat, fiber, sodium, 
            vitamins, and minerals. Also include information about potential allergens and dietary 
            considerations. Format as JSON.`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      // Parse the JSON response
      const analysis = JSON.parse(response.choices[0].message.content);
      
      res.json(analysis);
    } catch (error) {
      console.error("Recipe analysis error:", error);
      res.status(500).json({ message: "Failed to analyze recipe" });
    }
  });

  // Grocery List API
  app.get("/api/grocery-items", async (req, res) => {
    try {
      const userId = 1; // For now, use a default user ID
      const groceryItems = await storage.getUserGroceryItems(userId);
      res.json(groceryItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch grocery items" });
    }
  });

  app.post("/api/grocery-items", async (req, res) => {
    try {
      const userId = 1; // For now, use a default user ID
      const data = { ...req.body, userId };
      const validatedData = insertGroceryItemSchema.parse(data);
      const groceryItem = await storage.addGroceryItem(validatedData);
      res.status(201).json(groceryItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid grocery item data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to add grocery item" });
      }
    }
  });

  app.patch("/api/grocery-items/:id/toggle", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const groceryItem = await storage.getGroceryItem(id);
      if (!groceryItem) {
        return res.status(404).json({ message: "Grocery item not found" });
      }
      
      const updatedItem = await storage.updateGroceryItem(id, {
        ...groceryItem,
        completed: !groceryItem.completed
      });
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update grocery item" });
    }
  });

  app.delete("/api/grocery-items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.removeGroceryItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove grocery item" });
    }
  });

  // Nutrition API
  app.get("/api/nutrition", async (req, res) => {
    try {
      const userId = 1; // For now, use a default user ID
      const date = req.query.date as string || new Date().toISOString().split('T')[0];
      const nutritionData = await storage.getNutritionData(userId, date);
      
      // If no data exists for this date, return default data
      if (!nutritionData) {
        return res.json({
          userId,
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          caloriesGoal: 2000,
          proteinGoal: 90,
          carbsGoal: 200,
          fatGoal: 60
        });
      }
      
      res.json(nutritionData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch nutrition data" });
    }
  });

  app.post("/api/nutrition", async (req, res) => {
    try {
      const userId = 1; // For now, use a default user ID
      const data = { ...req.body, userId };
      const validatedData = insertNutritionDataSchema.parse(data);
      
      // Check if data for this date already exists
      const existingData = await storage.getNutritionData(userId, validatedData.date);
      
      let nutritionData;
      if (existingData) {
        // Update existing data
        nutritionData = await storage.updateNutritionData(existingData.id, validatedData);
      } else {
        // Create new data
        nutritionData = await storage.addNutritionData(validatedData);
      }
      
      res.status(201).json(nutritionData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid nutrition data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save nutrition data" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
