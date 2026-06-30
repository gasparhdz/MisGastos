import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/features/notifications/hooks/usePushNotifications";

export function NotificationSettingsCard() {
  const { handleActivateClick, loading, showActivateButton } = usePushNotifications();

  if (!showActivateButton) {
    return null;
  }

  return (
    <Button
      type="button"
      className="w-full gap-2"
      disabled={loading}
      onClick={() => {
        void handleActivateClick();
      }}
      variant="outline"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
      Activar notificaciones
    </Button>
  );
}
