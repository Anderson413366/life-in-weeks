import React from "react";
import ReactDOM from "react-dom/client";
import { inject } from "@vercel/analytics";
import App from "./App";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

inject();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for PWA
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
