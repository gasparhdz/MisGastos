import { useEffect } from "react";
import { initOneSignal, isOneSignalConfigured, logPushBootstrap } from "@/features/notifications/onesignal";

export function OneSignalBootstrap() {
  useEffect(() => {
    logPushBootstrap("OneSignalBootstrap montado");

    if (!isOneSignalConfigured) {
      logPushBootstrap("Bootstrap omitido — VITE_ONESIGNAL_APP_ID no configurada");
      return;
    }

    void initOneSignal();
  }, []);

  return null;
}
