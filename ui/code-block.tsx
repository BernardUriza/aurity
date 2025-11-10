"use client";

/**
 * CodeBlock Component
 * Card: FI-INFRA-STR-014
 *
 * Copyable code block with syntax highlighting and platform detection
 */

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: "bash" | "powershell" | "javascript" | "python";
  filename?: string;
  className?: string;
}

export function CodeBlock({ code, language = "bash", filename, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("relative rounded-lg border border-slate-700 bg-slate-900", className)}>
      {/* Header */}
      {filename && (
        <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2">
          <span className="text-xs font-mono text-slate-400">{filename}</span>
          <span className="text-xs text-slate-500">{language}</span>
        </div>
      )}

      {/* Code */}
      <div className="relative">
        <pre className="overflow-x-auto p-4 text-sm">
          <code className={cn("font-mono",
            language === "bash" && "text-emerald-400",
            language === "powershell" && "text-blue-400",
            language === "javascript" && "text-yellow-400",
            language === "python" && "text-purple-400"
          )}>
            {code}
          </code>
        </pre>

        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
}
