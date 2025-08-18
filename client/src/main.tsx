import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ReduxProvider } from "@/store/reduxProvider";

createRoot(document.getElementById("root")!).render(
  <ReduxProvider>
    <App />
  </ReduxProvider>
);
