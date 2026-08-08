import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { validateTitle, type ValidationResponse, type ProjectMatch } from "@/lib/api";
import { AbstractDialog, ViewAbstractButton } from "@/components/AbstractDialog";

const CheckTitlePage = () => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResponse | null>(null);
  const [abstractId, setAbstractId] = useState<string | null>(null);
  const [abstractOpen, setAbstractOpen] = useState(false);

  const openAbstract = (id: string) => {
    setAbstractId(id);
    setAbstractOpen(true);
  };

  const handleCheck = async () => {
    if (!title.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      setResult(await validateTitle(title));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="font-semibold text-foreground text-sm sm:text-base">Check Project Title</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center space-y-2 fade-in-up">
            <h1 className="text-2xl font-bold text-foreground">Project Title Validation</h1>
            <p className="text-sm text-muted-foreground">
              Enter a proposed project title to check for exact duplicates and possible similar matches.
            </p>
          </div>

          <div className="space-y-3 fade-in-up fade-in-up-delay-1">
            <Input
              placeholder="e.g. Assessment of ICT Usage in Teaching and Learning"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (result) setResult(null);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleCheck()}
              className="h-12"
              maxLength={250}
            />
            <Button
              onClick={handleCheck}
              disabled={!title.trim() || loading}
              className="w-full h-11 active:scale-[0.97] transition-transform"
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin-slow" /> : <Search className="h-4 w-4 mr-2" />}
              {loading ? "Checking..." : "Check Title"}
            </Button>
          </div>

          {result && <ResultBlock result={result} onViewAbstract={openAbstract} />}
        </div>
      </main>

      <AbstractDialog projectId={abstractId} open={abstractOpen} onOpenChange={setAbstractOpen} />
    </div>
  );
};

function ResultBlock({
  result,
  onViewAbstract,
}: {
  result: ValidationResponse;
  onViewAbstract: (id: string) => void;
}) {
  if (result.status === "DUPLICATE_FOUND") {
    return (
      <div className="space-y-3 fade-in-up">
        <StatusBanner
          tone="destructive"
          icon={<XCircle className="h-5 w-5" />}
          title="Exact Match Found"
          message="This project title already exists."
        />
        <div className="space-y-2">
          {result.exactMatches.map((m, i) => (
            <MatchCard key={i} match={m} tone="destructive" onViewAbstract={onViewAbstract} />
          ))}
        </div>
      </div>
    );
  }

  if (result.status === "SIMILAR_FOUND") {
    return (
      <div className="space-y-3 fade-in-up">
        <StatusBanner
          tone="warning"
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Possible Similar Match Found"
          message="No exact duplicate was found, but similar project titles exist."
        />
        <div className="space-y-2">
          {result.similarMatches.map((m, i) => (
            <MatchCard key={i} match={m} tone="warning" onViewAbstract={onViewAbstract} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      <StatusBanner
        tone="success"
        icon={<CheckCircle2 className="h-5 w-5" />}
        title="No Match Found"
        message="No matching project title was found. You may proceed with this topic."
      />
    </div>
  );
}

type Tone = "destructive" | "warning" | "success";

const toneClasses: Record<Tone, { border: string; bg: string; text: string }> = {
  destructive: { border: "border-destructive/30", bg: "bg-destructive/5", text: "text-destructive" },
  warning: { border: "border-warning/40", bg: "bg-warning/5", text: "text-warning" },
  success: { border: "border-success/30", bg: "bg-success/5", text: "text-success" },
};

function StatusBanner({
  tone,
  icon,
  title,
  message,
}: {
  tone: Tone;
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  const c = toneClasses[tone];
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className={c.text}>{icon}</span>
        <div>
          <p className="font-semibold text-foreground text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  tone,
  onViewAbstract,
}: {
  match: ProjectMatch;
  tone: Tone;
  onViewAbstract: (id: string) => void;
}) {
  const c = toneClasses[tone];
  return (
    <div className={`rounded-lg border ${c.border} bg-card p-4`}>
      <p className="font-medium text-sm text-foreground leading-snug">{match.projectTitle}</p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
        <span>
          Year of Completion: <span className="text-foreground font-medium">{match.yearOfCompletion}</span>
        </span>
        <span>
          Programme: <span className="text-foreground font-medium">{match.programme}</span>
        </span>
      </div>
      <div className="mt-3">
        <ViewAbstractButton onClick={() => onViewAbstract(match.id)} />
      </div>
    </div>
  );
}

export default CheckTitlePage;
