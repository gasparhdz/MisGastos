import OneSignal from "react-onesignal";
import type { PushNotificationStatus } from "@/features/notifications/types";

const LOG_PREFIX = "[MisGastos:Push]";
const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID?.trim();

export const isOneSignalConfigured = Boolean(ONESIGNAL_APP_ID);

let initialized = false;
let initPromise: Promise<boolean> | null = null;
let lastInitError: string | null = null;
let lastDashboardConfigError: string | null = null;
let lastPermissionRequestResult: string | null = null;
let lastActivationError: string | null = null;

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

function isStandalonePwa() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function getInitError() {
  return lastInitError;
}

export function getPushNotificationDebugState() {
  const pushSupported = OneSignal.Notifications.isPushSupported();

  return {
    appIdConfigured: isOneSignalConfigured,
    initialized,
    initError: lastInitError,
    dashboardConfigError: lastDashboardConfigError,
    lastActivationError,
    lastPermissionRequestResult,
    browserNotificationPermission: getBrowserNotificationPermission(),
    windowOneSignalDefined: isWindowOneSignalDefined(),
    sdkScriptInjected: isSdkScriptInjected(),
    standalonePwa: isStandalonePwa(),
    permissionNative: initialized
      ? OneSignal.Notifications.permissionNative
      : getBrowserNotificationPermission(),
    permission: initialized ? OneSignal.Notifications.permission : null,
    pushSupported,
    optedIn: initialized ? OneSignal.User.PushSubscription.optedIn ?? null : null,
    subscriptionId: initialized ? OneSignal.User.PushSubscription.id ?? null : null,
    externalId: initialized ? OneSignal.User.externalId ?? null : null,
    status: getPushNotificationStatus(),
    origin: typeof window !== "undefined" ? window.location.origin : null,
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

export function getActivationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function requestBrowserPushPermission(): Promise<NotificationPermission | "unavailable"> {
  if (typeof Notification === "undefined") {
    lastPermissionRequestResult = "unavailable";
    throw new Error("Este navegador no expone la API Notification");
  }

  const before = Notification.permission;
  logPush("Notification.requestPermission() nativo", { before });

  if (before === "granted") {
    lastPermissionRequestResult = "granted (ya estaba concedido)";
    return "granted";
  }

  if (before === "denied") {
    lastPermissionRequestResult = "denied (ya estaba bloqueado)";
    return "denied";
  }

  const result = await Notification.requestPermission();
  lastPermissionRequestResult = result;
  logPush("Notification.requestPermission() resultado", {
    result,
    after: Notification.permission,
  });

  return result;
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
        origin: window.location.origin,
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
        const message = getActivationErrorMessage(error);

        if (message.toLowerCase().includes("already initialized")) {
          initialized = true;
          lastInitError = null;
          logPush("OneSignal ya estaba inicializado (react-onesignal)", getPushNotificationDebugState());
          return true;
        }

        if (message.toLowerCase().includes("app not configured for web push")) {
          lastDashboardConfigError = message;
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
  logPush("activatePushNotifications() iniciado", { userId });

  if (!initialized) {
    const ready = await initOneSignal();

    if (!ready) {
      const message = lastInitError ?? "OneSignal no inicializó";
      logPush("No se pudo activar", getPushNotificationDebugState());
      throw new Error(message);
    }
  }

  if (!OneSignal.Notifications.isPushSupported()) {
    throw new Error("Este navegador no soporta notificaciones push");
  }

  if (getBrowserNotificationPermission() === "denied") {
    logPushState("Permiso denegado");
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
    logPushState("Suscripción incompleta");

    if (lastDashboardConfigError || lastInitError) {
      throw new Error(lastDashboardConfigError ?? lastInitError ?? lastActivationError);
    }

    throw new Error(
      "No se pudo completar la suscripción push. Revisá la configuración Web en OneSignal.",
    );
  }

  lastActivationError = null;

  logPush("Suscripción", {
    optedIn: OneSignal.User.PushSubscription.optedIn,
    subscriptionId: OneSignal.User.PushSubscription.id,
    externalId: OneSignal.User.externalId,
  });

  const nextStatus = getPushNotificationStatus();
  logPushState(`Activación finalizada (${nextStatus})`);
  return nextStatus;
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
