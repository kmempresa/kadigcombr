import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Capacitor } from "@capacitor/core";

async function initOneSignal() {
  // Só roda no app nativo (iOS/Android)
  if (!Capacitor.isNativePlatform()) return;

  const OneSignal = (window as any).OneSignal;
  if (!OneSignal) {
    console.log("OneSignal plugin não encontrado.");
    return;
  }

  const ONESIGNAL_APP_ID = "987f4a6e-8011-446c-9f4d-c575b7faf950";

  // Inicializa
  OneSignal.setAppId(ONESIGNAL_APP_ID);

  // Isso faz aparecer o pop-up de permissão no iPhone
  OneSignal.promptForPushNotificationsWithUserResponse((accepted: boolean) => {
    console.log("Permissão push:", accepted);
  });

  // Debug: mostra se gerou playerId / token
  OneSignal.getDeviceState((state: any) => {
    console.log("OneSignal DeviceState:", state);
  });
}

initOneSignal();

createRoot(document.getElementById("root")!).render(<App />);
