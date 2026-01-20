
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/globals.css";
  import { LoadingProvider } from "./components/ui/loading";
  import { ThemeProvider } from "./context/ThemeContext";
  import { Toaster } from "sonner";
 
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <LoadingProvider>
        <App />
        <Toaster
        position="top-right"
        richColors
        closeButton
      />

  
      </LoadingProvider>
    </ThemeProvider>
 
  )