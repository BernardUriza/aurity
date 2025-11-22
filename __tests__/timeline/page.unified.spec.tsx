/**
 * Unified Timeline Page Tests
 *
 * Card: FI-PHIL-DOC-014
 * Tests for the refactored timeline page using useUnifiedTimeline hook.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TimelinePage from '@/app/timeline/page';

// ============================================================================
// Mocks
// ============================================================================

// Mock Auth0
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(() => ({
    user: { sub: 'test-user-123' },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

// Mock the unified timeline hook
const mockLoadMore = vi.fn();
const mockRefresh = vi.fn();
const mockSetEventType = vi.fn();
const mockSetTimeRangePreset = vi.fn();

vi.mock('@/hooks/useUnifiedTimeline', () => ({
  useUnifiedTimeline: vi.fn(() => ({
    events: [],
    stats: null,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: false,
    total: 0,
    chatCount: 0,
    audioCount: 0,
    filters: {
      eventType: 'all',
      preset: null,
      timeRange: { start: null, end: null },
    },
    setEventType: mockSetEventType,
    setTimeRangePreset: mockSetTimeRangePreset,
    setCustomTimeRange: vi.fn(),
    loadMore: mockLoadMore,
    refresh: mockRefresh,
    isAuthenticated: true,
    doctorId: 'test-user-123',
  })),
}));

// Mock EventTimeline component
vi.mock('@/components/audit/EventTimeline', () => ({
  EventTimeline: ({ events }: { events: any[] }) => (
    <div data-testid="event-timeline">
      {events.map((e, i) => (
        <div key={e.id || i} data-testid={`event-${i}`}>
          {e.content}
        </div>
      ))}
    </div>
  ),
}));

// Mock TimelineFilters component
vi.mock('@/components/timeline/TimelineFilters', () => ({
  TimelineFilters: ({ onEventTypeChange, onPresetChange }: any) => (
    <div data-testid="timeline-filters">
      <button onClick={() => onEventTypeChange('chat')} data-testid="filter-chat">
        Chat
      </button>
      <button onClick={() => onEventTypeChange('audio')} data-testid="filter-audio">
        Audio
      </button>
    </div>
  ),
}));

// Mock PageHeader
vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: () => <header data-testid="page-header">Timeline Header</header>,
}));

// Mock timeline config
vi.mock('@/config/page-headers', () => ({
  timelineHeader: vi.fn(() => ({})),
}));

vi.mock('@/lib/timeline-config', () => ({
  unifiedTimelineConfig: {},
}));

// ============================================================================
// Test Helpers
// ============================================================================

const { useUnifiedTimeline } = await import('@/hooks/useUnifiedTimeline');

function mockHookReturn(overrides: Partial<ReturnType<typeof useUnifiedTimeline>>) {
  (useUnifiedTimeline as any).mockReturnValue({
    events: [],
    stats: null,
    isLoading: false,
    isLoadingMore: false,
    error: null,
    hasMore: false,
    total: 0,
    chatCount: 0,
    audioCount: 0,
    filters: {
      eventType: 'all',
      preset: null,
      timeRange: { start: null, end: null },
    },
    setEventType: mockSetEventType,
    setTimeRangePreset: mockSetTimeRangePreset,
    setCustomTimeRange: vi.fn(),
    loadMore: mockLoadMore,
    refresh: mockRefresh,
    isAuthenticated: true,
    doctorId: 'test-user-123',
    ...overrides,
  });
}

// ============================================================================
// Tests
// ============================================================================

describe('TimelinePage (Unified)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHookReturn({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Smoke Test
  // --------------------------------------------------------------------------

  it('renders the page with TimelineFilters', async () => {
    mockHookReturn({ total: 10, chatCount: 5, audioCount: 5 });

    render(<TimelinePage />);

    expect(screen.getByTestId('timeline-filters')).toBeInTheDocument();
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // First Batch Test
  // --------------------------------------------------------------------------

  it('displays events when hook returns data', async () => {
    const mockEvents = Array.from({ length: 20 }, (_, i) => ({
      id: `event-${i}`,
      timestamp: Date.now() / 1000 - i * 60,
      event_type: i % 2 === 0 ? 'chat_user' : 'transcription',
      content: `Event content ${i}`,
      source: i % 2 === 0 ? 'chat' : 'audio',
    }));

    mockHookReturn({
      events: mockEvents,
      total: 20,
      chatCount: 10,
      audioCount: 10,
    });

    render(<TimelinePage />);

    expect(screen.getByTestId('event-timeline')).toBeInTheDocument();
    // Verify events are rendered
    expect(screen.getByTestId('event-0')).toBeInTheDocument();
    expect(screen.getByText('Event content 0')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Error State Test
  // --------------------------------------------------------------------------

  it('shows error state with retry button', async () => {
    mockHookReturn({
      error: 'Error al cargar la memoria longitudinal',
      events: [],
    });

    render(<TimelinePage />);

    expect(screen.getByText('Error al cargar la memoria longitudinal')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Reintentar');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockRefresh).toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // Loading State Test
  // --------------------------------------------------------------------------

  it('shows loading state', async () => {
    mockHookReturn({
      isLoading: true,
      events: [],
    });

    render(<TimelinePage />);

    expect(screen.getByText('Cargando memoria longitudinal...')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Empty State Test
  // --------------------------------------------------------------------------

  it('shows empty state when no events', async () => {
    mockHookReturn({
      events: [],
      total: 0,
      isLoading: false,
    });

    render(<TimelinePage />);

    expect(screen.getByText('Sin eventos en el período seleccionado.')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Filter Change Test
  // --------------------------------------------------------------------------

  it('calls setEventType when filter is clicked', async () => {
    mockHookReturn({ total: 10 });

    render(<TimelinePage />);

    const chatFilter = screen.getByTestId('filter-chat');
    fireEvent.click(chatFilter);

    expect(mockSetEventType).toHaveBeenCalledWith('chat');
  });

  // --------------------------------------------------------------------------
  // Event Type Mapping Test
  // --------------------------------------------------------------------------

  it('normalizes event_type to type for EventTimeline', async () => {
    const mockEvents = [
      {
        id: 'e1',
        timestamp: Date.now() / 1000,
        event_type: 'chat_user',
        content: 'Test message',
        source: 'chat',
      },
    ];

    mockHookReturn({
      events: mockEvents,
      total: 1,
    });

    render(<TimelinePage />);

    // The event should be rendered with normalized type
    expect(screen.getByTestId('event-timeline')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Loading More Indicator Test
  // --------------------------------------------------------------------------

  it('shows loading more indicator when fetching more', async () => {
    mockHookReturn({
      events: [{ id: 'e1', timestamp: 123, event_type: 'chat_user', content: 'Test', source: 'chat' }],
      isLoadingMore: true,
      hasMore: true,
      total: 100,
    });

    render(<TimelinePage />);

    expect(screen.getByText('Cargando más eventos...')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // End of Timeline Test
  // --------------------------------------------------------------------------

  it('shows end indicator when no more events', async () => {
    mockHookReturn({
      events: [{ id: 'e1', timestamp: 123, event_type: 'chat_user', content: 'Test', source: 'chat' }],
      hasMore: false,
      total: 1,
    });

    render(<TimelinePage />);

    expect(screen.getByText(/Fin de la memoria longitudinal/)).toBeInTheDocument();
  });
});
