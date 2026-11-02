import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import MarkdownContent from "@/components/MarkdownContent";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createPlatformDocument,
  deletePlatformDocument,
  fetchPlatformDocument,
  fetchPlatformDocuments,
  getApiErrorMessage,
  getCurrentAdmin,
  updatePlatformDocument,
  type AdminAccount,
  type PlatformDocument,
  type PlatformDocumentStatus,
  type PlatformDocumentType,
} from "@/lib/api";

type DocumentForm = {
  documentType: PlatformDocumentType;
  version: string;
  title: string;
  content: string;
  status: PlatformDocumentStatus;
};

const emptyForm: DocumentForm = {
  documentType: "PROJECT_FORMAT",
  version: "",
  title: "",
  content: "",
  status: "ACTIVE",
};

const documentTypeLabels: Record<PlatformDocumentType, string> = {
  PROJECT_FORMAT: "Project Format",
};

const PlatformDocumentsPage = () => {
  const currentAdmin = useMemo<AdminAccount | null>(() => getCurrentAdmin(), []);
  const isSuperAdmin = currentAdmin?.role === "SUPER_ADMIN";
  const [documents, setDocuments] = useState<PlatformDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DocumentForm>(emptyForm);
  const [editingDocument, setEditingDocument] = useState<PlatformDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewDocument, setViewDocument] = useState<PlatformDocument | null>(null);
  const [historyType, setHistoryType] = useState<PlatformDocumentType | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<PlatformDocument | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    setError("");
    try {
      setDocuments(await fetchPlatformDocuments());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load platform documents."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const versionHistory = historyType
    ? documents
        .filter((document) => document.documentType === historyType)
        .sort((a, b) => b.version.localeCompare(a.version, undefined, { numeric: true }))
    : [];

  if (!isSuperAdmin) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const openCreate = () => {
    setEditingDocument(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = async (document: PlatformDocument) => {
    setLoadingEditId(document.id);
    setError("");
    try {
      const latestDocument = await fetchPlatformDocument(document.id);
      setEditingDocument(latestDocument);
      setForm({
        documentType: latestDocument.documentType,
        version: latestDocument.version,
        title: latestDocument.title,
        content: latestDocument.content,
        status: latestDocument.status,
      });
      setFormError("");
      setFormOpen(true);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to load the platform document."));
    } finally {
      setLoadingEditId(null);
    }
  };

  const saveDocument = async (event: React.FormEvent) => {
    event.preventDefault();
    const version = form.version.trim();
    const title = form.title.trim();
    const content = form.content.trim();

    if (!version || !title || !content) {
      setFormError("Version, title, and document content are required.");
      return;
    }
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(version)) {
      setFormError("Version may contain letters, numbers, dots, underscores, and hyphens only.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      if (editingDocument) {
        await updatePlatformDocument(editingDocument.id, {
          version,
          title,
          content,
          status: form.status,
        });
        setSuccess("Platform document updated successfully.");
      } else {
        await createPlatformDocument({
          documentType: form.documentType,
          version,
          title,
          content,
          status: form.status,
        });
        setSuccess("Platform document created successfully.");
      }
      setFormOpen(false);
      await loadDocuments();
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setFormError(getApiErrorMessage(requestError, "Unable to save the platform document."));
    } finally {
      setSaving(false);
    }
  };

  const removeDocument = async () => {
    if (!deletingDocument) return;

    setDeleting(true);
    setError("");
    try {
      await deletePlatformDocument(deletingDocument.id);
      setDocuments((current) => current.filter((document) => document.id !== deletingDocument.id));
      setDeletingDocument(null);
      setSuccess("Platform document deleted successfully.");
      window.setTimeout(() => setSuccess(""), 4000);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to delete the platform document."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/admin/dashboard/management"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Admin Management
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-foreground sm:text-2xl">
            <FileText className="h-5 w-5" />
            Platform Documents
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Publish and maintain documents available to platform users.
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>

      {error && <Notice icon={<AlertCircle />} tone="error" message={error} />}
      {success && <Notice icon={<CheckCircle2 />} tone="success" message={success} />}

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin-slow" />
            Loading platform documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center">
            <FilePlus2 className="mx-auto h-7 w-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">No platform documents yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Create the first Project Format to make it available from the landing page.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {documents.map((document) => (
              <li key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-foreground">{document.title}</p>
                    <StatusBadge status={document.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {documentTypeLabels[document.documentType]} · Version {document.version} · Updated {formatDate(document.updatedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <IconButton label="View document" onClick={() => setViewDocument(document)}>
                    <Eye className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Version history"
                    onClick={() => setHistoryType(document.documentType)}
                  >
                    <Clock3 className="h-4 w-4" />
                  </IconButton>
                  <IconButton
                    label="Edit document"
                    disabled={loadingEditId === document.id}
                    onClick={() => void openEdit(document)}
                  >
                    {loadingEditId === document.id ? (
                      <Loader2 className="h-4 w-4 animate-spin-slow" />
                    ) : (
                      <Pencil className="h-4 w-4" />
                    )}
                  </IconButton>
                  <IconButton
                    label="Delete document"
                    destructive
                    onClick={() => setDeletingDocument(document)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open && !saving) setFormOpen(false);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingDocument ? "Edit Platform Document" : "New Platform Document"}</DialogTitle>
            <DialogDescription>
              {editingDocument
                ? "Update this document or archive it from public access."
                : "Create a document that can be published to platform users."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={saveDocument} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Document Type" htmlFor="document-type">
                <select
                  id="document-type"
                  value={form.documentType}
                  disabled={Boolean(editingDocument) || saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      documentType: event.target.value as PlatformDocumentType,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="PROJECT_FORMAT">Project Format</option>
                </select>
              </FormField>
              <FormField label="Status" htmlFor="document-status">
                <select
                  id="document-status"
                  value={form.status}
                  disabled={saving}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as PlatformDocumentStatus,
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="ACTIVE">Active (public)</option>
                  <option value="ARCHIVED">Archived (hidden)</option>
                </select>
              </FormField>
            </div>
            <FormField label="Version" htmlFor="document-version">
              <Input
                id="document-version"
                value={form.version}
                onChange={(event) => setForm((current) => ({ ...current, version: event.target.value }))}
                placeholder="e.g. 1.0"
                maxLength={50}
                disabled={saving}
                required
              />
            </FormField>
            <FormField label="Title" htmlFor="document-title">
              <Input
                id="document-title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Project Format and Guidelines"
                maxLength={180}
                disabled={saving}
                required
              />
            </FormField>
            <FormField label="Document Content" htmlFor="document-content">
              <Textarea
                id="document-content"
                value={form.content}
                onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                placeholder="Write or paste the Project Format content here..."
                className="min-h-64 resize-y leading-6"
                maxLength={200000}
                disabled={saving}
                required
              />
              <p className="text-right text-xs text-muted-foreground">{form.content.length.toLocaleString()}/200,000 characters</p>
            </FormField>
            {formError && <Notice icon={<AlertCircle />} tone="error" message={formError} compact />}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />}
                {saving ? "Saving..." : editingDocument ? "Save Changes" : "Create Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewDocument)} onOpenChange={(open) => !open && setViewDocument(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewDocument?.title}</DialogTitle>
            <DialogDescription>
              {viewDocument && `${documentTypeLabels[viewDocument.documentType]} · Version ${viewDocument.version}`}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/20 p-4">
            {viewDocument && <MarkdownContent content={viewDocument.content} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyType)} onOpenChange={(open) => !open && setHistoryType(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Version History</DialogTitle>
            <DialogDescription>
              Saved {historyType ? documentTypeLabels[historyType] : "document"} versions.
            </DialogDescription>
          </DialogHeader>
          <ul className="max-h-80 divide-y overflow-y-auto rounded-md border">
            {versionHistory.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Version {document.version}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{document.title} · {formatDate(document.updatedAt)}</p>
                </div>
                <StatusBadge status={document.status} />
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingDocument)} onOpenChange={(open) => !open && !deleting && setDeletingDocument(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete platform document?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingDocument
                ? `“${deletingDocument.title}” (version ${deletingDocument.version}) will be permanently deleted.`
                : "This document will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void removeDocument();
              }}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />}
              {deleting ? "Deleting..." : "Delete Document"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function FormField({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: PlatformDocumentStatus }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${status === "ACTIVE" ? "border-success/30 bg-success/5 text-success" : "border-muted-foreground/25 bg-muted text-muted-foreground"}`}>
      {status === "ACTIVE" ? "Active" : "Archived"}
    </span>
  );
}

function IconButton({ label, children, destructive = false, ...props }: React.ComponentProps<typeof Button> & { label: string; destructive?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={`h-8 w-8 ${destructive ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : ""}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </Button>
  );
}

function Notice({ icon, tone, message, compact = false }: { icon: React.ReactNode; tone: "error" | "success"; message: string; compact?: boolean }) {
  const color = tone === "error" ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-success/30 bg-success/5 text-success";
  return (
    <div className={`flex items-start gap-2 rounded-md border text-sm ${compact ? "p-2.5" : "p-3"} ${color}`}>
      <span className="mt-0.5 shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span>{message}</span>
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(value));
}

export default PlatformDocumentsPage;
