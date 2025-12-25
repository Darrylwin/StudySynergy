// src/components/tools/GlobalSummary.jsx - VERSION SIMPLIFIÉE (sans boutons d'actions)
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Hash, FileText, Clock, Brain } from 'lucide-react';

const GlobalSummary = ({ content, sessionId }) => {
  if (!content) {
    return (
      <div className="text-center py-16">
        <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          Aucun résumé disponible
        </h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Le résumé sera généré automatiquement une fois l'analyse terminée.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header du résumé */}
      <div className="mb-8 pb-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <span>Résumé Généré par l'IA</span>
        </h2>
        <div className="flex flex-wrap items-center gap-4 text-gray-600">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Généré le {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FileText className="h-4 w-4" />
            <span className="text-sm">Gemini 1.5 Pro</span>
          </div>
        </div>
      </div>

      {/* Contenu du résumé */}
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            h1: (props) => <h1 className="text-3xl font-bold text-gray-900 mt-8 mb-4 pb-2 border-b" {...props} />,
            h2: (props) => <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-3 flex items-center" {...props}><Hash className="h-5 w-5 mr-2 text-gray-400" />{props.children}</h2>,
            h3: (props) => <h3 className="text-xl font-semibold text-gray-700 mt-5 mb-2" {...props} />,
            p: (props) => <p className="text-gray-700 leading-relaxed mb-4" {...props} />,
            ul: (props) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
            ol: (props) => <ol className="list-decimal pl-5 mb-4 space-y-2" {...props} />,
            li: (props) => <li className="text-gray-700" {...props} />,
            blockquote: (props) => <blockquote className="border-l-4 border-blue-300 pl-4 italic text-gray-600 my-4" {...props} />,
            code: ({inline, ...props}) => 
              inline ? 
                <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm" {...props} /> :
                <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto" {...props} />,
            a: (props) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default GlobalSummary;