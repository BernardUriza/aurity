"use client";

/**
 * Generic Policy Viewer
 *
 * Displays any policy structure dynamically without hardcoded interfaces.
 * Shows the actual YAML content as-is with collapsible sections.
 */

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";

interface GenericPolicyViewerProps {
  policy: Record<string, any>;
  metadata?: {
    source?: string;
    version?: string;
    timestamp?: string;
  };
}

export function GenericPolicyViewer({ policy, metadata }: GenericPolicyViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const copySection = (key: string, value: any) => {
    const yaml = JSON.stringify(value, null, 2);
    navigator.clipboard.writeText(yaml);
    setCopiedSection(key);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const renderValue = (value: any, depth: number = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-slate-500 italic">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className={value ? 'text-green-400' : 'text-red-400'}>{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-400">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-amber-300">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-slate-500">[]</span>;
      }
      return (
        <div className="ml-4 space-y-1">
          {value.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-slate-600">-</span>
              {renderValue(item, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === 'object') {
      return (
        <div className="ml-4 space-y-2">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex items-start gap-2">
              <span className="text-purple-400 font-mono">{k}:</span>
              {renderValue(v, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-slate-400">{String(value)}</span>;
  };

  const sections = Object.entries(policy).filter(([key]) => key !== 'metadata');

  return (
    <div className="space-y-6">
      {/* Metadata Header */}
      {metadata && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Version:</span>
              <span className="ml-2 text-slate-300 font-mono">{metadata.version}</span>
            </div>
            <div>
              <span className="text-slate-500">Updated:</span>
              <span className="ml-2 text-slate-300">{metadata.timestamp}</span>
            </div>
            <div>
              <span className="text-slate-500">Source:</span>
              <span className="ml-2 text-slate-400 font-mono text-xs">{metadata.source?.split('/').pop()}</span>
            </div>
          </div>
        </div>
      )}

      {/* Policy Sections */}
      <div className="space-y-3">
        {sections.map(([key, value]) => {
          const isExpanded = expandedSections.has(key);
          const isCopied = copiedSection === key;

          return (
            <div
              key={key}
              className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
                onClick={() => toggleSection(key)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-slate-400" />
                  )}
                  <h3 className="text-lg font-semibold text-slate-50 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h3>
                  {typeof value === 'object' && !Array.isArray(value) && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-400 text-xs rounded">
                      {Object.keys(value).length} fields
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copySection(key, value);
                  }}
                  className="p-2 hover:bg-slate-600 rounded transition-colors"
                  title="Copy section"
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-green-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-400" />
                  )}
                </button>
              </div>

              {/* Section Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-700">
                  <div className="mt-4 font-mono text-sm">
                    {renderValue(value)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Policy Metadata Section (if exists) */}
      {policy.metadata && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-400 mb-3">Policy Metadata</h4>
          <div className="font-mono text-sm">
            {renderValue(policy.metadata)}
          </div>
        </div>
      )}
    </div>
  );
}
