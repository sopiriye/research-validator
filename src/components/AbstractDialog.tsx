import { useEffect, useState } from "react";
import { Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchProjectAbstract, type AbstractResponse } from "@/lib/api";

export function AbstractDialog({
  projectId,
  open,
  onOpenChange,
}: {
  projectId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [data, setData] = useState<AbstractResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectId) return;
    let active = true;
    setLoading(true);
    setError(null);
    setData(null);
    fetchProjectAbstract(projectId)
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e instanceof Error ? e.message : "Failed to load abstract."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [open, projectId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug pr-6">
            {data?.projectTitle ?? "Project Abstract"}
          </DialogTitle>
          <DialogDescription>
            {data
              ? `Year of Completion: ${data.yearOfCompletion} · Programme: ${data.programme}`
              : "Loading project abstract..."}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin-slow" /> Fetching abstract...
          </div>
        )}
        {error && <p className="text-sm text-destructive py-4">{error}</p>}
        {data && !loading && (
          <div className="max-h-[55vh] overflow-y-auto pr-1">
            {data.abstract.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
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
