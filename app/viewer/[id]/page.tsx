/**
 * Free Intelligence - Interaction Viewer
 *
 * /viewer/:id route - split view for viewing prompt/response of a single interaction.
 *
 * File: apps/aurity/app/viewer/[id]/page.tsx
 * Card: FI-UI-FEAT-205
 * Created: 2025-10-30
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SplitView } from "../../../components/SplitView";
import { MetadataPanel } from "../../../components/MetadataPanel";
import type { Interaction } from "../../../types/interaction";

export default function ViewerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interactionId = params.id;
  const index = searchParams.get("index");

  const [interaction, setInteraction] = useState<Interaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noSpoilers, setNoSpoilers] = useState(false);

  useEffect(() => {
    loadInteraction();
  }, [interactionId, index]);

  const loadInteraction = async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with real API call
      // For now, using mock data
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockInteraction: Interaction = {
        id: interactionId,
        session_id: "session_20251030_010000",
        index: parseInt(index || "0", 10),
        prompt: `# Example Prompt

This is a sample prompt showing how the viewer displays user input.

\`\`\`python
def hello_world():
    print("Hello, Free Intelligence!")
\`\`\`

What do you think about this code?`,
        response: `# Example Response

This code demonstrates a classic "Hello World" example in Python. Here's my analysis:

## Key Points:
1. **Function Definition**: Uses standard Python function syntax
2. **Print Statement**: Utilizes the built-in \`print()\` function
3. **String Literal**: Contains a friendly greeting message

## Suggestions:
- Add a docstring to explain the function's purpose
- Consider adding type hints for better code documentation
- Could return the string instead of printing directly

\`\`\`python
def hello_world() -> str:
    """Return a greeting message."""
    return "Hello, Free Intelligence!"
\`\`\`

This approach is more testable and follows functional programming principles.`,
        provider: "anthropic",
        model: "claude-3-5-sonnet-20241022",
        created_at: "2025-10-30T01:00:00Z",
        latency_ms: 1234,
        tokens_in: 45,
        tokens_out: 187,
        content_hash: "sha256:abc123def456...",
        manifest_hash: "sha256:789ghi012jkl...",
        metadata: {
          temperature: 0.7,
          max_tokens: 1024,
        },
      };

      setInteraction(mockInteraction);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load interaction");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "json" | "markdown") => {
    if (!interaction) return;

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(interaction, null, 2);
      filename = `interaction_${interaction.id}.json`;
      mimeType = "application/json";
    } else {
      content = `# Interaction ${interaction.id}

**Session:** ${interaction.session_id}
**Index:** ${interaction.index}
**Provider:** ${interaction.provider}
**Model:** ${interaction.model}
**Created:** ${new Date(interaction.created_at).toLocaleString()}
**Latency:** ${interaction.latency_ms}ms
**Tokens:** ${interaction.tokens_in} in / ${interaction.tokens_out} out

---

## Prompt

${interaction.prompt}

---

## Response

${interaction.response}

---

## Metadata

\`\`\`json
${JSON.stringify(interaction.metadata, null, 2)}
\`\`\`

**Content Hash:** ${interaction.content_hash}
**Manifest Hash:** ${interaction.manifest_hash || "N/A"}
`;
      filename = `interaction_${interaction.id}.md`;
      mimeType = "text/markdown";
    }

    // Create download
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async () => {
    if (!interaction) return;
    try {
      await navigator.clipboard.writeText(interaction.prompt);
      alert("Prompt copied to clipboard!");
    } catch (err) {
      alert("Failed to copy prompt");
    }
  };

  const handleCopyResponse = async () => {
    if (!interaction) return;
    try {
      await navigator.clipboard.writeText(interaction.response);
      alert("Response copied to clipboard!");
    } catch (err) {
      alert("Failed to copy response");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-slate-400 hover:text-slate-200 mb-2 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-slate-50">Interaction Viewer</h1>
            {interaction && (
              <p className="text-slate-400 text-sm mt-1">
                {interaction.session_id} • Index {interaction.index}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => setNoSpoilers(!noSpoilers)}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                noSpoilers
                  ? "bg-yellow-600 text-white hover:bg-yellow-700"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {noSpoilers ? "🙈 No Spoilers ON" : "👁️ No Spoilers OFF"}
            </button>

            <button
              onClick={() => handleExport("json")}
              disabled={!interaction}
              className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export JSON
            </button>

            <button
              onClick={() => handleExport("markdown")}
              disabled={!interaction}
              className="px-4 py-2 bg-purple-600 text-white rounded font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export Markdown
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Content */}
        {!loading && interaction && (
          <div className="space-y-6">
            {/* Split View */}
            <SplitView
              interaction={interaction}
              noSpoilers={noSpoilers}
              onCopyPrompt={handleCopyPrompt}
              onCopyResponse={handleCopyResponse}
            />

            {/* Metadata Panel */}
            <MetadataPanel interaction={interaction} />
          </div>
        )}

        {/* Not Found */}
        {!loading && !interaction && !error && (
          <div className="bg-slate-800 rounded-lg p-12 text-center">
            <p className="text-slate-400 text-lg">Interaction not found</p>
            <p className="text-slate-500 text-sm mt-2">
              The requested interaction does not exist or has been deleted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
