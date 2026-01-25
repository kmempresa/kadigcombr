import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import OneSignal from "react-onesignal";

async function initOneSignal() {
  // Só inicializa no app nativo (Capacitor)
  if (!(window as any).Capacitor?.isNativePlatform?.()) return;

  await OneSignal.init({
    appId: "987f4a6e-8011-446c-9f4d-c575b7faf950",
    allowLocalhostAsSecureOrigin: true,
  });

  // pede permissão do iOS
  await OneSignal.Slidedown.promptPush();
}

initOneSignal();

createRoot(document.getElementById("root")!).render(<App />);
