/**
 * Policy Snapshot Tests
 * Card: FI-UI-FEAT-204
 *
 * Tests for PolicyViewer and GlobalPolicyBanner components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PolicyViewer } from '@/components/PolicyViewer';
import { GlobalPolicyBanner } from '@/components/GlobalPolicyBanner';

// Mock fetch globally
global.fetch = vi.fn();

describe('PolicyViewer', () => {
  const mockPolicy = {
    sovereignty: {
      egress: {
        default: 'deny',
        allowlist: ['127.0.0.1', 'localhost'],
      },
    },
    privacy: {
      phi: {
        enabled: false,
      },
      redaction: {
        spoilers: true,
        style_file: 'config/redaction_style.yaml',
      },
    },
    timeline: {
      auto: {
        enabled: true,
      },
      auto_archive_days: 90,
    },
    mutation: {
      append_only: true,
      event_required: true,
    },
    export: {
      enabled: true,
      formats: ['hdf5', 'json', 'markdown'],
      manifest_required: true,
    },
    retention: {
      audit_logs_days: 90,
      session_min_days: 30,
    },
    security: {
      lan_only: true,
      auth_required: false,
    },
    llm: {
      enabled: true,
      providers: ['ollama'],
      audit: {
        required: true,
      },
    },
    observability: {
      chaos_drills_enabled: true,
    },
  };

  const mockMetadata = {
    source: 'fi.policy.yaml',
    version: '1.0',
    timestamp: '2025-10-30T12:00:00Z',
  };

  it('renders policy sections correctly', () => {
    render(<PolicyViewer policy={mockPolicy} metadata={mockMetadata} />);

    // Check that main sections are present
    expect(screen.getByText('Policy Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Egress Policy')).toBeInTheDocument();
    expect(screen.getByText('PHI Redaction')).toBeInTheDocument();
    expect(screen.getByText('Timeline Auto-export')).toBeInTheDocument();
    expect(screen.getByText('Mutation Rules')).toBeInTheDocument();
    expect(screen.getByText('Security & LLM')).toBeInTheDocument();
    expect(screen.getByText('Retention & Observability')).toBeInTheDocument();
  });

  it('displays egress policy values correctly', () => {
    render(<PolicyViewer policy={mockPolicy} metadata={mockMetadata} />);

    // Check egress default
    expect(screen.getByText('deny')).toBeInTheDocument();

    // Check allowlist destinations
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
    expect(screen.getByText('localhost')).toBeInTheDocument();
  });

  it('displays PHI redaction values correctly', () => {
    render(<PolicyViewer policy={mockPolicy} metadata={mockMetadata} />);

    // PHI enabled should show false (green)
    const phiEnabledElements = screen.getAllByText('false');
    expect(phiEnabledElements.length).toBeGreaterThan(0);
  });

  it('displays mutation rules correctly', () => {
    render(<PolicyViewer policy={mockPolicy} metadata={mockMetadata} />);

    // Append only and event required should be true
    const trueElements = screen.getAllByText('true');
    expect(trueElements.length).toBeGreaterThan(0);
  });

  it('displays export formats correctly', () => {
    render(<PolicyViewer policy={mockPolicy} metadata={mockMetadata} />);

    expect(screen.getByText('hdf5')).toBeInTheDocument();
    expect(screen.getByText('json')).toBeInTheDocument();
    expect(screen.getByText('markdown')).toBeInTheDocument();
  });

  it('displays metadata correctly', () => {
    render(<PolicyViewer policy={mockPolicy} metadata={mockMetadata} />);

    expect(screen.getByText('fi.policy.yaml')).toBeInTheDocument();
    expect(screen.getByText('1.0')).toBeInTheDocument();
  });

  it('handles missing metadata gracefully', () => {
    render(<PolicyViewer policy={mockPolicy} />);

    // Should still render without metadata
    expect(screen.getByText('Policy Snapshot')).toBeInTheDocument();
  });
});

describe('GlobalPolicyBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows banner when egress is denied and PHI is disabled', async () => {
    const mockResponse = {
      policy: {
        sovereignty: {
          egress: {
            default: 'deny',
          },
        },
        privacy: {
          phi: {
            enabled: false,
          },
        },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<GlobalPolicyBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Modo Seguro/i)).toBeInTheDocument();
      expect(screen.getByText(/Egreso bloqueado, sin redacción PHI/i)).toBeInTheDocument();
    });
  });

  it('hides banner when egress is allowed', async () => {
    const mockResponse = {
      policy: {
        sovereignty: {
          egress: {
            default: 'allow',
          },
        },
        privacy: {
          phi: {
            enabled: false,
          },
        },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<GlobalPolicyBanner />);

    await waitFor(() => {
      expect(screen.queryByText(/Modo Seguro/i)).not.toBeInTheDocument();
    });
  });

  it('hides banner when PHI is enabled', async () => {
    const mockResponse = {
      policy: {
        sovereignty: {
          egress: {
            default: 'deny',
          },
        },
        privacy: {
          phi: {
            enabled: true,
          },
        },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    render(<GlobalPolicyBanner />);

    await waitFor(() => {
      expect(screen.queryByText(/Modo Seguro/i)).not.toBeInTheDocument();
    });
  });

  it('hides banner on fetch error', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<GlobalPolicyBanner />);

    await waitFor(() => {
      expect(screen.queryByText(/Modo Seguro/i)).not.toBeInTheDocument();
    });
  });

  it('dismisses banner when X button is clicked', async () => {
    const mockResponse = {
      policy: {
        sovereignty: {
          egress: {
            default: 'deny',
          },
        },
        privacy: {
          phi: {
            enabled: false,
          },
        },
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { container } = render(<GlobalPolicyBanner />);

    await waitFor(() => {
      expect(screen.getByText(/Modo Seguro/i)).toBeInTheDocument();
    });

    // Click dismiss button
    const dismissButton = container.querySelector('button[title="Cerrar"]');
    expect(dismissButton).toBeInTheDocument();
    dismissButton?.click();

    // Banner should be hidden
    await waitFor(() => {
      expect(screen.queryByText(/Modo Seguro/i)).not.toBeInTheDocument();
    });
  });
});
