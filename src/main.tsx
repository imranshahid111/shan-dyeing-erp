import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { loadRuntimeConfig } from "./app/config/loadRuntimeConfig";
import { initApiClient } from "./app/services/apiClient";

async function bootstrap() {
  await loadRuntimeConfig();
  await initApiClient();
  createRoot(document.getElementById("root")!).render(<App />);
}

bootstrap();

  