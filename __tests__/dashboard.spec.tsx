/**
 * Dashboard Tests
 * Card: FI-UI-FEAT-200
 */

import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import DashboardPage from "../app/dashboard/page"
import * as kpisApi from "../lib/api/kpis"

// Mock the KPIs API
vi.mock("../lib/api/kpis", () => ({
  getKPIMetrics: vi.fn(),
}))

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe("DashboardPage", () => {
  const mockMetrics = {
    window: "5m",
    asOf: "2025-10-30T12:00:00Z",
    requests: {
      total: 150,
      "2xx": 145,
      "4xx": 3,
      "5xx": 2,
    },
    latency: {
      p50_ms: 50,
      p95_ms: 150,
      max_ms: 500,
    },
    tokens: {
      in: 1000,
      out: 1500,
      unknown: 0,
    },
    cache: {
      hit: 100,
      miss: 50,
      hit_ratio: 0.67,
    },
    providers: [
      { id: "ollama", count: 80, pct: 53 },
      { id: "claude", count: 70, pct: 47 },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading state initially", () => {
    vi.mocked(kpisApi.getKPIMetrics).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<DashboardPage />)

    // Should show skeleton loading
    expect(document.querySelector(".animate-pulse")).toBeTruthy()
  })

  it("renders dashboard with metrics", async () => {
    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(mockMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("System Dashboard")).toBeTruthy()
    })

    // Check key metrics are displayed
    expect(screen.getByText("Sessions Today")).toBeTruthy()
    expect(screen.getByText("Total Interactions")).toBeTruthy()
    expect(screen.getByText("p95 Ingestion API")).toBeTruthy()
    expect(screen.getByText("p95 Timeline API")).toBeTruthy()
    expect(screen.getByText("Events with Hash")).toBeTruthy()
    expect(screen.getByText("Cache Hit Ratio")).toBeTruthy()
    expect(screen.getByText("Redaction Status")).toBeTruthy()
    expect(screen.getByText("Egress Policy")).toBeTruthy()
  })

  it("displays correct cache hit ratio", async () => {
    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(mockMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      // 67% hit ratio (100 / (100 + 50))
      expect(screen.getByText("67")).toBeTruthy()
    })
  })

  it("shows request distribution cards", async () => {
    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(mockMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("Successful Requests")).toBeTruthy()
      expect(screen.getByText("Client Errors")).toBeTruthy()
      expect(screen.getByText("Server Errors")).toBeTruthy()
    })

    // Check values
    expect(screen.getByText("145")).toBeTruthy() // 2xx
    expect(screen.getByText("3")).toBeTruthy() // 4xx
    expect(screen.getByText("2")).toBeTruthy() // 5xx
  })

  it("shows provider distribution", async () => {
    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(mockMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("LLM Provider Distribution")).toBeTruthy()
    })

    expect(screen.getByText("Ollama")).toBeTruthy()
    expect(screen.getByText("Claude")).toBeTruthy()
    expect(screen.getByText("80")).toBeTruthy()
    expect(screen.getByText("70")).toBeTruthy()
  })

  it("renders quick links", async () => {
    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(mockMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("Quick Links")).toBeTruthy()
    })

    expect(screen.getByText("View All Sessions")).toBeTruthy()
    expect(screen.getByText("View Audit Log")).toBeTruthy()
    expect(screen.getByText("NAS Installer")).toBeTruthy()

    // Check href attributes
    const sessionsLink = screen.getByText("View All Sessions").closest("a")
    expect(sessionsLink?.getAttribute("href")).toBe("/sessions")

    const auditLink = screen.getByText("View Audit Log").closest("a")
    expect(auditLink?.getAttribute("href")).toBe("/audit")
  })

  it("handles API error gracefully", async () => {
    vi.mocked(kpisApi.getKPIMetrics).mockRejectedValue(
      new Error("Network error")
    )

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("Error loading metrics")).toBeTruthy()
      expect(screen.getByText(/Network error/)).toBeTruthy()
    })
  })

  it("shows success status for good latency", async () => {
    const goodLatencyMetrics = {
      ...mockMetrics,
      latency: {
        p50_ms: 50,
        p95_ms: 123, // Under 2000ms target
        max_ms: 200,
      },
    }

    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(goodLatencyMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("System Dashboard")).toBeTruthy()
    })

    // Should display latency value (appears in both p95 cards)
    const latencyElements = screen.getAllByText("123")
    expect(latencyElements.length).toBeGreaterThan(0)
  })

  it("formats total interactions with commas", async () => {
    const largeMetrics = {
      ...mockMetrics,
      requests: {
        ...mockMetrics.requests,
        total: 12345,
      },
    }

    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(largeMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      // Should format with comma separator
      expect(screen.getByText("12,345")).toBeTruthy()
    })
  })

  it("displays redaction and egress policy status", async () => {
    vi.mocked(kpisApi.getKPIMetrics).mockResolvedValue(mockMetrics)

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByText("Active")).toBeTruthy() // Redaction
      expect(screen.getByText("Deny")).toBeTruthy() // Egress
    })
  })
})
