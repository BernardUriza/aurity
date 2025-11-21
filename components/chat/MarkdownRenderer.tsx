'use client';

/**
 * MarkdownRenderer Component
 *
 * Renders markdown content with:
 * - GitHub Flavored Markdown (GFM)
 * - Code syntax highlighting
 * - Emoji support
 * - Custom styling
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

export interface MarkdownRendererProps {
  /** Markdown content to render */
  content: string;

  /** Additional CSS classes */
  className?: string;
}

/**
 * Custom components for markdown elements
 */
const markdownComponents: Components = {
  // Headings
  h1: ({ children }) => (
    <h1 className="text-2xl font-bold text-white mb-4 mt-6 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl font-bold text-white mb-3 mt-5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg font-semibold text-white mb-2 mt-4 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0">
      {children}
    </h4>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-slate-200 mb-3 leading-relaxed last:mb-0">
      {children}
    </p>
  ),

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-slate-200 mb-3 space-y-1 pl-4">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-slate-200 mb-3 space-y-1 pl-4">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-slate-200 leading-relaxed">
      {children}
    </li>
  ),

  // Code blocks
  code: ({ className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match;
    return isInline ? (
      <code
        className="
          px-1.5 py-0.5 rounded
          bg-slate-800 text-purple-300
          font-mono text-sm
          border border-slate-700
        "
        {...props}
      >
        {children}
      </code>
    ) : (
      <code
        className={`
          block p-3 rounded-lg mb-3
          bg-slate-800 text-slate-200
          font-mono text-sm
          border border-slate-700
          overflow-x-auto
          ${className || ''}
        `}
        {...props}
      >
        {children}
      </code>
    );
  },

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="
      border-l-4 border-purple-500 pl-4 py-2 mb-3
      bg-slate-800/30 rounded-r
      text-slate-300 italic
    ">
      {children}
    </blockquote>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="
        text-purple-400 hover:text-purple-300
        underline underline-offset-2
        transition-colors
      "
    >
      {children}
    </a>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="border-slate-700 my-4" />
  ),

  // Strong (bold)
  strong: ({ children }) => (
    <strong className="font-bold text-white">
      {children}
    </strong>
  ),

  // Emphasis (italic)
  em: ({ children }) => (
    <em className="italic text-slate-200">
      {children}
    </em>
  ),

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto mb-3">
      <table className="w-full border-collapse border border-slate-700 rounded-lg">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-800 text-white">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="text-slate-200">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="border-b border-slate-700">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2">
      {children}
    </td>
  ),
};

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
