import { useEffect } from "react";
import { initOneSignal, isOneSignalConfigured } from "@/features/notifications/onesignal";

export function OneSignalBootstrap() {
  useEffect(() => {
    if (!isOneSignalConfigured) {
      return;
    }

    void initOneSignal();
  }, []);

  return null;
}
