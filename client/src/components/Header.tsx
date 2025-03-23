import { Link } from "wouter";
import { useState } from "react";

interface HeaderProps {
  currentPath: string;
}

export default function Header({ currentPath }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Recipes", path: "/recipes" },
    { name: "Meal Plan", path: "/meal-plan" },
    { name: "Grocery List", path: "/grocery-list" },
    { name: "Nutrition", path: "/nutrition" },
  ];

  return (
    <header className="glass-effect sticky top-0 z-50 border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <span className="material-icons text-primary mr-2">restaurant_menu</span>
          <h1 className="text-3xl font-bold gradient-text">Smart Meal Planner</h1>
        </div>
        <div className="flex items-center">
          <button className="p-2" aria-label="Notifications">
            <span className="material-icons text-muted-foreground">notifications_none</span>
          </button>
          <button className="p-2" aria-label="User profile">
            <span className="material-icons text-muted-foreground">account_circle</span>
          </button>
          <button
            className="p-2 sm:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="material-icons text-muted-foreground">
              {menuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden bg-white border-b border-gray-200 absolute w-full z-50">
          <nav className="flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMenuOpen(false)}
              >
                <a className={`px-4 py-3 ${
                  currentPath === item.path
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                }`}>
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="bg-white border-b border-gray-200 hidden sm:block">
        <div className="container mx-auto">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
              >
                <a className={`px-4 py-3 ${
                  currentPath === item.path
                    ? "text-primary border-b-2 border-primary font-medium"
                    : "text-muted-foreground font-medium"
                }`}>
                  {item.name}
                </a>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}