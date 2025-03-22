import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Recipes from "@/pages/Recipes";
import MealPlan from "@/pages/MealPlan";
import GroceryList from "@/pages/GroceryList";
import Nutrition from "@/pages/Nutrition";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";

function Router() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-beige-light font-sans">
      <Header currentPath={location} />
      <main className="flex-1 container mx-auto px-4 py-6">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/recipes" component={Recipes} />
          <Route path="/meal-plan" component={MealPlan} />
          <Route path="/grocery-list" component={GroceryList} />
          <Route path="/nutrition" component={Nutrition} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <BottomNavigation currentPath={location} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
