import { Link } from "wouter";
import { useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export default function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState({ name: '', image: '' });

  const handleLogin = () => {
    // Implement authentication logic here
    setIsAuthenticated(true);
    setUser({ name: 'User', image: '' });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser({ name: '', image: '' });
  };

  return (
    <header className="border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <nav className="flex gap-6">
            <Link href="/">
              <a className="text-lg font-semibold">Meal Planner</a>
            </Link>
            <Link href="/ingredients">
              <a className="nav-link">Ingredients</a>
            </Link>
            <Link href="/recipes">
              <a className="nav-link">Recipes</a>
            </Link>
            <Link href="/plan">
              <a className="nav-link">Plan</a>
            </Link>
            <Link href="/nutrition">
              <a className="nav-link">Nutrition</a>
            </Link>
          </nav>

          <div>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image} alt={user.name} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={handleLogin}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}