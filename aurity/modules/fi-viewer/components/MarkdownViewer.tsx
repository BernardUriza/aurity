'use client';

/**
 * FI-VIEWER Module - Markdown Viewer Component
 *
 * Renders markdown content with syntax highlighting for code blocks
 * Uses react-markdown + rehype-highlight
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { MarkdownViewerProps } from '../types/interaction';

// Import highlight.js styles (you can choose different themes)
import 'highlight.js/styles/github-dark.css';

export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({
  content,
  className = '',
}) => {
  return (
    <div className={`markdown-viewer prose prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom component for code blocks
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match;
            return (
              <code
                className={`${inline ? 'inline-code' : 'block-code'} ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // Custom component for pre blocks
          pre({ children }) {
            return (
              <pre className="code-block bg-gray-900 p-4 rounded-lg overflow-x-auto">
                {children}
              </pre>
            );
          },
          // Custom component for links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

MarkdownViewer.displayName = 'MarkdownViewer';
