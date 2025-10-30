/**
 * Free Intelligence - Session Detail Test
 *
 * Test suite for /sessions/[id] page with vitest + React Testing Library.
 *
 * File: __tests__/session-detail.spec.tsx
 * Card: FI-UI-FEAT-202
 * Created: 2025-10-29
 *
 * Tests:
 * - Renders session detail with metadata
 * - Shows loading state
 * - Shows 404 not found state
 * - Shows error state
 * - Navigation back to sessions list
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import SessionDetailPage from "../app/sessions/[id]/page";
import type { Session } from "../ui/types/session";

// Mock Next.js navigation
const mockPush = vi.fn();
const mockParams = { id: "01JBEXAMPLE001" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
}));

// Mock API client
vi.mock("../ui/lib/apiClient", () => ({
  getSession: vi.fn(),
}));

import { getSession } from "../ui/lib/apiClient";

describe("SessionDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders session detail with metadata", async () => {
    const mockSession: Session = {
      id: "01JBEXAMPLE001",
      created_at: "2025-10-29T10:00:00Z",
      updated_at: "2025-10-29T10:30:00Z",
      last_active: "2025-10-29T10:30:00Z",
      interaction_count: 15,
      status: "active",
      is_persisted: true,
      owner_hash: "sha256:abc123def456",
      thread_id: "thread_xyz",
    };

    vi.mocked(getSession).mockResolvedValue(mockSession);

    render(<SessionDetailPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading session...")).not.toBeInTheDocument();
    });

    // Verify session ID displayed
    expect(screen.getByText("01JBEXAMPLE001")).toBeInTheDocument();

    // Verify owner hash displayed
    expect(screen.getByText("sha256:abc123def456")).toBeInTheDocument();

    // Verify thread ID displayed
    expect(screen.getByText("thread_xyz")).toBeInTheDocument();

    // Verify interaction count displayed
    expect(screen.getByText("15")).toBeInTheDocument();

    // Verify status badge
    expect(screen.getByText("active")).toBeInTheDocument();

    // Verify "Yes" for persisted
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    vi.mocked(getSession).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SessionDetailPage />);

    expect(screen.getByText("Loading session...")).toBeInTheDocument();
  });

  it("shows 404 not found state", async () => {
    vi.mocked(getSession).mockRejectedValue(
      new Error("Session 01JBEXAMPLE001 not found")
    );

    render(<SessionDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading session...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Session Not Found")).toBeInTheDocument();
    expect(
      screen.getByText(/The session with ID "01JBEXAMPLE001" could not be found/)
    ).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    const errorMessage = "Failed to connect to API server";
    vi.mocked(getSession).mockRejectedValue(new Error(errorMessage));

    render(<SessionDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading session...")).not.toBeInTheDocument();
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Verify error styling (red background)
    const errorBox = screen.getByText(errorMessage).closest("div");
    expect(errorBox).toHaveClass("bg-red-50");
  });

  it("navigates back to sessions list on button click", async () => {
    const mockSession: Session = {
      id: "01JBEXAMPLE001",
      created_at: "2025-10-29T10:00:00Z",
      updated_at: "2025-10-29T10:30:00Z",
      last_active: "2025-10-29T10:30:00Z",
      interaction_count: 5,
      status: "complete",
      is_persisted: true,
      owner_hash: "sha256:test",
      thread_id: null,
    };

    vi.mocked(getSession).mockResolvedValue(mockSession);

    const user = userEvent.setup();
    render(<SessionDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading session...")).not.toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByText("← Back to Sessions");
    await user.click(backButton);

    // Verify navigation was called
    expect(mockPush).toHaveBeenCalledWith("/sessions");
  });

  it("navigates back from 404 page", async () => {
    vi.mocked(getSession).mockRejectedValue(
      new Error("Session not found")
    );

    const user = userEvent.setup();
    render(<SessionDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Session Not Found")).toBeInTheDocument();
    });

    // Click back button
    const backButton = screen.getByText("Back to Sessions");
    await user.click(backButton);

    // Verify navigation
    expect(mockPush).toHaveBeenCalledWith("/sessions");
  });

  it("displays N/A for null thread_id", async () => {
    const mockSession: Session = {
      id: "01JBEXAMPLE001",
      created_at: "2025-10-29T10:00:00Z",
      updated_at: "2025-10-29T10:30:00Z",
      last_active: "2025-10-29T10:30:00Z",
      interaction_count: 3,
      status: "new",
      is_persisted: false,
      owner_hash: "sha256:test",
      thread_id: null,
    };

    vi.mocked(getSession).mockResolvedValue(mockSession);

    render(<SessionDetailPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading session...")).not.toBeInTheDocument();
    });

    // Verify N/A displayed for null thread_id
    expect(screen.getByText("N/A")).toBeInTheDocument();

    // Verify "No" for not persisted
    expect(screen.getByText("No")).toBeInTheDocument();
  });
});
