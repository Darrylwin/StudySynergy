import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen } from 'lucide-react';

const GlobalSummary = ({ content }) => {
  if (!content) {
    return (
      <div className="text-center py-12 text-muted">
        <BookOpen className="h-8 w-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Le résumé sera disponible une fois l'analyse terminée.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-5">Résumé</p>
      <div className="prose prose-sm max-w-none text-ink">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, children, ...props }) => <h1 className="text-xl font-bold text-ink mt-6 mb-3" {...props}>{children}</h1>,
            h2: ({ node, children, ...props }) => <h2 className="text-lg font-semibold text-ink mt-5 mb-2" {...props}>{children}</h2>,
            h3: ({ node, children, ...props }) => <h3 className="text-base font-semibold text-ink mt-4 mb-2" {...props}>{children}</h3>,
            p: ({ node, children, ...props }) => <p className="text-sm text-ink leading-relaxed mb-3" {...props}>{children}</p>,
            ul: ({ node, children, ...props }) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props}>{children}</ul>,
            ol: ({ node, children, ...props }) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props}>{children}</ol>,
            li: ({ node, children, ...props }) => <li className="text-sm text-ink" {...props}>{children}</li>,
            blockquote: ({ node, children, ...props }) => (
              <blockquote className="border-l-2 border-stone pl-4 italic text-muted my-3" {...props}>{children}</blockquote>
            ),
            code: ({ inline, node, children, ...props }) =>
              inline
                ? <code className="bg-faint text-ink px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
                : <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-3 text-xs overflow-x-auto font-mono" {...props}>{children}</code>,
            a: ({ node, children, ...props }) => <a className="text-accent underline underline-offset-2" {...props}>{children}</a>,
            strong: ({ node, children, ...props }) => <strong className="font-semibold text-ink" {...props}>{children}</strong>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default GlobalSummary;
