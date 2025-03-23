import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertIngredientSchema,
  insertGroceryItemSchema,
  recipeRecommendationRequestSchema,
  insertRecipeSchema,
  insertNutritionDataSchema,
  imageScanRequestSchema
} from "../shared/schema";
import { nebiusClient } from "./nebius";

console.log("Nebius API Key available:", !!process.env.NEBIUS_API_KEY);

export async function registerRoutes(app: Express): Promise<Server> {
  // Image Scan API - Scan ingredients from an image
  app.post("/api/scan-ingredients", async (req, res) => {
    try {
      const data = imageScanRequestSchema.parse(req.body);

      if (!nebiusClient) {
        return res.status(500).json({ 
          message: "Image scanning service is not available - Nebius API key not configured"
        });
      }

      if (!nebiusClient) {
        return res.status(500).json({ 
          message: "Image scanning service is not available - Nebius API key not configured"
        });
      }

      try {
        console.log("Scanning image with Nebius...");
        if (!data.image || data.image.length < 100) {
          return res.status(400).json({
            message: "Please provide a valid image. The image data appears to be missing or corrupted."
          });
        }

        const nebiusResult = await nebiusClient.analyzeImage(data.image);

        if (!nebiusResult || !nebiusResult.labels || !Array.isArray(nebiusResult.labels)) {
          throw new Error("Invalid response format from Nebius API");
        }

        // Process Nebius result
        const ingredients = nebiusResult.labels
          .filter((label: any) => label.confidence > 0.7)
          .map((label: any) => label.name);

        // Add the identified ingredients to the user's pantry
        const userId = 1; // For now, use a default user ID
        const addedIngredients = await Promise.all(
          ingredients.map(async (name: string) => {
            return await storage.addIngredient({ name, userId });
          })
        );

        res.json({ 
          ingredients,
          added: addedIngredients,
          provider: "nebius" 
        });
      } catch (nebiusError) {
        console.error("Nebius API error in image scanning:", nebiusError);
        res.status(500).json({ 
          message: "We couldn't process the image. Please try again with a clearer photo.",
          details: "The image recognition service encountered an error. Try a different photo."
        });
      }
    } catch (error) {
      console.error("Image scanning error:", error);
      res.status(400).json({ message: "Invalid image data" });
    }
  });

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
      const { name } = req.body;
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Invalid ingredient name' });
      }

      const result = await nebiusClient?.addIngredient(name) || { id: Date.now(), name };
      storage.ingredients.push(result);
      res.json(result);
    } catch (error) {
      console.error('Error adding ingredient:', error);
      res.status(500).json({ error: 'Failed to add ingredient' });
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

  // Sample recipes for fallback when API is unavailable
  const getSampleRecipesForIngredients = async (ingredients: string[], diet?: string, mealType?: string) => {
    // Basic recipes that can be made with common ingredients
    const sampleRecipes = [
      {
        title: "Chicken Stir-Fry with Rice and Vegetables",
        description: "A quick and easy stir-fry using chicken, rice, and fresh vegetables.",
        instructions: "1. Cook rice according to package instructions.\n2. Dice chicken into 1-inch cubes.\n3. Heat olive oil in a large pan or wok over medium-high heat.\n4. Add chicken and cook until no longer pink, about 5-7 minutes.\n5. Add diced bell peppers, onions, and minced garlic.\n6. Cook for 3-4 minutes until vegetables begin to soften.\n7. Add broccoli and cook for another 3 minutes.\n8. Season with salt, pepper, and your favorite stir-fry sauce.\n9. Serve hot over cooked rice.",
        imageUrl: "",
        prepTime: 30,
        calories: 450,
        saved: false,
        mealType: "dinner",
        ingredients: ["Chicken", "Rice", "Bell Peppers", "Onions", "Garlic", "Olive oil", "Broccoli"]
      },
      {
        title: "Mediterranean Rice Bowl",
        description: "A flavorful bowl combining rice, vegetables, and herbs for a healthy meal.",
        instructions: "1. Cook rice until fluffy and set aside.\n2. Sauté diced bell peppers, onions, and garlic in olive oil until soft.\n3. Season with salt, pepper, oregano, and a pinch of red pepper flakes.\n4. Add diced vegetables of your choice (broccoli works well).\n5. Cook for 5 more minutes until all vegetables are tender.\n6. Serve the vegetable mixture over rice.\n7. Drizzle with additional olive oil and lemon juice if available.",
        imageUrl: "",
        prepTime: 25,
        calories: 380,
        saved: false,
        mealType: "lunch",
        ingredients: ["Rice", "Bell Peppers", "Onions", "Garlic", "Olive oil", "Broccoli"]
      },
      {
        title: "Garlic Chicken with Roasted Vegetables",
        description: "Tender garlic chicken served with a medley of oven-roasted vegetables.",
        instructions: "1. Preheat oven to 425°F (220°C).\n2. Season chicken pieces with salt, pepper, and minced garlic.\n3. Cut bell peppers, onions, and broccoli into even-sized pieces.\n4. Toss vegetables with olive oil, salt, and pepper.\n5. Place chicken and vegetables on a baking sheet.\n6. Roast for 25-30 minutes, turning once halfway through.\n7. Check that chicken reaches 165°F (74°C) internal temperature.\n8. Serve chicken with roasted vegetables and cooked rice.",
        imageUrl: "",
        prepTime: 40,
        calories: 410,
        saved: false,
        mealType: "dinner",
        ingredients: ["Chicken", "Garlic", "Bell Peppers", "Onions", "Olive oil", "Broccoli"]
      }
    ];

    // Filter recipes by meal type if specified
    let filteredRecipes = sampleRecipes;
    if (mealType && mealType !== 'any') {
      filteredRecipes = sampleRecipes.filter(recipe => recipe.mealType === mealType);

      // If no recipes match the meal type, return at least one with adjusted meal type
      if (filteredRecipes.length === 0) {
        filteredRecipes = [
          {
            ...sampleRecipes[0],
            mealType: mealType
          }
        ];
      }
    }

    // Store recipe recommendations in memory
    const storedRecipes = await Promise.all(
      filteredRecipes.map((recipe) => 
        storage.addRecipe({
          title: recipe.title,
          description: recipe.description,
          instructions: recipe.instructions,
          imageUrl: recipe.imageUrl || "",
          prepTime: recipe.prepTime || 30,
          calories: recipe.calories || 300,
          saved: false,
          mealType: recipe.mealType || "any",
          ingredients: recipe.ingredients || ingredients
        })
      )
    );

    return storedRecipes;
  };

  // Recipe API
  app.post("/api/recipe-recommendations", async (req, res) => {
    try {
      const data = recipeRecommendationRequestSchema.parse(req.body);

      // Try using Nebius first if available
      if (nebiusClient) {
        try {
          console.log("Using Nebius for recipe recommendations...");

          const preferences = {
            diet: data.diet || "none",
            mealType: data.mealType || "any"
          };

          const nebiusResult = await nebiusClient.getRecipeRecommendations(data.ingredients, preferences);

          if (nebiusResult && nebiusResult.recipes && Array.isArray(nebiusResult.recipes)) {
            // Store recipe recommendations from Nebius in memory
            const storedRecipes = await Promise.all(
              nebiusResult.recipes.map((recipe: any) => 
                storage.addRecipe({
                  title: recipe.title,
                  description: recipe.description || `A delicious ${recipe.mealType} recipe using ${recipe.ingredients.slice(0, 3).join(", ")}`,
                  instructions: recipe.instructions,
                  imageUrl: recipe.imageUrl || "",
                  prepTime: recipe.prepTime || 30,
                  calories: recipe.calories || 300,
                  saved: false,
                  mealType: recipe.mealType || "any",
                  ingredients: recipe.ingredients || data.ingredients
                })
              )
            );

            res.json({
              recipes: storedRecipes,
              provider: "nebius"
            });
            return;
          }
        } catch (nebiusError) {
          console.error("Nebius API error in recipe recommendations:", nebiusError);
          // Fall back to OpenAI - continue with OpenAI code below
          console.log("Falling back to OpenAI for recipe recommendations...");
        }
      }

      // Fallback to OpenAI if Nebius is not available or fails
      try {
        // Use OpenAI to generate recipe recommendations based on ingredients
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a culinary expert who provides recipe recommendations based on available ingredients. Create recipes that maximize the ingredients provided and keep suggestions practical. Return a JSON object with a 'recipes' array. Each recipe should have: title, description, instructions (step by step), imageUrl (leave empty string), prepTime (realistic estimate in minutes), calories (realistic estimate per serving), ingredients (array of ingredients used in the recipe), mealType (one of: breakfast, lunch, dinner, brunch, snack, or any)."
            },
            {
              role: "user",
              content: `I have these ingredients: ${data.ingredients.join(", ")}. 
              ${data.diet && data.diet !== 'none' ? `Please suggest ${data.diet} recipes only.` : ""} 
              ${data.mealType && data.mealType !== 'any' ? `I'm looking for ${data.mealType} recipes.` : ""}
              Suggest 3 diverse recipes I can make with these ingredients. 
              Provide detailed cooking instructions. 
              Make sure to list which specific ingredients from my list are used in each recipe.`
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
              saved: false,
              mealType: recipe.mealType || "any",
              ingredients: recipe.ingredients || data.ingredients
            })
          )
        );

        res.json({
          recipes: storedRecipes,
          provider: "openai"
        });
      } catch (openaiError: unknown) {
        console.error("OpenAI API error:", openaiError);
        // Fallback to sample recipes if OpenAI API fails
        console.log("Using fallback sample recipes due to OpenAI API issue.");
        const fallbackRecipes = await getSampleRecipesForIngredients(data.ingredients, data.diet, data.mealType);
        res.json({
          recipes: fallbackRecipes,
          provider: "fallback"
        });
      }
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

  // Sample recipe analysis for fallback when API is unavailable
  const getSampleRecipeAnalysis = (title: string, ingredients: string[]) => {
    // Return a generic nutritional analysis
    return {
      "nutritionalInfo": {
        "calories": 450,
        "protein": 35,
        "carbs": 45,
        "fat": 15,
        "fiber": 8,
        "sodium": 500,
        "vitamins": [
          { "name": "Vitamin A", "amount": "15% DV" },
          { "name": "Vitamin C", "amount": "30% DV" },
          { "name": "Vitamin D", "amount": "0% DV" },
          { "name": "Vitamin E", "amount": "10% DV" }
        ],
        "minerals": [
          { "name": "Iron", "amount": "15% DV" },
          { "name": "Calcium", "amount": "10% DV" },
          { "name": "Potassium", "amount": "20% DV" },
          { "name": "Magnesium", "amount": "12% DV" }
        ]
      },
      "allergens": [
        "This recipe may contain common allergens depending on exact ingredients used."
      ],
      "dietaryConsiderations": {
        "isVegetarian": !ingredients.some(i => 
          i.toLowerCase().includes("meat") || 
          i.toLowerCase().includes("chicken") || 
          i.toLowerCase().includes("beef") || 
          i.toLowerCase().includes("pork") || 
          i.toLowerCase().includes("fish")),
        "isVegan": !ingredients.some(i => 
          i.toLowerCase().includes("meat") || 
          i.toLowerCase().includes("chicken") || 
          i.toLowerCase().includes("beef") || 
          i.toLowerCase().includes("pork") || 
          i.toLowerCase().includes("fish") ||
          i.toLowerCase().includes("milk") || 
          i.toLowerCase().includes("cheese") || 
          i.toLowerCase().includes("egg")),
        "isGlutenFree": !ingredients.some(i => 
          i.toLowerCase().includes("wheat") || 
          i.toLowerCase().includes("flour") || 
          i.toLowerCase().includes("bread") || 
          i.toLowerCase().includes("pasta")),
        "notes": "This is an estimated analysis. For precise nutritional information, consult with a registered dietitian."
      }
    };
  };

  // Recipe Analysis API - Detailed nutritional analysis using OpenAI
  app.post("/api/recipe-analysis", async (req, res) => {
    try {
      const { title, ingredients } = req.body;

      if (!title || !ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ message: "Invalid request. Title and ingredients array are required." });
      }

      try {
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
      } catch (openaiError) {
        console.error("OpenAI API error in recipe analysis:", openaiError);
        // Fallback to sample analysis if OpenAI API fails
        console.log("Using fallback sample recipe analysis due to OpenAI API issue.");
        const fallbackAnalysis = getSampleRecipeAnalysis(title, ingredients);
        res.json(fallbackAnalysis);
      }
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

  // API Service Config
  app.get("/api/service-info", async (_req, res) => {
    try {
      // Provide information about which services are available
      res.json({
        services: {
          openai: !!process.env.OPENAI_API_KEY,
          nebius: !!process.env.NEBIUS_API_KEY
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch service information" });
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