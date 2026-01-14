
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { LoadingProvider } from "./components/ui/loading";
  import { Toaster } from "./components/ui/sonner";

  createRoot(document.getElementById("root")!).render(
    <LoadingProvider>
      <App />
      <Toaster />
    </LoadingProvider>
  );
  