import OneSignal from "react-onesignal";
import type { PushNotificationStatus } from "@/features/notifications/types";

const LOG_PREFIX = "[MisGastos:Push]";
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim();

export const isOneSignalConfigured = Boolean(ONESIGNAL_APP_ID);

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let lastInitError: string | null = null;

function logPush(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.info(LOG_PREFIX, message, data);
    return;
  }

  console.info(LOG_PREFIX, message);
}

function getBrowserNotificationPermission() {
  if (typeof Notification === "undefined") {
    return "unavailable";
  }

  return Notification.permission;
}

function isWindowOneSignalDefined() {
  return typeof window !== "undefined" && Boolean(window.OneSignal);
}

function isSdkScriptInjected() {
  return typeof document !== "undefined" && Boolean(document.getElementById("onesignal-sdk"));
}

export function getPushNotificationDebugState() {
  const pushSupported = OneSignal.Notifications.isPushSupported();

  return {
    appIdConfigured: isOneSignalConfigured,
    initialized,
    initError: lastInitError,
    browserNotificationPermission: getBrowserNotificationPermission(),
    windowOneSignalDefined: isWindowOneSignalDefined(),
    sdkScriptInjected: isSdkScriptInjected(),
    permissionNative: initialized
      ? OneSignal.Notifications.permissionNative
      : getBrowserNotificationPermission(),
    permission: initialized ? OneSignal.Notifications.permission : null,
    pushSupported,
    optedIn: initialized ? OneSignal.User.PushSubscription.optedIn ?? null : null,
    subscriptionId: initialized ? OneSignal.User.PushSubscription.id ?? null : null,
    externalId: initialized ? OneSignal.User.externalId ?? null : null,
    status: getPushNotificationStatus(),
  };
}

function logPushState(context: string) {
  logPush(context, getPushNotificationDebugState());
}

export function logPushBootstrap(message: string) {
  logPush(message, getPushNotificationDebugState());
}

export function isOneSignalReady() {
  return initialized;
}

function getInitErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function initOneSignal(): Promise<boolean> {
  logPush("initOneSignal() llamado", getPushNotificationDebugState());

  if (!ONESIGNAL_APP_ID) {
    lastInitError = "missing_app_id";
    logPush("VITE_ONESIGNAL_APP_ID no está definida");
    return false;
  }

  if (initialized) {
    logPushState("OneSignal ya estaba inicializado");
    return true;
  }

  if (!OneSignal.Notifications.isPushSupported()) {
    lastInitError = "browser_not_supported";
    logPush("Este navegador no soporta Web Push — init omitido");
    return false;
  }

  if (!initPromise) {
    initPromise = (async () => {
      logPush("Inyectando SDK e inicializando OneSignal…", {
        appIdPrefix: `${ONESIGNAL_APP_ID.slice(0, 8)}…`,
      });

      try {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerParam: { scope: "/push/onesignal/" },
          serviceWorkerPath: "push/onesignal/OneSignalSDKWorker.js",
          allowLocalhostAsSecureOrigin: import.meta.env.DEV,
          promptOptions: {
            slidedown: {
              prompts: [
                {
                  type: "push",
                  autoPrompt: false,
                  delay: { pageViews: 999, timeDelay: 999 },
                },
              ],
            },
          },
          welcomeNotification: {
            disable: true,
            message: "",
          },
        });

        initialized = true;
        lastInitError = null;
        logPush("OneSignal inicializado correctamente");
        logPushState("Estado después de init");
        return true;
      } catch (error) {
        const message = getInitErrorMessage(error);

        if (message.toLowerCase().includes("already initialized")) {
          initialized = true;
          lastInitError = null;
          logPush("OneSignal ya estaba inicializado (react-onesignal)", getPushNotificationDebugState());
          return true;
        }

        lastInitError = message;
        initPromise = null;
        console.error(LOG_PREFIX, "Error al inicializar OneSignal", error);
        logPushState("Init fallido");
        return false;
      }
    })();
  }

  return initPromise;
}

export function getPushNotificationStatus(): PushNotificationStatus {
  if (!ONESIGNAL_APP_ID) {
    return "unconfigured";
  }

  if (!OneSignal.Notifications.isPushSupported()) {
    return "unsupported";
  }

  if (!initialized) {
    return "pending";
  }

  if (OneSignal.Notifications.permissionNative === "denied") {
    return "blocked";
  }

  if (OneSignal.Notifications.permission && OneSignal.User.PushSubscription.optedIn) {
    return "activated";
  }

  return "pending";
}

export async function loginOneSignalUser(userId: string) {
  if (!initialized) {
    logPush("login omitido — OneSignal no inicializado");
    return;
  }

  await OneSignal.login(userId);
  logPushState("Usuario asociado con external id");
}

export async function logoutOneSignalUser() {
  if (!initialized) {
    return;
  }

  await OneSignal.logout();
  logPushState("Usuario desasociado");
}

export async function activatePushNotifications(userId: string): Promise<PushNotificationStatus> {
  logPush("Activando notificaciones…", { userId });

  const ready = await initOneSignal();

  if (!ready) {
    logPush("No se pudo activar: OneSignal no inicializó", getPushNotificationDebugState());
    return getPushNotificationStatus();
  }

  if (!OneSignal.Notifications.isPushSupported()) {
    logPushState("Push no soportado en este navegador");
    return "unsupported";
  }

  await OneSignal.login(userId);
  await OneSignal.Notifications.requestPermission();

  logPush("Permiso nativo", {
    permissionNative: OneSignal.Notifications.permissionNative,
    permission: OneSignal.Notifications.permission,
    browserNotificationPermission: getBrowserNotificationPermission(),
  });

  if (OneSignal.Notifications.permissionNative === "denied") {
    logPushState("Permiso denegado");
    return "blocked";
  }

  await OneSignal.User.PushSubscription.optIn();

  logPush("Suscripción", {
    optedIn: OneSignal.User.PushSubscription.optedIn,
    subscriptionId: OneSignal.User.PushSubscription.id,
  });

  const nextStatus = getPushNotificationStatus();
  logPushState(`Activación finalizada (${nextStatus})`);
  return nextStatus;
}

export { OneSignal };
