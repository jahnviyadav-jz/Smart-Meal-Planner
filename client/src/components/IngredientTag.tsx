interface IngredientTagProps {
  name: string;
  onRemove: () => void;
}

export default function IngredientTag({ name, onRemove }: IngredientTagProps) {
  return (
    <span className="ingredient-tag">
      {name}
      <button className="ml-1" onClick={onRemove}>
        <span className="material-icons text-xs">close</span>
      </button>
    </span>
  );
}
