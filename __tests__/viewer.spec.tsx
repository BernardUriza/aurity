/**
 * Interaction Viewer Tests
 * Card: FI-UI-FEAT-205
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ViewerPage from "../app/viewer/[id]/page";
import { SplitView } from "../components/SplitView";
import { MetadataPanel } from "../components/MetadataPanel";
import type { Interaction } from "../types/interaction";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn((key: string) => (key === "index" ? "0" : null)),
  }),
}));

const mockInteraction: Interaction = {
  id: "interaction-001",
  session_id: "session_20251030_010000",
  index: 0,
  prompt: "# Test Prompt\n\nThis is a test prompt with code:\n\n```python\nprint('hello')\n```",
  response: "# Test Response\n\nThis is a test response with **bold** and *italic* text.",
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  created_at: "2025-10-30T01:00:00Z",
  latency_ms: 1234,
  tokens_in: 45,
  tokens_out: 187,
  content_hash: "sha256:abc123def456789",
  manifest_hash: "sha256:fedcba987654321",
  metadata: {
    temperature: 0.7,
    max_tokens: 1024,
  },
};

describe("ViewerPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders interaction viewer after loading", async () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    await waitFor(() => {
      expect(screen.getByText("Interaction Viewer")).toBeInTheDocument();
    });
  });

  it("displays session info", async () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    await waitFor(() => {
      expect(screen.getByText(/session_20251030_010000/i)).toBeInTheDocument();
      expect(screen.getByText(/Index 0/i)).toBeInTheDocument();
    });
  });

  it("toggles no spoilers mode", async () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    await waitFor(() => {
      expect(screen.getByText("Interaction Viewer")).toBeInTheDocument();
    });

    const toggleButton = screen.getByText(/No Spoilers OFF/i);
    fireEvent.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText(/No Spoilers ON/i)).toBeInTheDocument();
    });
  });

  it("has export buttons", async () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    await waitFor(() => {
      expect(screen.getByText("Export JSON")).toBeInTheDocument();
      expect(screen.getByText("Export Markdown")).toBeInTheDocument();
    });
  });

  it("has back button", async () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    await waitFor(() => {
      const backButton = screen.getByText("← Back");
      expect(backButton).toBeInTheDocument();
    });
  });
});

describe("SplitView", () => {
  const mockOnCopyPrompt = vi.fn();
  const mockOnCopyResponse = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders prompt and response panels", () => {
    render(
      <SplitView
        interaction={mockInteraction}
        noSpoilers={false}
        onCopyPrompt={mockOnCopyPrompt}
        onCopyResponse={mockOnCopyResponse}
      />
    );

    expect(screen.getByText("Prompt")).toBeInTheDocument();
    expect(screen.getByText("Response")).toBeInTheDocument();
  });

  it("displays content when no spoilers is off", () => {
    render(
      <SplitView
        interaction={mockInteraction}
        noSpoilers={false}
        onCopyPrompt={mockOnCopyPrompt}
        onCopyResponse={mockOnCopyResponse}
      />
    );

    expect(screen.getAllByText(/Test Prompt/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Test Response/i).length).toBeGreaterThan(0);
  });

  it("hides response content when no spoilers is on", () => {
    render(
      <SplitView
        interaction={mockInteraction}
        noSpoilers={true}
        onCopyPrompt={mockOnCopyPrompt}
        onCopyResponse={mockOnCopyResponse}
      />
    );

    expect(screen.getByText(/Content hidden/i)).toBeInTheDocument();
  });

  it("shows copy buttons", () => {
    render(
      <SplitView
        interaction={mockInteraction}
        noSpoilers={false}
        onCopyPrompt={mockOnCopyPrompt}
        onCopyResponse={mockOnCopyResponse}
      />
    );

    const copyButtons = screen.getAllByText("Copy");
    expect(copyButtons).toHaveLength(2);
  });

  it("calls onCopyPrompt when prompt copy button clicked", () => {
    render(
      <SplitView
        interaction={mockInteraction}
        noSpoilers={false}
        onCopyPrompt={mockOnCopyPrompt}
        onCopyResponse={mockOnCopyResponse}
      />
    );

    const copyButtons = screen.getAllByText("Copy");
    fireEvent.click(copyButtons[0]); // First copy button is for prompt

    expect(mockOnCopyPrompt).toHaveBeenCalledTimes(1);
  });

  it("calls onCopyResponse when response copy button clicked", () => {
    render(
      <SplitView
        interaction={mockInteraction}
        noSpoilers={false}
        onCopyPrompt={mockOnCopyPrompt}
        onCopyResponse={mockOnCopyResponse}
      />
    );

    const copyButtons = screen.getAllByText("Copy");
    fireEvent.click(copyButtons[1]); // Second copy button is for response

    expect(mockOnCopyResponse).toHaveBeenCalledTimes(1);
  });

  it("displays token count approximation", () => {
    render(
      <SplitView
        interaction={mockInteraction}
        noSpoilers={false}
        onCopyPrompt={mockOnCopyPrompt}
        onCopyResponse={mockOnCopyResponse}
      />
    );

    // Should show approximate token counts
    const tokenTexts = screen.getAllByText(/tokens/i);
    expect(tokenTexts.length).toBeGreaterThan(0);
  });
});

describe("MetadataPanel", () => {
  it("renders metadata panel", () => {
    render(<MetadataPanel interaction={mockInteraction} />);

    expect(screen.getByText("Metadata")).toBeInTheDocument();
  });

  it("displays provider and model", () => {
    render(<MetadataPanel interaction={mockInteraction} />);

    expect(screen.getByText("anthropic")).toBeInTheDocument();
    expect(screen.getByText("claude-3-5-sonnet-20241022")).toBeInTheDocument();
  });

  it("displays performance metrics", () => {
    render(<MetadataPanel interaction={mockInteraction} />);

    expect(screen.getByText(/1234/)).toBeInTheDocument(); // latency_ms
    expect(screen.getByText(/45 in \/ 187 out/i)).toBeInTheDocument(); // tokens
  });

  it("displays timestamps", () => {
    render(<MetadataPanel interaction={mockInteraction} />);

    expect(screen.getByText(/Created:/i)).toBeInTheDocument();
  });

  it("displays content hash", () => {
    render(<MetadataPanel interaction={mockInteraction} />);

    expect(screen.getByText(/Content Hash/i)).toBeInTheDocument();
    expect(screen.getByText(/abc123def456789/i)).toBeInTheDocument();
  });

  it("displays manifest hash when present", () => {
    render(<MetadataPanel interaction={mockInteraction} />);

    expect(screen.getByText(/Manifest Hash/i)).toBeInTheDocument();
    expect(screen.getByText(/fedcba987654321/i)).toBeInTheDocument();
  });

  it("displays additional metadata", () => {
    render(<MetadataPanel interaction={mockInteraction} />);

    expect(screen.getByText(/temperature/i)).toBeInTheDocument();
    expect(screen.getByText(/0.7/)).toBeInTheDocument();
    expect(screen.getByText(/max_tokens/i)).toBeInTheDocument();
    expect(screen.getByText(/1024/)).toBeInTheDocument();
  });

  it("handles missing latency gracefully", () => {
    const interactionNoLatency = { ...mockInteraction, latency_ms: undefined };
    render(<MetadataPanel interaction={interactionNoLatency} />);

    expect(screen.getByText(/N\/A/)).toBeInTheDocument();
  });

  it("handles missing manifest hash gracefully", () => {
    const interactionNoManifest = { ...mockInteraction, manifest_hash: undefined };
    render(<MetadataPanel interaction={interactionNoManifest} />);

    // Should show content hash
    expect(screen.getByText(/Content Hash/i)).toBeInTheDocument();
    // Should not show manifest hash section
    expect(screen.queryByText(/Manifest Hash/i)).not.toBeInTheDocument();
  });
});

describe("Export Functionality", () => {
  beforeEach(() => {
    // Mock document.createElement and related DOM APIs for download testing
    global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("creates downloadable JSON export", async () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    await waitFor(() => {
      expect(screen.getByText("Export JSON")).toBeInTheDocument();
    });

    const exportButton = screen.getByText("Export JSON");

    // Click should not throw error
    expect(() => fireEvent.click(exportButton)).not.toThrow();
  });

  it("creates downloadable Markdown export", async () => {
    render(<ViewerPage params={{ id: "interaction-001" }} />);

    await waitFor(() => {
      expect(screen.getByText("Export Markdown")).toBeInTheDocument();
    });

    const exportButton = screen.getByText("Export Markdown");

    // Click should not throw error
    expect(() => fireEvent.click(exportButton)).not.toThrow();
  });
});
