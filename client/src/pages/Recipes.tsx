import { useQuery } from "@tanstack/react-query";
import { Recipe } from "@shared/schema";
import RecipeCard from "@/components/RecipeCard";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Recipes() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Fetch recipes
  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ["/api/recipes"],
  });

  // Filter recipes based on search term and active filter
  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === "all") return matchesSearch;
    if (activeFilter === "saved") return matchesSearch && recipe.saved;
    
    // Filter by cuisine type, preparation time, etc. could be added here
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold mb-6">Recipes</h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-lg"
            />
            {searchTerm && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                onClick={() => setSearchTerm("")}
              >
                <span className="material-icons">close</span>
              </button>
            )}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button 
              variant={activeFilter === "all" ? "default" : "outline"}
              onClick={() => setActiveFilter("all")}
              className="rounded-full"
            >
              All
            </Button>
            <Button 
              variant={activeFilter === "saved" ? "default" : "outline"}
              onClick={() => setActiveFilter("saved")}
              className="rounded-full"
            >
              <span className="material-icons text-sm mr-1">bookmark</span>
              Saved
            </Button>
            <Button 
              variant={activeFilter === "quick" ? "default" : "outline"}
              onClick={() => setActiveFilter("quick")}
              className="rounded-full"
            >
              <span className="material-icons text-sm mr-1">schedule</span>
              Quick
            </Button>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="h-[280px]" />
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <Card className="p-8 text-center">
            <span className="material-icons text-4xl text-muted-foreground mb-2">restaurant</span>
            <h3 className="text-lg font-medium mb-1">No recipes found</h3>
            <p className="text-muted-foreground">
              {searchTerm 
                ? "Try adjusting your search or filters." 
                : "Add ingredients and find recipes on the home page."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} extended />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
