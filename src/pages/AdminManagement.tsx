import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  ShieldCheck,
  UserPlus,
  Lock,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Loader2,
  ArrowLeft,
  Pencil,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  fetchAdmins,
  createAdmin,
  resetAdminPassword,
  updateAdmin,
  updateAdminStatus,
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
  const [resetAdminId, setResetAdminId] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [editingAdmin, setEditingAdmin] = useState<AdminAccount | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<AdminRole>("ADMIN");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [disablingAdmin, setDisablingAdmin] = useState<AdminAccount | null>(null);
  const [disabling, setDisabling] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  const load = () => {
    setLoading(true);
    fetchAdmins({ status: "ACTIVE" })
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

  const openEdit = (admin: AdminAccount) => {
    setActionError("");
    setActionSuccess("");
    setEditError("");
    setEditingAdmin(admin);
    setEditFullName(admin.fullName);
    setEditEmail(admin.email);
    setEditRole(admin.role);
  };

  const handleAdminUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingAdmin) return;

    if (!editFullName.trim() || !editEmail.trim()) {
      setEditError("Enter the administrator's full name and email address.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const updated = await updateAdmin(editingAdmin.id, {
        fullName: editFullName.trim(),
        email: editEmail.trim(),
        role: editingAdmin.id === currentAccount?.id ? undefined : editRole,
      });
      setAdmins((current) => current.map((admin) => (admin.id === updated.id ? updated : admin)));
      setEditingAdmin(null);
      setActionSuccess(`Administrator "${updated.fullName}" updated successfully.`);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (error) {
      setEditError(getApiErrorMessage(error, "Unable to update the administrator."));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDisable = async () => {
    if (!disablingAdmin) return;

    setDisabling(true);
    setActionError("");
    setActionSuccess("");
    try {
      await updateAdminStatus(disablingAdmin.id, "DISABLED");
      setAdmins((current) => current.filter((admin) => admin.id !== disablingAdmin.id));
      if (resetAdminId === disablingAdmin.id) setResetAdminId("");
      setDisablingAdmin(null);
      setActionSuccess(`Administrator "${disablingAdmin.fullName}" has been disabled.`);
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (error) {
      setActionError(getApiErrorMessage(error, "Unable to disable the administrator."));
    } finally {
      setDisabling(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetAdminId || resetPassword.length < 6) {
      setResetError("Select an administrator and enter a new password of at least 6 characters.");
      return;
    }

    setResetSaving(true);
    try {
      await resetAdminPassword(resetAdminId, resetPassword);
      const admin = admins.find((item) => item.id === resetAdminId);
      setResetSuccess(
        `Password reset for ${admin?.fullName ?? "the administrator"}. Their active sessions have been signed out.`
      );
      setResetAdminId("");
      setResetPassword("");
    } catch (err) {
      setResetError(getApiErrorMessage(err, "Unable to reset the administrator password."));
    } finally {
      setResetSaving(false);
    }
  };

  const resettableAdmins = admins.filter((admin) => admin.id !== currentAccount?.id);

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

      {actionError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
          <span className="text-foreground">{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="rounded-md border border-success/30 bg-success/5 p-3 flex items-start gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 mt-0.5 text-success" />
          <span className="text-foreground">{actionSuccess}</span>
        </div>
      )}

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
                  <div className="flex shrink-0 items-center gap-1">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                        a.role === "SUPER_ADMIN"
                          ? "bg-primary/10 text-foreground border-primary/30"
                          : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {a.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label={`Edit ${a.fullName}`}
                      title="Edit administrator"
                      disabled={disabling}
                      onClick={() => openEdit(a)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      aria-label={`Disable ${a.fullName}`}
                      title={
                        a.id === currentAccount?.id
                          ? "You cannot disable your own account"
                          : "Disable administrator"
                      }
                      disabled={disabling || a.id === currentAccount?.id}
                      onClick={() => setDisablingAdmin(a)}
                    >
                      <UserX className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <form id="reset-password" onSubmit={handlePasswordReset} className="mt-5 border-t pt-5 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-foreground" />
              <h4 className="text-sm font-medium text-foreground">Reset Admin Password</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Resetting a password signs the selected administrator out of active sessions.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="reset-admin">Administrator</Label>
              <select
                id="reset-admin"
                value={resetAdminId}
                onChange={(e) => setResetAdminId(e.target.value)}
                disabled={loading || resetSaving || resettableAdmins.length === 0}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select an administrator</option>
                {resettableAdmins.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.fullName} ({admin.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reset-password-input">New Temporary Password</Label>
              <Input
                id="reset-password-input"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                placeholder="At least 6 characters"
                disabled={resetSaving || resettableAdmins.length === 0}
                required
                minLength={6}
              />
            </div>

            {resettableAdmins.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Create another administrator before resetting a password. You cannot reset your own password from this screen.
              </p>
            )}
            {resetError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2 text-xs">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 text-destructive" />
                <span className="text-foreground">{resetError}</span>
              </div>
            )}
            {resetSuccess && (
              <div className="rounded-md border border-success/30 bg-success/5 p-2.5 flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-success" />
                <span className="text-foreground">{resetSuccess}</span>
              </div>
            )}

            <Button
              type="submit"
              size="sm"
              className="w-full active:scale-[0.97] transition-transform"
              disabled={resetSaving || resettableAdmins.length === 0}
            >
              {resetSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin-slow" /> : <KeyRound className="h-4 w-4 mr-2" />}
              {resetSaving ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </div>
      </div>

      <Dialog
        open={Boolean(editingAdmin)}
        onOpenChange={(open) => {
          if (!open && !editSaving) setEditingAdmin(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Administrator</DialogTitle>
            <DialogDescription>
              Update the administrator's name, email address, or role.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdminUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-admin-name">Full Name</Label>
              <Input
                id="edit-admin-name"
                value={editFullName}
                onChange={(event) => setEditFullName(event.target.value)}
                maxLength={200}
                disabled={editSaving}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-admin-email">Email</Label>
              <Input
                id="edit-admin-email"
                type="email"
                value={editEmail}
                onChange={(event) => setEditEmail(event.target.value)}
                maxLength={320}
                disabled={editSaving}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-admin-role">Role</Label>
              <select
                id="edit-admin-role"
                value={editRole}
                onChange={(event) => setEditRole(event.target.value as AdminRole)}
                disabled={editSaving || editingAdmin?.id === currentAccount?.id}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
              {editingAdmin?.id === currentAccount?.id && (
                <p className="text-xs text-muted-foreground">
                  Your role cannot be changed from your own account.
                </p>
              )}
            </div>

            {editError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" />
                <span className="text-foreground">{editError}</span>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingAdmin(null)}
                disabled={editSaving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSaving}>
                {editSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />}
                {editSaving ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(disablingAdmin)}
        onOpenChange={(open) => {
          if (!open && !disabling) setDisablingAdmin(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable administrator?</AlertDialogTitle>
            <AlertDialogDescription>
              {disablingAdmin
                ? `“${disablingAdmin.fullName}” will no longer be able to sign in and will be removed from this active-admin list.`
                : "This administrator will no longer be able to sign in."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={disabling}
              onClick={(event) => {
                event.preventDefault();
                void handleDisable();
              }}
            >
              {disabling && <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />}
              {disabling ? "Disabling..." : "Disable Administrator"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminManagementPage;
