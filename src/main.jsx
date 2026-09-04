import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

if (typeof window !== "undefined") {
  window.__FNP_BUILD_INFO__ = {
    version: __APP_VERSION__,
    buildDate: __BUILD_DATE__,
    commitHash: __COMMIT_HASH__,
  };
}

const root = document.getElementById("root");
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
