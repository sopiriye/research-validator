import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changeOwnPassword,
  clearAdminSession,
  getApiErrorMessage,
} from "@/lib/api";

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("Enter a new password of at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      await changeOwnPassword(currentPassword, newPassword);
      setSuccess(true);
      clearAdminSession();
      window.setTimeout(() => navigate("/admin/login", { replace: true }), 1200);
    } catch (error) {
      setError(getApiErrorMessage(error, "Unable to change your password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <Link
        to="/admin/dashboard"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Dashboard
      </Link>

      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
          <KeyRound className="h-5 w-5" />
          Change Password
        </h1>
        <p className="text-sm text-muted-foreground">
          Use your current password to set a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="current-password">Current Password</Label>
          <Input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            disabled={saving || success}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="new-password">New Password</Label>
          <Input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="At least 6 characters"
            minLength={6}
            disabled={saving || success}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={saving || success}
            required
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            Password changed. Please sign in again.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={saving || success}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />}
          {saving ? "Changing Password..." : "Change Password"}
        </Button>
      </form>
    </div>
  );
};

export default ChangePasswordPage;
