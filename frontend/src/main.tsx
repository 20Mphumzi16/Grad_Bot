
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { LoadingProvider } from "./components/ui/loading";
  import { ThemeProvider } from "./context/ThemeContext";

  createRoot(document.getElementById("root")!).render(
    <ThemeProvider>
      <LoadingProvider>
        <App />
      </LoadingProvider>
    </ThemeProvider>
  );
  