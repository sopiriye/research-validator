import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MarkdownContent from "@/components/MarkdownContent";
import {
  fetchPublishedPlatformDocument,
  getApiErrorMessage,
  type PublishedPlatformDocument,
} from "@/lib/api";

const ProjectFormatPage = () => {
  const [document, setDocument] = useState<PublishedPlatformDocument | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPublishedPlatformDocument("PROJECT_FORMAT")
      .then(setDocument)
      .catch((requestError) => {
        setError(
          getApiErrorMessage(
            requestError,
            "The Project Format is not available at the moment.",
          ),
        );
      });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Research Project Validator
          </Link>
          <Link to="/check">
            <Button variant="outline" size="sm">
              Check Project Title
            </Button>
          </Link>
        </div>
      </header>

      <main className="container max-w-4xl py-8 sm:py-12">
        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : !document ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin-slow" />
            Loading Project Format...
          </div>
        ) : (
          <article className="rounded-xl border bg-card p-5 sm:p-8">
            <div className="mb-6 flex items-start gap-3 border-b pb-5">
              <FileText className="mt-0.5 h-6 w-6 shrink-0 text-foreground" />
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Project Format · Version {document.version}
                </p>
                <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
                  {document.title}
                </h1>
                {document.publishedAt && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Published {formatDate(document.publishedAt)}
                  </p>
                )}
              </div>
            </div>
            <MarkdownContent content={document.content} />
          </article>
        )}
      </main>
    </div>
  );
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default ProjectFormatPage;
