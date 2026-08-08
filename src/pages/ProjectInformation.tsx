import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Search, Plus } from "lucide-react";
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
import { createProject, fetchProjects, type Programme, type Project } from "@/lib/api";

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

const ProjectInformation = () => {
  const [form, setForm] = useState<FormState>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [abstractId, setAbstractId] = useState<string | null>(null);
  const [abstractOpen, setAbstractOpen] = useState(false);

  const load = async (q?: string) => {
    setLoadingList(true);
    const list = await fetchProjects(q);
    setProjects(list);
    setLoadingList(false);
  };

  useEffect(() => {
    load();
  }, []);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.supervisee.trim()) e.supervisee = "Required";
    if (!form.projectName.trim()) e.projectName = "Required";
    if (!form.supervisor.trim()) e.supervisor = "Required";
    const y = Number(form.yearOfCompletion);
    if (!y || y < 2000 || y > 2099) e.yearOfCompletion = "Enter a valid year";
    if (!form.programme) e.programme = "Select a programme";
    if (!form.serialNumber.trim()) e.serialNumber = "Required";
    if (form.abstract.trim().length < 50) e.abstract = "Enter an abstract of at least 50 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setSuccess(false);
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
      load(search);
      setTimeout(() => setSuccess(false), 3500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <section>
        <div className="space-y-1 mb-5">
          <h2 className="text-lg font-semibold text-foreground">Add Project Information</h2>
          <p className="text-sm text-muted-foreground">
            Enter full project details. All fields are required.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          <Field label="Supervisee" error={errors.supervisee}>
            <Input
              value={form.supervisee}
              onChange={(e) => update("supervisee", e.target.value)}
              placeholder="John Doe"
              maxLength={100}
            />
          </Field>
          <Field label="Supervisor" error={errors.supervisor}>
            <Input
              value={form.supervisor}
              onChange={(e) => update("supervisor", e.target.value)}
              placeholder="Dr. Jane Smith"
              maxLength={100}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Project Name" error={errors.projectName}>
              <Input
                value={form.projectName}
                onChange={(e) => update("projectName", e.target.value)}
                placeholder="Assessment of ICT Usage in Teaching and Learning"
                maxLength={250}
              />
            </Field>
          </div>
          <Field label="Year of Completion" error={errors.yearOfCompletion}>
            <Input
              type="number"
              min="2000"
              max="2099"
              value={form.yearOfCompletion}
              onChange={(e) => update("yearOfCompletion", e.target.value)}
            />
          </Field>
          <Field label="Programme" error={errors.programme}>
            <Select
              value={form.programme || undefined}
              onValueChange={(v) => update("programme", v as Programme)}
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
                onChange={(e) => update("serialNumber", e.target.value)}
                placeholder="ITE-MSC-2024-001"
                maxLength={50}
              />
            </Field>
          </div>

          <div className="sm:col-span-2">
            <Field label="Abstract" error={errors.abstract}>
              <Textarea
                value={form.abstract}
                onChange={(e) => update("abstract", e.target.value)}
                placeholder="Paste or type the full project abstract here..."
                rows={7}
                maxLength={5000}
                className="resize-y"
              />
              <p className="text-xs text-muted-foreground">
                {form.abstract.trim().length}/5000 characters. Shown to public users and admins via the
                abstract viewer.
              </p>
            </Field>
          </div>

          {success && (
            <div className="sm:col-span-2 rounded-lg border border-success/30 bg-success/5 p-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-foreground">Project information saved successfully.</span>
            </div>
          )}

          <div className="sm:col-span-2">
            <Button type="submit" className="h-10 active:scale-[0.97] transition-transform" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin-slow" /> : <Plus className="h-4 w-4 mr-2" />}
              {saving ? "Saving..." : "Save Project Information"}
            </Button>
          </div>
        </form>
      </section>

      <section>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Search Project Information</h2>
            <p className="text-sm text-muted-foreground">
              {loadingList ? "Loading..." : `${projects.length} record${projects.length === 1 ? "" : "s"}`}
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                load(e.target.value);
              }}
              placeholder="Search title, supervisor, serial..."
              className="pl-9 h-10"
            />
          </div>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
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
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-sm">{p.projectName}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {p.supervisee}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {p.supervisor}
                      </TableCell>
                      <TableCell className="text-sm">{p.programme}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{p.yearOfCompletion}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground tabular-nums">
                        {p.serialNumber}
                      </TableCell>
                      <TableCell className="text-right">
                        <ViewAbstractButton
                          compact
                          label="View abstract"
                          onClick={() => {
                            setAbstractId(p.id);
                            setAbstractOpen(true);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <AbstractDialog projectId={abstractId} open={abstractOpen} onOpenChange={setAbstractOpen} />
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

export default ProjectInformation;