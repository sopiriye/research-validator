import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AbstractDialog, ViewAbstractButton } from "@/components/AbstractDialog";
import {
  ResearchObjectivesDialog,
  ViewResearchObjectivesButton,
} from "@/components/ResearchObjectivesDialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createProject,
  academicDepartmentOptions,
  deleteProject,
  fetchAcademicDepartments,
  fetchProject,
  fetchProjects,
  getApiErrorMessage,
  toProjectReference,
  toAcademicDepartmentCode,
  updateProject,
  type Pagination,
  type AcademicDepartment,
  type AcademicDepartmentOption,
  type Programme,
  type Project,
  type ProjectReference,
} from "@/lib/api";

type FormState = {
  supervisee: string;
  projectName: string;
  supervisor: string;
  yearOfCompletion: string;
  programme: Programme | "";
  department: AcademicDepartment | "";
  regNumber: string;
  abstract: string;
  researchObjectives: string;
};

const empty: FormState = {
  supervisee: "",
  projectName: "",
  supervisor: "",
  yearOfCompletion: new Date().getFullYear().toString(),
  programme: "",
  department: "",
  regNumber: "",
  abstract: "",
  researchObjectives: "",
};

const pageSize = 20;

const ProjectInformation = () => {
  const [form, setForm] = useState<FormState>(empty);
  const [academicDepartments, setAcademicDepartments] = useState<
    AcademicDepartmentOption[]
  >(academicDepartmentOptions);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");
  const [listSuccess, setListSuccess] = useState("");
  const [abstractProject, setAbstractProject] = useState<ProjectReference | null>(null);
  const [abstractOpen, setAbstractOpen] = useState(false);
  const [researchObjectivesProject, setResearchObjectivesProject] = useState<ProjectReference | null>(null);
  const [researchObjectivesOpen, setResearchObjectivesOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState<FormState>(empty);
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [loadingEditId, setLoadingEditId] = useState<string | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async (query: string, requestedPage: number) => {
    setLoadingList(true);
    setListError("");

    try {
      const response = await fetchProjects({
        page: requestedPage,
        limit: pageSize,
        search: query.trim() || undefined,
      });
      setProjects(response.records);
      setPagination(response.pagination);
    } catch (error) {
      setProjects([]);
      setPagination(null);
      setListError(getApiErrorMessage(error, "Unable to load project records."));
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => void load(search, page),
      search ? 300 : 0,
    );
    return () => window.clearTimeout(timeout);
  }, [load, page, search]);

  useEffect(() => {
    let isActive = true;

    void fetchAcademicDepartments()
      .then((departments) => {
        if (isActive && departments.length > 0) {
          setAcademicDepartments(departments);
        }
      })
      .catch(() => {
        // Retain the contract-aligned local list if the reference request fails.
      });

    return () => {
      isActive = false;
    };
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const abstractWordCount = countWords(form.abstract);
  const researchObjectivesWordCount = countWords(form.researchObjectives);
  const editAbstractWordCount = countWords(editForm.abstract);
  const editResearchObjectivesWordCount = countWords(editForm.researchObjectives);

  const validate = () => {
    const nextErrors = getFormErrors(form);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateEditForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setEditForm((current) => ({ ...current, [key]: value }));
    if (editErrors[key]) {
      setEditErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSuccess(false);
    setSubmitError("");

    try {
      await createProject(toProjectPayload(form));
      setSuccess(true);
      setForm({ ...empty, yearOfCompletion: form.yearOfCompletion });
      setPage(1);
      await load(search, 1);
      window.setTimeout(() => setSuccess(false), 3500);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to save the project information."));
    } finally {
      setSaving(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openAbstract = (project: Project) => {
    setAbstractProject(toProjectReference(project));
    setAbstractOpen(true);
  };

  const openResearchObjectives = (project: Project) => {
    setResearchObjectivesProject(toProjectReference(project));
    setResearchObjectivesOpen(true);
  };

  const openEdit = async (project: Project) => {
    setListError("");
    setListSuccess("");
    setLoadingEditId(project.id);

    try {
      const details = await fetchProject(project.id);
      setEditingProject(details);
      setEditForm(toFormState(details));
      setEditErrors({});
      setEditError("");
    } catch (error) {
      setListError(getApiErrorMessage(error, "Unable to load the project record for editing."));
    } finally {
      setLoadingEditId(null);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingProject) return;

    const nextErrors = getFormErrors(editForm);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setEditSaving(true);
    setEditError("");
    try {
      await updateProject(editingProject.id, toProjectPayload(editForm));
      setEditingProject(null);
      setListSuccess("Project record updated successfully.");
      await load(search, page);
      window.setTimeout(() => setListSuccess(""), 3500);
    } catch (error) {
      setEditError(getApiErrorMessage(error, "Unable to update the project record."));
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingProject) return;

    setDeleting(true);
    setListError("");
    setListSuccess("");
    try {
      await deleteProject(deletingProject.id);
      setDeletingProject(null);
      setListSuccess("Project record deleted successfully.");
      await load(search, page);
      window.setTimeout(() => setListSuccess(""), 3500);
    } catch (error) {
      setListError(getApiErrorMessage(error, "Unable to delete the project record."));
    } finally {
      setDeleting(false);
    }
  };

  const totalItems = pagination?.totalItems ?? 0;

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-5 space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Add Project Information</h2>
          <p className="text-sm text-muted-foreground">
            Enter full project details. All fields are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Supervisee" error={errors.supervisee}>
            <Input
              value={form.supervisee}
              onChange={(event) => update("supervisee", event.target.value)}
              placeholder="John Doe"
              maxLength={255}
            />
          </Field>
          <Field label="Supervisor" error={errors.supervisor}>
            <Input
              value={form.supervisor}
              onChange={(event) => update("supervisor", event.target.value)}
              placeholder="Dr. Jane Smith"
              maxLength={255}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Project Title" error={errors.projectName}>
              <Input
                value={form.projectName}
                onChange={(event) => update("projectName", event.target.value)}
                placeholder="Assessment of ICT Usage in Teaching and Learning"
                maxLength={1000}
              />
            </Field>
          </div>
          <Field label="Year of Completion" error={errors.yearOfCompletion}>
            <Input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={form.yearOfCompletion}
              onChange={(event) => update("yearOfCompletion", event.target.value)}
            />
          </Field>
          <Field label="Programme" error={errors.programme}>
            <Select
              value={form.programme || undefined}
              onValueChange={(value) => update("programme", value as Programme)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select programme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MSc">MSc</SelectItem>
                <SelectItem value="PGD">PGD</SelectItem>
                <SelectItem value="PhD">PhD</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Department" error={errors.department}>
            <Select
              value={form.department || undefined}
              onValueChange={(value) => update("department", value as AcademicDepartment)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {academicDepartments.map((department) => (
                  <SelectItem key={department.value} value={department.value}>
                    {department.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Reg Number" error={errors.regNumber}>
              <Input
                value={form.regNumber}
                onChange={(event) => update("regNumber", event.target.value)}
                placeholder="ITE-MSC-2024-001"
                maxLength={100}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Abstract" error={errors.abstract}>
              <Textarea
                value={form.abstract}
                onChange={(event) => update("abstract", event.target.value)}
                placeholder="Paste or type the full project abstract here..."
                rows={7}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {abstractWordCount}/500 words. The abstract is available to public users and admins through
                the abstract viewer.
              </p>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Research Objectives" error={errors.researchObjectives}>
              <Textarea
                value={form.researchObjectives}
                onChange={(event) => update("researchObjectives", event.target.value)}
                placeholder="Enter the project's research objectives..."
                rows={5}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {researchObjectivesWordCount}/300 words. Research objectives are available through the objectives viewer.
              </p>
            </Field>
          </div>

          {submitError && (
            <div className="sm:col-span-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
          {success && (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-foreground">Project information saved successfully.</span>
            </div>
          )}
          <div className="sm:col-span-2">
            <Button
              type="submit"
              className="h-10 transition-transform active:scale-[0.97]"
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Project Information"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Search Project Information</h2>
            <p className="text-sm text-muted-foreground">
              {loadingList
                ? "Loading..."
                : `${totalItems} record${totalItems === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search title, supervisee, supervisor, or Reg Number..."
              className="h-10 pl-9"
            />
          </div>
        </div>

        {listError && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {listError}
          </p>
        )}
        {listSuccess && (
          <p className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-foreground">{listSuccess}</span>
          </p>
        )}

        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Title</TableHead>
                  <TableHead className="hidden md:table-cell">Supervisee</TableHead>
                  <TableHead className="hidden md:table-cell">Supervisor</TableHead>
                  <TableHead className="w-20">Prog.</TableHead>
                  <TableHead className="hidden lg:table-cell">Department</TableHead>
                  <TableHead className="w-16 text-right">Year</TableHead>
                  <TableHead className="hidden lg:table-cell">Reg Number</TableHead>
                  <TableHead className="w-12 text-right">Abstract</TableHead>
                  <TableHead className="w-12 text-right">Objectives</TableHead>
                  <TableHead className="w-20 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 && !loadingList ? (
                  <TableRow>
                    <TableCell colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="text-sm font-medium">{project.projectName}</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {project.supervisee}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {project.supervisor}
                      </TableCell>
                      <TableCell className="text-sm">{project.programme}</TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {project.department}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {project.yearOfCompletion}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground tabular-nums lg:table-cell">
                        {project.regNumber}
                      </TableCell>
                      <TableCell className="text-right">
                        <ViewAbstractButton
                          compact
                          label="View abstract"
                          onClick={() => openAbstract(project)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <ViewResearchObjectivesButton
                          compact
                          label="View research objectives"
                          onClick={() => openResearchObjectives(project)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            aria-label={`Edit ${project.projectName}`}
                            title="Edit project"
                            disabled={loadingEditId === project.id || deleting}
                            onClick={() => void openEdit(project)}
                          >
                            {loadingEditId === project.id ? (
                              <Loader2 className="h-4 w-4 animate-spin-slow" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={`Delete ${project.projectName}`}
                            title="Delete project"
                            disabled={deleting || Boolean(loadingEditId)}
                            onClick={() => setDeletingProject(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-end gap-3 text-sm text-muted-foreground">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Previous page"
                disabled={loadingList || pagination.page <= 1}
                onClick={() => setPage((current) => current - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                aria-label="Next page"
                disabled={loadingList || pagination.page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(editingProject)}
        onOpenChange={(open) => {
          if (!open && !editSaving) setEditingProject(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project Information</DialogTitle>
            <DialogDescription>
              Update the project details, then save your changes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Supervisee" error={editErrors.supervisee}>
              <Input
                value={editForm.supervisee}
                onChange={(event) => updateEditForm("supervisee", event.target.value)}
                maxLength={255}
                disabled={editSaving}
              />
            </Field>
            <Field label="Supervisor" error={editErrors.supervisor}>
              <Input
                value={editForm.supervisor}
                onChange={(event) => updateEditForm("supervisor", event.target.value)}
                maxLength={255}
                disabled={editSaving}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Project Title" error={editErrors.projectName}>
                <Input
                  value={editForm.projectName}
                  onChange={(event) => updateEditForm("projectName", event.target.value)}
                  maxLength={1000}
                  disabled={editSaving}
                />
              </Field>
            </div>
            <Field label="Year of Completion" error={editErrors.yearOfCompletion}>
              <Input
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={editForm.yearOfCompletion}
                onChange={(event) => updateEditForm("yearOfCompletion", event.target.value)}
                disabled={editSaving}
              />
            </Field>
            <Field label="Programme" error={editErrors.programme}>
              <Select
                value={editForm.programme || undefined}
                onValueChange={(value) => updateEditForm("programme", value as Programme)}
                disabled={editSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select programme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MSc">MSc</SelectItem>
                  <SelectItem value="PGD">PGD</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Department" error={editErrors.department}>
              <Select
                value={editForm.department || undefined}
                onValueChange={(value) => updateEditForm("department", value as AcademicDepartment)}
                disabled={editSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {academicDepartments.map((department) => (
                    <SelectItem key={department.value} value={department.value}>
                      {department.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Reg Number" error={editErrors.regNumber}>
                <Input
                  value={editForm.regNumber}
                  onChange={(event) => updateEditForm("regNumber", event.target.value)}
                  maxLength={100}
                  disabled={editSaving}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Abstract" error={editErrors.abstract}>
                <Textarea
                  value={editForm.abstract}
                  onChange={(event) => updateEditForm("abstract", event.target.value)}
                  rows={7}
                  className="resize-y"
                  disabled={editSaving}
                />
                <p className="text-xs text-muted-foreground">{editAbstractWordCount}/500 words.</p>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="Research Objectives" error={editErrors.researchObjectives}>
                <Textarea
                  value={editForm.researchObjectives}
                  onChange={(event) => updateEditForm("researchObjectives", event.target.value)}
                  rows={5}
                  className="resize-y"
                  disabled={editSaving}
                />
                <p className="text-xs text-muted-foreground">
                  {editResearchObjectivesWordCount}/300 words.
                </p>
              </Field>
            </div>

            {editError && (
              <div className="sm:col-span-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {editError}
              </div>
            )}

            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingProject(null)}
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
        open={Boolean(deletingProject)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeletingProject(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project record?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingProject
                ? `This will remove “${deletingProject.projectName}” from the active project records.`
                : "This action cannot be undone from the dashboard."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin-slow" />}
              {deleting ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AbstractDialog project={abstractProject} open={abstractOpen} onOpenChange={setAbstractOpen} />
      <ResearchObjectivesDialog
        project={researchObjectivesProject}
        open={researchObjectivesOpen}
        onOpenChange={setResearchObjectivesOpen}
      />
    </div>
  );
};

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function toFormState(project: Project): FormState {
  return {
    supervisee: project.supervisee,
    projectName: project.projectName,
    supervisor: project.supervisor,
    yearOfCompletion: project.yearOfCompletion.toString(),
    programme: project.programme,
    department: toAcademicDepartmentCode(project.department),
    regNumber: project.regNumber,
    abstract: project.abstract ?? "",
    researchObjectives: project.researchObjectives ?? "",
  };
}

function toProjectPayload(form: FormState) {
  return {
    supervisee: form.supervisee.trim(),
    projectName: form.projectName.trim(),
    supervisor: form.supervisor.trim(),
    yearOfCompletion: Number(form.yearOfCompletion),
    programme: form.programme as Programme,
    department: form.department as AcademicDepartment,
    regNumber: form.regNumber.trim(),
    abstract: form.abstract.trim(),
    researchObjectives: form.researchObjectives.trim(),
  };
}

function getFormErrors(form: FormState): Partial<Record<keyof FormState, string>> {
  const nextErrors: Partial<Record<keyof FormState, string>> = {};
  if (!form.supervisee.trim()) nextErrors.supervisee = "Required";
  if (!form.projectName.trim()) nextErrors.projectName = "Required";
  if (!form.supervisor.trim()) nextErrors.supervisor = "Required";

  const year = Number(form.yearOfCompletion);
  if (!year || year < 1900 || year > new Date().getFullYear()) {
    nextErrors.yearOfCompletion = "Enter a valid year";
  }
  if (!form.programme) nextErrors.programme = "Select a programme";
  if (!form.department) nextErrors.department = "Select a department";
  if (!form.regNumber.trim()) nextErrors.regNumber = "Required";

  const abstractWordCount = countWords(form.abstract);
  if (!abstractWordCount) nextErrors.abstract = "Enter the project abstract";
  if (abstractWordCount > 500) nextErrors.abstract = "The abstract must not exceed 500 words";

  const researchObjectivesWordCount = countWords(form.researchObjectives);
  if (!researchObjectivesWordCount) nextErrors.researchObjectives = "Enter the research objectives";
  if (researchObjectivesWordCount > 300) {
    nextErrors.researchObjectives = "Research objectives must not exceed 300 words";
  }

  return nextErrors;
}

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default ProjectInformation;
