import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add custom styles for ingredient tags and other elements
const style = document.createElement('style');
style.textContent = `
  body {
    font-family: 'Poppins', sans-serif;
  }
  
  .progress-ring-circle {
    transition: stroke-dashoffset 0.35s;
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
  }
  
  .checkbox-container input:checked ~ .checkmark {
    background-color: #4CAF50;
  }
  
  .checkbox-container input:checked ~ .checkmark:after {
    display: block;
  }
  
  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 9px;
    top: 5px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
  
  .ingredient-tag {
    background-color: #F0F7ED;
    color: #4CAF50;
    border-radius: 999px;
    padding: 0.35rem 0.75rem;
    margin-right: 0.5rem;
    margin-bottom: 0.5rem;
    display: inline-flex;
    align-items: center;
    font-size: 0.875rem;
    font-weight: 500;
  }
`;
document.head.appendChild(style);

createRoot(document.getElementById("root")!).render(<App />);
