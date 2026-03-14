import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, LogIn, LogOut, PenLine, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { UserRole } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerProfile,
  useNotifications,
  useRegisterOrClaimAdmin,
  useUserRole,
} from "../hooks/useQueries";
import { ProfileSetupDialog } from "./ProfileSetupDialog";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { identity, login, clear, isLoggingIn } = useInternetIdentity();
  const isLoggedIn = !!identity;
  const { data: role } = useUserRole();
  const { data: profile, isLoading: profileLoading } = useCallerProfile();
  const { data: notifications } = useNotifications();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const routerState = useRouterState();
  const registerOrClaimAdmin = useRegisterOrClaimAdmin();
  const hasRegistered = useRef(false);

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;
  const isAdmin = role === UserRole.admin;

  // Auto-register on first login — if role is guest, user hasn't been registered yet
  useEffect(() => {
    if (
      isLoggedIn &&
      role === UserRole.guest &&
      !hasRegistered.current &&
      !registerOrClaimAdmin.isPending
    ) {
      hasRegistered.current = true;
      registerOrClaimAdmin.mutate(undefined, {
        onSuccess: (returnedRole) => {
          if (returnedRole === UserRole.admin) {
            toast.success("Du är nu superadmin för HKLOblogg!", {
              duration: 5000,
            });
          }
        },
      });
    }
  }, [isLoggedIn, role, registerOrClaimAdmin]);

  // Reset registration flag on logout
  useEffect(() => {
    if (!isLoggedIn) {
      hasRegistered.current = false;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn && !profileLoading && profile === null) {
      setShowProfileSetup(true);
    }
  }, [isLoggedIn, profileLoading, profile]);

  const currentPath = routerState.location.pathname;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link
              to="/"
              className="font-display text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
            >
              HKLOblogg
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                data-ocid="nav.home_link"
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  currentPath === "/"
                    ? "bg-secondary text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Hem
              </Link>

              {isLoggedIn && (
                <Link
                  to="/write"
                  data-ocid="nav.write_link"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentPath === "/write"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Skriv
                </Link>
              )}

              {isLoggedIn && (
                <Link
                  to="/notifications"
                  data-ocid="nav.notifications_link"
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentPath === "/notifications"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <Bell className="h-3.5 w-3.5" />
                  Notiser
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="h-4 min-w-4 p-0 flex items-center justify-center text-[10px] absolute -top-0.5 -right-0.5"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Link>
              )}

              {isAdmin && (
                <Link
                  to="/admin"
                  data-ocid="nav.admin_link"
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                    currentPath === "/admin"
                      ? "bg-secondary text-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Admin
                </Link>
              )}

              {/* Auth */}
              <div className="ml-2 pl-2 border-l border-border flex items-center gap-2">
                {isLoggedIn ? (
                  <>
                    <span className="text-xs text-muted-foreground hidden sm:inline">
                      {profile?.name ??
                        `${identity?.getPrincipal().toString().slice(0, 8)}…`}
                      {isAdmin && (
                        <Badge
                          variant="outline"
                          className="ml-1.5 text-[10px] py-0 h-4 border-primary/40 text-primary"
                        >
                          admin
                        </Badge>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clear}
                      data-ocid="nav.logout_button"
                      className="h-8 gap-1.5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Logga ut</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={login}
                    disabled={isLoggingIn}
                    data-ocid="nav.login_button"
                    className="h-8 gap-1.5"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    {isLoggingIn ? "Loggar in…" : "Logga in"}
                  </Button>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container max-w-4xl mx-auto px-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} HKLOblogg.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors"
          >
            Byggd med ❤ via caffeine.ai
          </a>
        </div>
      </footer>

      <ProfileSetupDialog
        open={showProfileSetup}
        onSaved={() => setShowProfileSetup(false)}
      />
    </div>
  );
}
