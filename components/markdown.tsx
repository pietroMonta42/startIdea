import React from "react";
import ReactMarkdown from "react-markdown";

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-[15px] leading-relaxed text-ink/90">
      <ReactMarkdown
        components={{
          h1: (p) => <h1 className="mt-6 mb-2 font-display text-2xl font-bold text-ink" {...p} />,
          h2: (p) => (
            <h2 className="mt-7 mb-2.5 flex items-center gap-2 font-display text-xl font-bold text-ink" {...p} />
          ),
          h3: (p) => <h3 className="mt-5 mb-2 font-display text-lg font-bold text-ink" {...p} />,
          p: (p) => <p className="my-2.5" {...p} />,
          ul: (p) => <ul className="my-3 list-disc space-y-1.5 pl-5 marker:text-brand-500" {...p} />,
          ol: (p) => <ol className="my-3 list-decimal space-y-1.5 pl-5 marker:text-brand-500" {...p} />,
          strong: (p) => <strong className="font-bold text-ink" {...p} />,
          a: (p) => (
            <a className="font-semibold text-brand-600 underline decoration-brand-500/40 underline-offset-2 dark:text-brand-400" target="_blank" rel="noreferrer" {...p} />
          ),
          code: (p) => <code className="rounded-md bg-line/70 px-1.5 py-0.5 font-mono text-[13px] text-ink" {...p} />,
          blockquote: (p) => (
            <blockquote className="my-3 border-l-3 border-brand-500 pl-4 italic text-muted" {...p} />
          ),
          hr: () => <hr className="my-6 border-line" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
