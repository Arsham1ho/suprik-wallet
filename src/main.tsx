
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import "./styles/globals.css";
  import { initializeApiKeys } from "./utils/env";

  // Initialize API keys (migrate legacy keys and populate cache) before rendering
  // This ensures the app doesn't show the API key setup screen incorrectly
  initializeApiKeys().then(() => {
    createRoot(document.getElementById("root")!).render(<App />);
  });
  