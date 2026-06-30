import OneSignal from "react-onesignal";
import type { PushNotificationStatus } from "@/features/notifications/types";

const LOG_PREFIX = "[MisGastos:Push]";
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim();

export const isOneSignalConfigured = Boolean(ONESIGNAL_APP_ID);

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let lastInitError: string | null = null;
let lastDashboardConfigError: string | null = null;
let lastActivationError: string | null = null;

export function getBrowserNotificationPermission() {
  if (typeof Notification === "undefined") {
    return "unavailable" as const;
  }

  return Notification.permission;
}

export function getInitError() {
  return lastInitError;
}

export function isOneSignalReady() {
  return initialized;
}

export function getActivationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function requestBrowserPushPermission(): Promise<NotificationPermission | "unavailable"> {
  if (typeof Notification === "undefined") {
    throw new Error("Este navegador no expone la API Notification");
  }

  if (Notification.permission !== "default") {
    return Notification.permission;
  }

  return Notification.requestPermission();
}

export async function initOneSignal(): Promise<boolean> {
  if (!ONESIGNAL_APP_ID) {
    lastInitError = "missing_app_id";
    return false;
  }

  if (initialized) {
    return true;
  }

  if (!OneSignal.Notifications.isPushSupported()) {
    lastInitError = "browser_not_supported";
    return false;
  }

  if (!initPromise) {
    initPromise = (async () => {
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
        return true;
      } catch (error) {
        const message = getActivationErrorMessage(error);

        if (message.toLowerCase().includes("already initialized")) {
          initialized = true;
          lastInitError = null;
          return true;
        }

        if (message.toLowerCase().includes("app not configured for web push")) {
          lastDashboardConfigError = message;
        }

        lastInitError = message;
        initPromise = null;
        console.error(LOG_PREFIX, "Error al inicializar OneSignal", error);
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

  const browserPermission = getBrowserNotificationPermission();

  if (browserPermission === "denied") {
    return "blocked";
  }

  if (!initialized) {
    return "pending";
  }

  if (OneSignal.Notifications.permissionNative === "denied") {
    return "blocked";
  }

  if (
    (browserPermission === "granted" || OneSignal.Notifications.permission) &&
    OneSignal.User.PushSubscription.optedIn
  ) {
    return "activated";
  }

  return "pending";
}

export async function loginOneSignalUser(userId: string) {
  if (!initialized) {
    return;
  }

  await OneSignal.login(userId);
}

export async function logoutOneSignalUser() {
  if (!initialized) {
    return;
  }

  await OneSignal.logout();
}

export async function activatePushNotifications(userId: string): Promise<PushNotificationStatus> {
  if (!initialized) {
    const ready = await initOneSignal();

    if (!ready) {
      throw new Error(lastInitError ?? "OneSignal no inicializó");
    }
  }

  if (!OneSignal.Notifications.isPushSupported()) {
    throw new Error("Este navegador no soporta notificaciones push");
  }

  if (getBrowserNotificationPermission() === "denied") {
    return "blocked";
  }

  await OneSignal.login(userId);

  try {
    await OneSignal.User.PushSubscription.optIn();
  } catch (error) {
    lastActivationError = getActivationErrorMessage(error);
    console.error(LOG_PREFIX, "optIn falló", error);
    throw error;
  }

  if (!OneSignal.User.PushSubscription.optedIn) {
    lastActivationError = "optIn completó pero optedIn sigue en false";

    if (lastDashboardConfigError || lastInitError) {
      throw new Error(lastDashboardConfigError ?? lastInitError ?? lastActivationError);
    }

    throw new Error(
      "No se pudo completar la suscripción push. Revisá la configuración Web en OneSignal.",
    );
  }

  lastActivationError = null;
  return getPushNotificationStatus();
}

export function getWebPushSetupMessage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://tu-dominio.vercel.app";

  return [
    "OneSignal no tiene Web Push configurado para este dominio.",
    "",
    "En OneSignal Dashboard:",
    "1. Settings → Push & In-App → Web",
    "2. Integration type: Custom Code",
    `3. Site URL: ${origin} (exacto, con https)`,
    "4. Guardá y esperá unos minutos",
    "5. Volvé a tocar Activar notificaciones",
    "",
    "El permiso del navegador ya está concedido. Falta la suscripción en OneSignal.",
  ].join("\n");
}

export function getPermissionStillDefaultMessage() {
  const origin = typeof window !== "undefined" ? window.location.origin : "tu dominio";

  return [
    "El navegador no mostró el permiso de notificaciones.",
    "",
    "Verificá:",
    `• OneSignal → Settings → Web → Site URL = ${origin} (exacto, con https)`,
    "• Chrome → Configuración → Privacidad → Notificaciones → permitir que los sitios pregunten",
    "• En iPhone: instalá la PWA en pantalla de inicio y abrila desde el ícono",
    "• No uses modo incógnito",
  ].join("\n");
}

export { OneSignal };
