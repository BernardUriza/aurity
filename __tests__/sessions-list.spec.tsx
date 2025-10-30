/**
 * Free Intelligence - Sessions List Test
 *
 * Test suite for /sessions page with vitest + React Testing Library.
 *
 * File: __tests__/sessions-list.spec.tsx
 * Card: FI-UI-FEAT-201
 * Created: 2025-10-29
 *
 * Tests:
 * - Renders with 3 mock sessions
 * - Navigation to /sessions/{id}
 * - Loading state
 * - Empty state
 * - Error state
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import SessionsPage from "../app/sessions/page";
import type { SessionsListResponse } from "../ui/types/session";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock API client
vi.mock("../ui/lib/apiClient", () => ({
  getSessions: vi.fn(),
}));

import { getSessions } from "../ui/lib/apiClient";

describe("SessionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with 3 mock sessions", async () => {
    const mockResponse: SessionsListResponse = {
      items: [
        {
          id: "01JBEXAMPLE001",
          created_at: "2025-10-29T10:00:00Z",
          updated_at: "2025-10-29T10:05:00Z",
          last_active: "2025-10-29T10:05:00Z",
          interaction_count: 5,
          status: "active",
          is_persisted: true,
          owner_hash: "sha256:abc123",
          thread_id: "thread_001",
        },
        {
          id: "01JBEXAMPLE002",
          created_at: "2025-10-29T11:00:00Z",
          updated_at: "2025-10-29T11:10:00Z",
          last_active: "2025-10-29T11:10:00Z",
          interaction_count: 3,
          status: "new",
          is_persisted: true,
          owner_hash: "sha256:def456",
          thread_id: null,
        },
        {
          id: "01JBEXAMPLE003",
          created_at: "2025-10-29T12:00:00Z",
          updated_at: "2025-10-29T12:30:00Z",
          last_active: "2025-10-29T12:30:00Z",
          interaction_count: 10,
          status: "complete",
          is_persisted: true,
          owner_hash: "sha256:ghi789",
          thread_id: "thread_003",
        },
      ],
      total: 3,
      limit: 20,
      offset: 0,
    };

    vi.mocked(getSessions).mockResolvedValue(mockResponse);

    render(<SessionsPage />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText("Loading sessions...")).not.toBeInTheDocument();
    });

    // Verify 3 sessions rendered
    expect(screen.getByText("3 total sessions")).toBeInTheDocument();
    // Session IDs are truncated to first 12 chars + "..." - verify table has 3 rows
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBeGreaterThanOrEqual(4); // 1 header + 3 data rows

    // Verify status badges
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("new")).toBeInTheDocument();
    expect(screen.getByText("complete")).toBeInTheDocument();

    // Verify interaction counts
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("navigates to /sessions/{id} on row click", async () => {
    const mockResponse: SessionsListResponse = {
      items: [
        {
          id: "01JBEXAMPLE001",
          created_at: "2025-10-29T10:00:00Z",
          updated_at: "2025-10-29T10:05:00Z",
          last_active: "2025-10-29T10:05:00Z",
          interaction_count: 5,
          status: "active",
          is_persisted: true,
          owner_hash: "sha256:abc123",
          thread_id: "thread_001",
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    };

    vi.mocked(getSessions).mockResolvedValue(mockResponse);

    const user = userEvent.setup();
    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading sessions...")).not.toBeInTheDocument();
    });

    // Click on the first data row
    const rows = screen.getAllByRole("row");
    const sessionRow = rows[1]; // First data row (index 0 is header)
    expect(sessionRow).toBeInTheDocument();

    await user.click(sessionRow!);

    // Verify navigation was called
    expect(mockPush).toHaveBeenCalledWith("/sessions/01JBEXAMPLE001");
  });

  it("shows loading state", () => {
    vi.mocked(getSessions).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<SessionsPage />);

    expect(screen.getByText("Loading sessions...")).toBeInTheDocument();
  });

  it("shows empty state when no sessions", async () => {
    const mockResponse: SessionsListResponse = {
      items: [],
      total: 0,
      limit: 20,
      offset: 0,
    };

    vi.mocked(getSessions).mockResolvedValue(mockResponse);

    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading sessions...")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(/No sessions found. Create your first session to get started./)
    ).toBeInTheDocument();
    expect(screen.getByText("0 total sessions")).toBeInTheDocument();
  });

  it("shows error state on API failure", async () => {
    const errorMessage = "Failed to fetch sessions from API";
    vi.mocked(getSessions).mockRejectedValue(new Error(errorMessage));

    render(<SessionsPage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading sessions...")).not.toBeInTheDocument();
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();

    // Verify error styling (red background)
    const errorBox = screen.getByText(errorMessage).closest("div");
    expect(errorBox).toHaveClass("bg-red-50");
  });
});
