import { useEffect, useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  fetchProjectAbstract,
  type AbstractResponse,
  type ProjectReference,
} from "@/lib/api";

export function AbstractDialog({
  project,
  open,
  onOpenChange,
}: {
  project: ProjectReference | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [data, setData] = useState<AbstractResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !project) return;

    let active = true;
    setLoading(true);
    setError(null);
    setData(null);

    fetchProjectAbstract(project.id)
      .then((response) => active && setData(response))
      .catch((error) => {
        if (active) {
          setError(
            error instanceof Error ? error.message : "Failed to load the project abstract.",
          );
        }
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [open, project]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">
            {project?.projectTitle ?? "Project Abstract"}
          </DialogTitle>
          <DialogDescription>
            {project
              ? `Year of Completion: ${project.yearOfCompletion} · Programme: ${project.programme}`
              : "Loading project abstract..."}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin-slow" /> Fetching abstract...
          </div>
        )}
        {error && <p className="py-4 text-sm text-destructive">{error}</p>}
        {data && !loading && data.abstract && (
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {data.abstract.split("\n\n").map((paragraph, index) => (
              <p
                key={index}
                className="mb-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
              >
                {paragraph}
              </p>
            ))}
          </div>
        )}
        {data && !loading && !data.abstract && (
          <p className="py-4 text-sm text-muted-foreground">{data.message}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ViewAbstractButton({
  onClick,
  label = "View Abstract",
  compact = false,
}: {
  onClick: () => void;
  label?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        aria-label={label}
        title={label}
        onClick={onClick}
      >
        <Eye className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onClick}>
      <Eye className="h-3.5 w-3.5" />
      {label}
    </Button>
  );
}
