/**
 * Audit Log UI Tests
 * Card: FI-UI-FEAT-206
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import AuditPage from "../app/audit/page";
import { AuditTable } from "../components/AuditTable";
import * as auditApi from "../lib/api/audit";
import type { AuditLogEntry, AuditLogsResponse, AuditOperationsResponse } from "../types/audit";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock API module
vi.mock("../lib/api/audit");

const mockLogs: AuditLogEntry[] = [
  {
    audit_id: "log-001",
    timestamp: "2025-10-30T01:00:00Z",
    operation: "LOGIN",
    user_id: "admin",
    endpoint: "/api/auth/login",
    payload_hash: "abc123",
    result_hash: "def456",
    status: "SUCCESS",
    metadata: '{"ip": "192.168.1.1"}',
  },
  {
    audit_id: "log-002",
    timestamp: "2025-10-30T02:00:00Z",
    operation: "EXPORT",
    user_id: "admin",
    endpoint: "/api/export",
    payload_hash: "ghi789",
    result_hash: "jkl012",
    status: "SUCCESS",
    metadata: '{"session_id": "session_123"}',
  },
  {
    audit_id: "log-003",
    timestamp: "2025-10-30T03:00:00Z",
    operation: "POLICY_CHANGE",
    user_id: "admin",
    endpoint: "/api/policy/update",
    payload_hash: "mno345",
    result_hash: "pqr678",
    status: "SUCCESS",
    metadata: '{}',
  },
];

const mockOperations: AuditOperationsResponse = {
  operations: [
    { value: "LOGIN", label: "Login", color: "green" },
    { value: "EXPORT", label: "Export", color: "purple" },
    { value: "POLICY_CHANGE", label: "Policy Change", color: "yellow" },
  ],
};

describe("AuditPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auditApi.getAuditLogs).mockResolvedValue({
      total: mockLogs.length,
      limit: 100,
      logs: mockLogs,
    });
    vi.mocked(auditApi.getAuditOperations).mockResolvedValue(mockOperations);
  });

  it("renders audit log page with header", async () => {
    render(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText("Audit Log")).toBeInTheDocument();
    });
  });

  it("loads and displays audit logs", async () => {
    render(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN")).toBeInTheDocument();
      expect(screen.getByText("EXPORT")).toBeInTheDocument();
      expect(screen.getByText("POLICY_CHANGE")).toBeInTheDocument();
    });
  });

  it("filters logs by operation type", async () => {
    render(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN")).toBeInTheDocument();
    });

    const operationFilter = screen.getByLabelText("Operation Type") as HTMLSelectElement;
    fireEvent.change(operationFilter, { target: { value: "LOGIN" } });

    await waitFor(() => {
      expect(auditApi.getAuditLogs).toHaveBeenCalledWith(
        expect.objectContaining({ operation: "LOGIN" })
      );
    });
  });

  it("opens detail modal when log is clicked", async () => {
    render(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN")).toBeInTheDocument();
    });

    const loginRow = screen.getByText("LOGIN").closest("tr") || screen.getByText("LOGIN").closest("div");
    if (loginRow) {
      fireEvent.click(loginRow);
    }

    await waitFor(() => {
      expect(screen.getByText("Event Detail")).toBeInTheDocument();
      expect(screen.getByText("log-001")).toBeInTheDocument();
    });
  });

  it("closes detail modal on close button click", async () => {
    render(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText("LOGIN")).toBeInTheDocument();
    });

    const loginRow = screen.getByText("LOGIN").closest("tr") || screen.getByText("LOGIN").closest("div");
    if (loginRow) {
      fireEvent.click(loginRow);
    }

    await waitFor(() => {
      expect(screen.getByText("Event Detail")).toBeInTheDocument();
    });

    const closeButton = screen.getByText("✕");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText("Event Detail")).not.toBeInTheDocument();
    });
  });

  it("displays error message on API failure", async () => {
    vi.mocked(auditApi.getAuditLogs).mockRejectedValue(new Error("API Error"));

    render(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load audit logs/i)).toBeInTheDocument();
    });
  });

  it("shows loading state while fetching", () => {
    render(<AuditPage />);

    // Loading spinner should be visible initially
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});

describe("AuditTable", () => {
  it("renders table with log entries", () => {
    const mockOnSelect = vi.fn();

    render(<AuditTable logs={mockLogs} onSelectLog={mockOnSelect} selectedLog={null} />);

    expect(screen.getByText("LOGIN")).toBeInTheDocument();
    expect(screen.getByText("EXPORT")).toBeInTheDocument();
    expect(screen.getByText("POLICY_CHANGE")).toBeInTheDocument();
  });

  it("calls onSelectLog when row is clicked", () => {
    const mockOnSelect = vi.fn();

    render(<AuditTable logs={mockLogs} onSelectLog={mockOnSelect} selectedLog={null} />);

    const loginRow = screen.getByText("LOGIN").closest("tr") || screen.getByText("LOGIN").closest("div");
    if (loginRow) {
      fireEvent.click(loginRow);
    }

    expect(mockOnSelect).toHaveBeenCalledWith(mockLogs[0]);
  });

  it("highlights selected log", () => {
    const mockOnSelect = vi.fn();

    const { container } = render(
      <AuditTable logs={mockLogs} onSelectLog={mockOnSelect} selectedLog={mockLogs[0]} />
    );

    const selectedRow = container.querySelector(".bg-slate-700\\/70");
    expect(selectedRow).toBeInTheDocument();
  });

  it("displays session link when session_id in metadata", () => {
    const mockOnSelect = vi.fn();

    render(<AuditTable logs={mockLogs} onSelectLog={mockOnSelect} selectedLog={null} />);

    const sessionLink = screen.getByText("View Session");
    expect(sessionLink).toBeInTheDocument();
    expect(sessionLink.closest("a")).toHaveAttribute("href", "/sessions/session_123");
  });

  it("shows pagination notice for 100+ logs", () => {
    const manyLogs = Array.from({ length: 100 }, (_, i) => ({
      ...mockLogs[0],
      audit_id: `log-${i}`,
    }));

    const mockOnSelect = vi.fn();

    render(<AuditTable logs={manyLogs} onSelectLog={mockOnSelect} selectedLog={null} />);

    expect(screen.getByText(/Showing most recent 100 events/i)).toBeInTheDocument();
  });

  it("renders empty state when no logs", () => {
    const mockOnSelect = vi.fn();

    render(<AuditTable logs={[]} onSelectLog={mockOnSelect} selectedLog={null} />);

    // Table should still render but be empty
    const tbody = document.querySelector("tbody");
    if (tbody) {
      expect(tbody.children.length).toBe(0);
    }
  });
});

describe("Audit API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it("getAuditLogs calls correct endpoint", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, limit: 100, logs: [] }),
    } as Response);

    await auditApi.getAuditLogs({ limit: 50, operation: "LOGIN" });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/audit/logs"),
      expect.any(Object)
    );
  });

  it("getAuditOperations calls correct endpoint", async () => {
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ operations: [] }),
    } as Response);

    await auditApi.getAuditOperations();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/audit/operations"),
      expect.any(Object)
    );
  });
});
