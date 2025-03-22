import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroceryItem } from "@shared/schema";

export default function GroceryList() {
  const [newItem, setNewItem] = useState("");
  const { toast } = useToast();

  // Fetch grocery items
  const { data: groceryItems = [], isLoading } = useQuery<GroceryItem[]>({
    queryKey: ["/api/grocery-items"],
  });

  // Add grocery item mutation
  const addGroceryItemMutation = useMutation({
    mutationFn: (name: string) => 
      apiRequest("POST", "/api/grocery-items", { 
        name,
        category: getCategoryForItem(name),
        completed: false,
      }),
    onSuccess: () => {
      setNewItem("");
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-items"] });
      toast({
        title: "Item added",
        description: "Your item has been added to the grocery list.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to add item",
        description: "There was an error adding your grocery item.",
        variant: "destructive",
      });
    },
  });

  // Toggle grocery item completion
  const toggleGroceryItemMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("PATCH", `/api/grocery-items/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-items"] });
    },
    onError: () => {
      toast({
        title: "Failed to update item",
        description: "There was an error updating your grocery item.",
        variant: "destructive",
      });
    },
  });

  // Remove grocery item
  const removeGroceryItemMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/grocery-items/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grocery-items"] });
    },
    onError: () => {
      toast({
        title: "Failed to remove item",
        description: "There was an error removing your grocery item.",
        variant: "destructive",
      });
    },
  });

  // Handle adding grocery item
  const handleAddItem = () => {
    if (newItem.trim()) {
      addGroceryItemMutation.mutate(newItem.trim());
    }
  };

  // Handle key press for grocery item input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    }
  };

  // Group grocery items by category
  const groupedItems = groceryItems.reduce<Record<string, GroceryItem[]>>((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  // Helper function to determine category for grocery item
  function getCategoryForItem(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("chicken") || lowerName.includes("beef") || lowerName.includes("fish") || lowerName.includes("meat")) {
      return "Protein";
    } else if (lowerName.includes("broccoli") || lowerName.includes("carrot") || lowerName.includes("lettuce") || lowerName.includes("vegetable")) {
      return "Vegetable";
    } else if (lowerName.includes("rice") || lowerName.includes("pasta") || lowerName.includes("bread") || lowerName.includes("flour")) {
      return "Grain";
    } else if (lowerName.includes("salt") || lowerName.includes("pepper") || lowerName.includes("spice") || lowerName.includes("herb")) {
      return "Seasoning";
    } else {
      return "Other";
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Grocery List</h1>
          <div className="space-x-2">
            <Button variant="outline">
              <span className="material-icons mr-2">share</span>
              Share
            </Button>
            <Button variant="outline">
              <span className="material-icons mr-2">print</span>
              Print
            </Button>
          </div>
        </div>
        
        <Card className="p-5 mb-6">
          <div className="flex mb-6">
            <div className="relative flex-1">
              <Input 
                type="text" 
                placeholder="Add item to list" 
                className="w-full px-4 py-2 pr-10 rounded-lg"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-primary"
                onClick={handleAddItem}
                disabled={addGroceryItemMutation.isPending}
              >
                <span className="material-icons">add_circle_outline</span>
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded" />
              ))}
            </div>
          ) : groceryItems.length === 0 ? (
            <div className="text-center py-8">
              <span className="material-icons text-4xl text-muted-foreground mb-2">shopping_cart</span>
              <h3 className="text-lg font-medium mb-1">Your grocery list is empty</h3>
              <p className="text-muted-foreground">Add items using the input above.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category}>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">{category}</h3>
                  <div className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <div key={item.id} className="py-3 flex items-center justify-between">
                        <label className="checkbox-container flex items-center">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={item.completed}
                            onChange={() => toggleGroceryItemMutation.mutate(item.id)}
                          />
                          <span className="checkmark w-5 h-5 mr-3 border border-gray-300 rounded-sm inline-block relative"></span>
                          <span className={item.completed ? "line-through text-gray-400" : ""}>
                            {item.name}
                          </span>
                        </label>
                        <button 
                          className="text-gray-400"
                          onClick={() => removeGroceryItemMutation.mutate(item.id)}
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        
        <div className="flex justify-between">
          <Button variant="outline" color="destructive">
            <span className="material-icons mr-2">delete</span>
            Clear Completed
          </Button>
          <Button>
            <span className="material-icons mr-2">add_shopping_cart</span>
            Add from Recipes
          </Button>
        </div>
      </section>
    </div>
  );
}
