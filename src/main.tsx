import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const themeStorageKey = "sine-shin-theme";
try {
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  if (savedTheme === "dark" || savedTheme === "light") {
    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }
} catch {
  document.documentElement.classList.remove("dark");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
