import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  activatePushNotifications,
  getActivationErrorMessage,
  getInitError,
  getPermissionStillDefaultMessage,
  getPushNotificationDebugState,
  getPushNotificationStatus,
  getWebPushSetupMessage,
  initOneSignal,
  isOneSignalConfigured,
  isOneSignalReady,
  loginOneSignalUser,
  logoutOneSignalUser,
  OneSignal,
  requestBrowserPushPermission,
} from "@/features/notifications/onesignal";
import type { PushNotificationStatus } from "@/features/notifications/types";

const LOG_PREFIX = "[MisGastos:Push]";

export function usePushNotifications() {
  const { user, userId } = useAuth();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PushNotificationStatus>(
    isOneSignalConfigured ? "pending" : "unconfigured",
  );

  const refreshStatus = useCallback(() => {
    const nextStatus = getPushNotificationStatus();
    setStatus(nextStatus);
    console.info(LOG_PREFIX, "Estado actualizado", getPushNotificationDebugState());
    return nextStatus;
  }, []);

  useEffect(() => {
    if (!isOneSignalConfigured) {
      refreshStatus();
      return;
    }

    let cancelled = false;

    void initOneSignal().then((initialized) => {
      if (cancelled) {
        return;
      }

      setReady(initialized);
      refreshStatus();
    });

    return () => {
      cancelled = true;
    };
  }, [refreshStatus]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (userId) {
      void loginOneSignalUser(userId).then(refreshStatus);
      return;
    }

    void logoutOneSignalUser().then(refreshStatus);
  }, [ready, userId, refreshStatus]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    const handlePermissionChange = () => {
      refreshStatus();
    };

    const handleSubscriptionChange = () => {
      refreshStatus();
    };

    OneSignal.Notifications.addEventListener("permissionChange", handlePermissionChange);
    OneSignal.User.PushSubscription.addEventListener("change", handleSubscriptionChange);

    return () => {
      OneSignal.Notifications.removeEventListener("permissionChange", handlePermissionChange);
      OneSignal.User.PushSubscription.removeEventListener("change", handleSubscriptionChange);
    };
  }, [ready, refreshStatus]);

  const handleActivateClick = useCallback(async () => {
    const authUserId = user?.id ?? userId;

    if (!authUserId) {
      window.alert("No hay usuario autenticado. Volvé a iniciar sesión.");
      return;
    }

    setLoading(true);

    try {
      if (!isOneSignalReady()) {
        const initializedOk = await initOneSignal();
        refreshStatus();

        if (!initializedOk) {
          throw new Error(getInitError() ?? "OneSignal no inicializó");
        }
      }

      setReady(true);

      const nativePermission = await requestBrowserPushPermission();
      refreshStatus();

      if (nativePermission === "denied") {
        window.alert("Las notificaciones están bloqueadas. Habilitalas en la configuración del navegador.");
        return;
      }

      if (nativePermission === "default") {
        window.alert(getPermissionStillDefaultMessage());
        return;
      }

      try {
        await OneSignal.Notifications.requestPermission();
      } catch (onesignalPermissionError) {
        console.error(LOG_PREFIX, "OneSignal requestPermission falló (continuando)", onesignalPermissionError);
      }

      refreshStatus();

      const nextStatus = await activatePushNotifications(authUserId);
      const debug = getPushNotificationDebugState();
      refreshStatus();

      if (nextStatus === "pending") {
        if (debug.browserNotificationPermission === "granted") {
          window.alert(getWebPushSetupMessage());
        } else {
          window.alert(getPermissionStillDefaultMessage());
        }
      }
    } catch (error) {
      const message = getActivationErrorMessage(error);
      console.error(LOG_PREFIX, "Error al activar notificaciones", error);
      refreshStatus();

      if (message.toLowerCase().includes("app not configured for web push")) {
        window.alert(getWebPushSetupMessage());
        return;
      }

      window.alert(`No se pudieron activar las notificaciones: ${message}`);
    } finally {
      refreshStatus();
      setLoading(false);
    }
  }, [refreshStatus, user?.id, userId]);

  const showActivateButton =
    isOneSignalConfigured && status !== "activated" && status !== "unsupported";

  return {
    handleActivateClick,
    loading,
    showActivateButton,
    status,
  };
}
