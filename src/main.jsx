import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

if (typeof window !== "undefined") {
  window.__FNP_BUILD_INFO__ = {
    version: __APP_VERSION__,
    buildDate: __BUILD_DATE__,
    commitHash: __COMMIT_HASH__,
  };
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
