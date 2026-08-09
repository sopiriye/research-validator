import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ShieldCheck,
  UserPlus,
  Lock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  fetchAdmins,
  createAdmin,
  getApiErrorMessage,
  getCurrentAdmin,
  type AdminAccount,
  type AdminRole,
} from "@/lib/api";

const AdminManagementPage = () => {
  const currentAccount = useMemo<AdminAccount | null>(() => getCurrentAdmin(), []);
  const isSuperAdmin = currentAccount?.role === "SUPER_ADMIN";

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("ADMIN");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = () => {
    setLoading(true);
    fetchAdmins()
      .then((response) => setAdmins(response.admins))
      .catch((error) => setError(getApiErrorMessage(error, "Unable to load administrators.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!isSuperAdmin) {
      setError("You are not allowed to create another admin. Only the Super Admin can add new admins.");
      return;
    }
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError("Enter a name, valid email, and password (min 6 characters).");
      return;
    }

    setSaving(true);
    try {
      const created = await createAdmin({
        fullName,
        email,
        password,
        role: newRole,
      });
      setSuccess(
        `${created.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"} "${created.fullName}" created successfully.`
      );
      setFullName("");
      setEmail("");
      setPassword("");
      setNewRole("ADMIN");
      load();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Dashboard
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Admin Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Only the Super Admin can create new admin accounts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="h-4 w-4 text-foreground" />
            <h3 className="text-sm font-medium text-foreground">Create New Admin</h3>
          </div>

          {!isSuperAdmin && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2 text-xs">
              <Lock className="h-3.5 w-3.5 mt-0.5 text-destructive" />
              <span className="text-foreground">
                You are signed in as an <strong>Admin</strong>. Only the Super Admin can create new admin
                accounts. This form is disabled.
              </span>
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                disabled={!isSuperAdmin || saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@iaue.edu.ng"
                disabled={!isSuperAdmin || saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                disabled={!isSuperAdmin || saving}
              />
            </div>

            <div className="rounded-md border bg-muted/20 p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <Label className="text-xs">Account Role</Label>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {newRole === "SUPER_ADMIN"
                    ? "Super Admin — can manage other admin accounts."
                    : "Admin — standard access, no admin management."}
                </p>
              </div>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className={`text-[11px] ${newRole === "ADMIN" ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  Admin
                </span>
                <Switch
                  checked={newRole === "SUPER_ADMIN"}
                  onCheckedChange={(v) => setNewRole(v ? "SUPER_ADMIN" : "ADMIN")}
                  disabled={!isSuperAdmin || saving}
                  aria-label="Create as Super Admin"
                />
                <span
                  className={`text-[11px] ${newRole === "SUPER_ADMIN" ? "text-foreground font-medium" : "text-muted-foreground"}`}
                >
                  Super Admin
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-destructive" />
                <span className="text-foreground">{error}</span>
              </div>
            )}
            {success && (
              <div className="rounded-md border border-success/30 bg-success/5 p-2.5 flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success" />
                <span className="text-foreground">{success}</span>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              className="w-full active:scale-[0.97] transition-transform"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin-slow" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              {saving ? "Creating..." : "Create Admin"}
            </Button>
          </form>
        </div>

        <div className="rounded-lg border bg-card p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Existing Admins</h3>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin-slow" /> Loading...
            </div>
          ) : (
            <ul className="divide-y">
              {admins.map((a) => (
                <li key={a.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.fullName}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.email}</p>
                  </div>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                      a.role === "SUPER_ADMIN"
                        ? "bg-primary/10 text-foreground border-primary/30"
                        : "bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {a.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagementPage;
