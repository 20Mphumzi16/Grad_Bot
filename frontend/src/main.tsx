
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { LoadingProvider } from "./components/ui/loading";

  createRoot(document.getElementById("root")!).render(
    <LoadingProvider>
      <App />
    </LoadingProvider>
  );
  