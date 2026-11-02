import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

const MarkdownContent = ({ content, className }: MarkdownContentProps) => {
  return (
    <div className={cn("break-words text-sm leading-7 text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="mb-4 mt-8 text-2xl font-bold leading-tight first:mt-0 sm:text-3xl">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-3 mt-7 text-xl font-semibold leading-tight first:mt-0 sm:text-2xl">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-2 mt-6 text-lg font-semibold leading-tight first:mt-0">{children}</h3>,
          h4: ({ children }) => <h4 className="mb-2 mt-5 font-semibold leading-tight first:mt-0">{children}</h4>,
          p: ({ children }) => <p className="my-4 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-1 pl-6 marker:text-muted-foreground">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-1 pl-6 marker:text-muted-foreground">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => <blockquote className="my-4 border-l-4 border-border pl-4 italic text-muted-foreground">{children}</blockquote>,
          hr: () => <hr className="my-6 border-border" />,
          pre: ({ children }) => <pre className="my-4 overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6 text-foreground">{children}</pre>,
          code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-md border">
              <table className="w-full border-collapse text-left text-sm">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
          th: ({ children }) => <th className="border-b px-3 py-2 font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b px-3 py-2 align-top last:border-b-0">{children}</td>,
          img: ({ src, alt }) => <img src={src} alt={alt ?? ""} className="my-4 max-h-96 max-w-full rounded-md border object-contain" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
