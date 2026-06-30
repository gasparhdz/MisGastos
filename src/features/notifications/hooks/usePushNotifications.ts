import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  activatePushNotifications,
  getActivationErrorMessage,
  getInitError,
  getPermissionStillDefaultMessage,
  getPushNotificationDebugState,
  getPushNotificationStatus,
  initOneSignal,
  isOneSignalConfigured,
  isOneSignalReady,
  logPushBootstrap,
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
  const [debug, setDebug] = useState(getPushNotificationDebugState);

  const refreshStatus = useCallback(() => {
    const nextStatus = getPushNotificationStatus();
    const nextDebug = getPushNotificationDebugState();
    setStatus(nextStatus);
    setDebug(nextDebug);
    console.info(LOG_PREFIX, "Estado actualizado", nextDebug);
  }, []);

  useEffect(() => {
    logPushBootstrap("usePushNotifications montado");

    if (!isOneSignalConfigured) {
      console.info(LOG_PREFIX, "VITE_ONESIGNAL_APP_ID no configurada — tarjeta visible en modo aviso");
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
      console.info(LOG_PREFIX, "Cambio de permiso detectado");
      refreshStatus();
    };

    const handleSubscriptionChange = () => {
      console.info(LOG_PREFIX, "Cambio de suscripción detectado");
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
    console.info("[MisGastos:Push] Click activar notificaciones");

    const authUserId = user?.id ?? userId;

    if (!authUserId) {
      const message = "No hay usuario autenticado. Volvé a iniciar sesión.";
      console.error(LOG_PREFIX, message);
      window.alert(message);
      return;
    }

    setLoading(true);

    try {
      if (!isOneSignalReady()) {
        const initializedOk = await initOneSignal();

        if (!initializedOk) {
          throw new Error(getInitError() ?? "OneSignal no inicializó");
        }
      }

      const nativePermission = await requestBrowserPushPermission();
      console.info(LOG_PREFIX, "Permiso nativo tras click", getPushNotificationDebugState());

      if (nativePermission === "denied") {
        refreshStatus();
        window.alert("Las notificaciones están bloqueadas. Habilitalas en la configuración del navegador.");
        return;
      }

      if (nativePermission === "default") {
        refreshStatus();
        window.alert(getPermissionStillDefaultMessage());
        return;
      }

      console.info(LOG_PREFIX, "OneSignal.Notifications.requestPermission() tras permiso nativo");
      try {
        await OneSignal.Notifications.requestPermission();
      } catch (onesignalPermissionError) {
        console.error(LOG_PREFIX, "OneSignal requestPermission falló (continuando)", onesignalPermissionError);
      }

      console.info(LOG_PREFIX, "Estado antes de activatePushNotifications", getPushNotificationDebugState());

      const nextStatus = await activatePushNotifications(authUserId);
      setStatus(nextStatus);
      setDebug(getPushNotificationDebugState());
      console.info(LOG_PREFIX, "Activación completada", getPushNotificationDebugState());

      if (nextStatus === "pending") {
        window.alert(getPermissionStillDefaultMessage());
      }
    } catch (error) {
      const message = getActivationErrorMessage(error);
      console.error(LOG_PREFIX, "Error al activar notificaciones", error);
      window.alert(`No se pudieron activar las notificaciones: ${message}`);
      refreshStatus();
    } finally {
      setLoading(false);
    }
  }, [refreshStatus, user?.id, userId]);

  return {
    debug,
    handleActivateClick,
    isConfigured: isOneSignalConfigured,
    loading,
    ready,
    status,
  };
}
