import { useEffect } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushNotifications } from "@/features/notifications/hooks/usePushNotifications";
import { logPushBootstrap } from "@/features/notifications/onesignal";
import type { PushNotificationStatus } from "@/features/notifications/types";
import { cn } from "@/lib/utils";

const STATUS_COPY: Record<
  PushNotificationStatus,
  { description: string; label: string; tone: "default" | "muted" | "positive" | "warning" }
> = {
  unconfigured: {
    label: "OneSignal no configurado",
    description:
      "Agregá VITE_ONESIGNAL_APP_ID en Vercel o .env.local y redeploy/reiniciá el servidor.",
    tone: "warning",
  },
  unsupported: {
    label: "No disponibles",
    description: "Este navegador no soporta notificaciones push.",
    tone: "muted",
  },
  blocked: {
    label: "Notificaciones bloqueadas",
    description: "Habilitá las notificaciones en la configuración del navegador o del sistema.",
    tone: "warning",
  },
  pending: {
    label: "Pendientes de permiso",
    description: "Activá las notificaciones para recibir avisos de vencimientos.",
    tone: "default",
  },
  activated: {
    label: "Notificaciones activadas",
    description: "Este dispositivo está suscrito para recibir avisos.",
    tone: "positive",
  },
};

function StatusIcon({ status }: { status: PushNotificationStatus }) {
  if (status === "activated") {
    return <BellRing className="h-5 w-5 text-primary" />;
  }

  if (status === "blocked" || status === "unconfigured") {
    return <BellOff className="h-5 w-5 text-destructive" />;
  }

  if (status === "unsupported") {
    return <BellOff className="h-5 w-5 text-muted-foreground" />;
  }

  return <Bell className="h-5 w-5 text-muted-foreground" />;
}

function DebugValue({ label, value }: { label: string; value: unknown }) {
  const formatted =
    value === null || value === undefined
      ? "null"
      : typeof value === "boolean"
        ? String(value)
        : String(value);

  return (
    <div className="flex items-start justify-between gap-3 text-[11px] leading-5">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[58%] break-all text-right font-mono">{formatted}</span>
    </div>
  );
}

export function NotificationSettingsCard() {
  const { debug, handleActivateClick, isConfigured, loading, status } = usePushNotifications();

  useEffect(() => {
    logPushBootstrap("NotificationSettingsCard renderizada en HomePage");
  }, []);

  const copy = STATUS_COPY[status];
  const showActivateButton = isConfigured && status === "pending";

  return (
    <Card className="shadow-none" data-testid="notification-settings-card">
      <CardContent className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            status === "activated" && "bg-primary/10",
            (status === "blocked" || status === "unconfigured") && "bg-destructive/10",
            status !== "activated" &&
              status !== "blocked" &&
              status !== "unconfigured" &&
              "bg-muted",
          )}
        >
          <StatusIcon status={status} />
        </span>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-sm font-semibold">Notificaciones</p>
            <p
              className={cn(
                "mt-1 text-sm",
                copy.tone === "positive" && "font-medium text-primary",
                copy.tone === "warning" && "font-medium text-destructive",
                copy.tone === "muted" && "text-muted-foreground",
                copy.tone === "default" && "text-muted-foreground",
              )}
            >
              {copy.label}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{copy.description}</p>
          </div>

          {showActivateButton ? (
            <Button
              type="button"
              className="w-full gap-2 sm:w-auto"
              disabled={loading}
              onClick={() => {
                void handleActivateClick();
              }}
              size="sm"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Activar notificaciones
            </Button>
          ) : null}

          <div className="rounded-lg border border-dashed bg-muted/30 p-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
              Debug temporal
            </p>
            <div className="space-y-1">
              <DebugValue label="appIdConfigured" value={debug.appIdConfigured} />
              <DebugValue label="initialized" value={debug.initialized} />
              <DebugValue
                label="Notification.permission"
                value={debug.browserNotificationPermission}
              />
              <DebugValue label="pushSupported" value={debug.pushSupported} />
              <DebugValue label="optedIn" value={debug.optedIn} />
              <DebugValue label="subscriptionId" value={debug.subscriptionId} />
              <DebugValue label="externalId" value={debug.externalId} />
              <DebugValue label="status" value={debug.status} />
              <DebugValue label="sdkScriptInjected" value={debug.sdkScriptInjected} />
              <DebugValue label="window.OneSignal" value={debug.windowOneSignalDefined} />
              {debug.initError ? <DebugValue label="initError" value={debug.initError} /> : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
