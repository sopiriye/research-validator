import { useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AbstractDialog, ViewAbstractButton } from "@/components/AbstractDialog";
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
  fetchProjects,
  getApiErrorMessage,
  toProjectReference,
  type Pagination,
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
  serialNumber: string;
  abstract: string;
};

const empty: FormState = {
  supervisee: "",
  projectName: "",
  supervisor: "",
  yearOfCompletion: new Date().getFullYear().toString(),
  programme: "",
  serialNumber: "",
  abstract: "",
};

const pageSize = 20;

const ProjectInformation = () => {
  const [form, setForm] = useState<FormState>(empty);
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
  const [abstractProject, setAbstractProject] = useState<ProjectReference | null>(null);
  const [abstractOpen, setAbstractOpen] = useState(false);

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

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const abstractWordCount = countWords(form.abstract);

  const validate = () => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.supervisee.trim()) nextErrors.supervisee = "Required";
    if (!form.projectName.trim()) nextErrors.projectName = "Required";
    if (!form.supervisor.trim()) nextErrors.supervisor = "Required";

    const year = Number(form.yearOfCompletion);
    if (!year || year < 1900 || year > new Date().getFullYear()) {
      nextErrors.yearOfCompletion = "Enter a valid year";
    }
    if (!form.programme) nextErrors.programme = "Select a programme";
    if (!form.serialNumber.trim()) nextErrors.serialNumber = "Required";
    if (!abstractWordCount) nextErrors.abstract = "Enter the project abstract";
    if (abstractWordCount > 300) nextErrors.abstract = "The abstract must not exceed 300 words";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSuccess(false);
    setSubmitError("");

    try {
      await createProject({
        supervisee: form.supervisee.trim(),
        projectName: form.projectName.trim(),
        supervisor: form.supervisor.trim(),
        yearOfCompletion: Number(form.yearOfCompletion),
        programme: form.programme as Programme,
        serialNumber: form.serialNumber.trim(),
        abstract: form.abstract.trim(),
      });
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
          <div className="sm:col-span-2">
            <Field label="Serial Number" error={errors.serialNumber}>
              <Input
                value={form.serialNumber}
                onChange={(event) => update("serialNumber", event.target.value)}
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
                {abstractWordCount}/300 words. The abstract is available to public users and admins through
                the abstract viewer.
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
              placeholder="Search title, supervisee, supervisor, or serial..."
              className="h-10 pl-9"
            />
          </div>
        </div>

        {listError && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {listError}
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
                  <TableHead className="w-16 text-right">Year</TableHead>
                  <TableHead className="hidden lg:table-cell">Serial</TableHead>
                  <TableHead className="w-12 text-right">Abstract</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 && !loadingList ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
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
                      <TableCell className="text-right text-sm tabular-nums">
                        {project.yearOfCompletion}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground tabular-nums lg:table-cell">
                        {project.serialNumber}
                      </TableCell>
                      <TableCell className="text-right">
                        <ViewAbstractButton
                          compact
                          label="View abstract"
                          onClick={() => openAbstract(project)}
                        />
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

      <AbstractDialog project={abstractProject} open={abstractOpen} onOpenChange={setAbstractOpen} />
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

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}

export default ProjectInformation;
