import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  CheckCheck,
  Heart,
  Loader2,
  MessageCircle,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { NotificationType } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "../hooks/useQueries";

function formatDate(ns: bigint) {
  return new Date(Number(ns / BigInt(1_000_000))).toLocaleDateString("sv-SE", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function NotifIcon({ type }: { type: NotificationType }) {
  if (type === NotificationType.like)
    return <Heart className="h-4 w-4 text-destructive" />;
  if (type === NotificationType.comment)
    return <MessageCircle className="h-4 w-4 text-primary" />;
  return <UserPlus className="h-4 w-4 text-accent" />;
}

export function NotificationsPage() {
  const { identity, login } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: notifications, isLoading } = useNotifications();
  const markAll = useMarkAllRead();
  const markOne = useMarkRead();

  if (!isLoggedIn) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">
          Du måste vara inloggad för att se notiser.
        </p>
        <Button onClick={login}>Logga in</Button>
      </div>
    );
  }

  const unread = notifications?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <Bell className="h-7 w-7" />
          Notiser
          {unread > 0 && (
            <Badge variant="destructive" className="text-sm">
              {unread}
            </Badge>
          )}
        </h1>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              markAll.mutate(undefined, {
                onError: () => toast.error("Något gick fel"),
              })
            }
            disabled={markAll.isPending}
            data-ocid="notifications.mark_all_button"
            className="gap-2"
          >
            {markAll.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Markera alla som lästa
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3" data-ocid="notifications.loading_state">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-2" data-ocid="notifications.list">
          {notifications && notifications.length > 0 ? (
            notifications.map((n) => (
              <div
                key={n.id.toString()}
                className={`flex items-start gap-3 p-4 rounded-md border transition-colors ${
                  n.read
                    ? "border-border bg-card"
                    : "border-primary/20 bg-primary/5"
                }`}
              >
                <div className="mt-0.5">
                  <NotifIcon type={n.notificationType} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${n.read ? "text-muted-foreground" : "text-foreground font-medium"}`}
                  >
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      markOne.mutate(n.id, {
                        onError: () => toast.error("Något gick fel"),
                      })
                    }
                    disabled={markOne.isPending}
                  >
                    Markera
                  </Button>
                )}
              </div>
            ))
          ) : (
            <div
              data-ocid="notifications.empty_state"
              className="text-center py-16 text-muted-foreground"
            >
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Inga notiser ännu.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
