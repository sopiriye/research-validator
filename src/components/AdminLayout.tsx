import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  GraduationCap,
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  KeyRound,
  LogOut,
  House,
  Menu,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  adminLogout,
  authExpiredEvent,
  fetchCurrentAdmin,
  getAccessToken,
  getCurrentAdmin,
} from "@/lib/api";

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const redirectToLogin = () => {
      if (active) {
        setReady(false);
        navigate("/admin/login", { replace: true });
      }
    };

    const verifySession = async () => {
      if (!getAccessToken() || !getCurrentAdmin()) {
        redirectToLogin();
        return;
      }

      try {
        await fetchCurrentAdmin();
        if (active) setReady(true);
      } catch {
        redirectToLogin();
      }
    };

    void verifySession();
    window.addEventListener(authExpiredEvent, redirectToLogin);

    return () => {
      active = false;
      window.removeEventListener(authExpiredEvent, redirectToLogin);
    };
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await adminLogout();
    } catch {
      // The local session is cleared even when an expired token prevents logout.
    }
    navigate("/admin/login", { replace: true });
  };

  if (!ready) return null;

  const currentAdmin = getCurrentAdmin();

  const navItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/admin/dashboard/projects", icon: FolderKanban, label: "Project Information" },
    { to: "/admin/dashboard/reports", icon: BarChart3, label: "Project Reports" },
    ...(currentAdmin?.role === "SUPER_ADMIN"
      ? [{ to: "/admin/dashboard/platform-documents", icon: FileText, label: "Platform Documents" }]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-foreground" />
            <span className="font-semibold text-foreground text-sm sm:text-base">VOTECH · Admin</span>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <Link to="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                Home
              </Button>
            </Link>
            <Link to="/admin/dashboard/change-password">
              <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                <KeyRound className="h-3.5 w-3.5 mr-1" />
                Change Password
              </Button>
            </Link>
            {currentAdmin?.role === "SUPER_ADMIN" && (
              <Link to="/admin/dashboard/management#reset-password">
                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                  Reset Password
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void handleLogout()}
              className="text-destructive text-xs hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Logout
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label="Open admin navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 sm:hidden">
              <DropdownMenuItem asChild>
                <Link to="/">
                  <House className="mr-2 h-4 w-4" />
                  Home
                </Link>
              </DropdownMenuItem>
              {navItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/dashboard/change-password">
                  <KeyRound className="mr-2 h-4 w-4" />
                  Change Password
                </Link>
              </DropdownMenuItem>
              {currentAdmin?.role === "SUPER_ADMIN" && (
                <DropdownMenuItem asChild>
                  <Link to="/admin/dashboard/management#reset-password">
                    <KeyRound className="mr-2 h-4 w-4" />
                    Reset Password
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onSelect={() => void handleLogout()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="hidden border-b bg-card sm:block">
        <div className="container flex gap-1 py-1 overflow-x-auto">
          {navItems.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link key={item.to} to={item.to}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={`text-xs whitespace-nowrap ${active ? "text-foreground" : "text-muted-foreground"}`}
                >
                  <item.icon className="h-3.5 w-3.5 mr-1.5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>
      </div>

      <main className="flex-1 container py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
