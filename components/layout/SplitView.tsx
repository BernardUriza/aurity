/**
 * Split View Component
 * Card: FI-UI-FEAT-205
 *
 * Displays prompt and response side-by-side (or stacked on mobile)
 */

import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Interaction } from "../types/interaction";

interface SplitViewProps {
  interaction: Interaction;
  noSpoilers: boolean;
  onCopyPrompt: () => void;
  onCopyResponse: () => void;
}

export function SplitView({
  interaction,
  noSpoilers,
  onCopyPrompt,
  onCopyResponse,
}: SplitViewProps) {
  const renderContent = (text: string, isSpoiler: boolean) => {
    if (noSpoilers && isSpoiler) {
      return (
        <div className="text-slate-500 italic p-4 bg-slate-800/50 rounded">
          Content hidden (No Spoilers mode active)
        </div>
      );
    }

    return (
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  const countTokens = (text: string) => {
    // Simple approximation: ~4 chars per token
    return Math.ceil(text.length / 4);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel: Prompt */}
      <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-slate-700 px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Prompt</h2>
            <p className="text-sm text-slate-400">
              {noSpoilers ? "Hidden" : `~${countTokens(interaction.prompt)} tokens`}
            </p>
          </div>
          <button
            onClick={onCopyPrompt}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            Copy
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1 max-h-[600px]">
          {renderContent(interaction.prompt, false)}
        </div>
      </div>

      {/* Right Panel: SOAP Note */}
      <div className="bg-slate-800 rounded-lg overflow-hidden flex flex-col">
        <div className="bg-slate-700 px-4 py-3 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">SOAP Note</h2>
            <p className="text-sm text-slate-400">
              {noSpoilers ? "Hidden" : interaction.response ? `~${countTokens(interaction.response)} tokens` : "Not generated"}
            </p>
          </div>
          <button
            onClick={onCopyResponse}
            className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
            disabled={!interaction.response}
          >
            Copy
          </button>
        </div>
        <div className="p-4 overflow-auto flex-1 max-h-[600px]">
          {interaction.response ? renderContent(interaction.response, true) : (
            <div className="text-slate-500 italic p-4 bg-slate-800/50 rounded">
              SOAP note not generated yet. Click "Generate SOAP Note" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
