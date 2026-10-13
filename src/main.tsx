import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "motion/react";
import { StoreProvider } from "./lib/store";
import App from "./App";
import "./styles.css";

const app = (
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <StoreProvider>
          <App />
        </StoreProvider>
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>
);

const root = document.getElementById("root")!;
const here = window.location.pathname.replace(/\/+$/, "") || "/";

// Prerendered pages are stamped with the path they were built for. Hydrate only
// when that is exactly what is being shown; a filtered URL or a fallback page
// gets a clean client render instead of a mismatched hydration.
if (root.dataset.prerendered === here && !window.location.search) {
  hydrateRoot(root, app);
} else {
  root.replaceChildren();
  createRoot(root).render(app);
}
