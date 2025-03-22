import { useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Recipe } from "@shared/schema";

interface RecipeCardProps {
  recipe: Recipe;
  extended?: boolean;
}

export default function RecipeCard({ recipe, extended = false }: RecipeCardProps) {
  // Toggle save recipe mutation
  const saveRecipeMutation = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/recipes/${recipe.id}/save`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recipes"] });
    },
  });

  // Default recipe image if none provided
  const defaultImage = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&h=300&q=80";
  
  if (extended) {
    return (
      <Card className="flex flex-col h-full overflow-hidden">
        <div className="h-48 relative">
          <img 
            src={recipe.imageUrl || defaultImage}
            alt={recipe.title} 
            className="h-full w-full object-cover"
          />
          <button 
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow"
            onClick={() => saveRecipeMutation.mutate()}
          >
            <span className="material-icons text-accent">
              {recipe.saved ? "bookmark" : "bookmark_border"}
            </span>
          </button>
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h4 className="font-medium text-lg mb-1">{recipe.title}</h4>
          <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
          <div className="flex items-center text-sm text-muted-foreground mt-auto">
            <span className="material-icons text-sm mr-1">schedule</span>
            <span>{recipe.prepTime} mins</span>
            <span className="mx-2">•</span>
            <span className="material-icons text-sm mr-1">local_fire_department</span>
            <span>{recipe.calories} cal</span>
          </div>
        </div>
        <div className="px-4 pb-4 pt-1 flex justify-between">
          <Button variant="link" className="text-primary font-medium text-sm p-0">
            View Recipe
          </Button>
          <Button variant="ghost" size="sm">
            <span className="material-icons">add_shopping_cart</span>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="min-w-[250px] max-w-[250px] bg-white rounded-xl shadow-custom flex flex-col">
      <img 
        src={recipe.imageUrl || defaultImage}
        alt={recipe.title} 
        className="h-32 w-full object-cover rounded-t-xl"
      />
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-medium mb-1">{recipe.title}</h4>
        <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
        <div className="flex items-center text-sm text-muted-foreground mt-auto">
          <span className="material-icons text-sm mr-1">schedule</span>
          <span>{recipe.prepTime} mins</span>
          <span className="mx-2">•</span>
          <span className="material-icons text-sm mr-1">local_fire_department</span>
          <span>{recipe.calories} cal</span>
        </div>
      </div>
      <div className="px-4 pb-4 pt-1 flex justify-between">
        <Button variant="link" className="text-primary font-medium text-sm p-0">
          View Recipe
        </Button>
        <button 
          className="text-muted-foreground"
          onClick={() => saveRecipeMutation.mutate()}
          disabled={saveRecipeMutation.isPending}
        >
          <span className="material-icons">
            {recipe.saved ? "bookmark" : "bookmark_border"}
          </span>
        </button>
      </div>
    </div>
  );
}
