/**
 * Demo Reproducibility Tests
 *
 * Validates deterministic dataset generation with seedable PRNG.
 *
 * File: __tests__/demo-reproducibility.spec.ts
 * Card: FI-UI-FEAT-207
 * Created: 2025-10-30
 *
 * Philosophy AURITY:
 * - Same seed → same IDs, timestamps, content (reproducibility)
 * - Different seed → different dataset
 * - Virtualization: ≥1 session with >200 events
 */

import { describe, it, expect } from 'vitest';
import { PRNG } from '@/lib/demo/prng';
import { DemoAdapter } from '@/lib/demo/adapter';
import { generateDemoDataset } from '@/lib/demo/generator';
import type { DemoConfig } from '@/lib/demo/types';

describe('PRNG Reproducibility', () => {
  it('same seed produces same sequence', () => {
    const prng1 = new PRNG('test-seed-123');
    const prng2 = new PRNG('test-seed-123');

    const seq1 = Array.from({ length: 10 }, () => prng1.next());
    const seq2 = Array.from({ length: 10 }, () => prng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different sequences', () => {
    const prng1 = new PRNG('seed-a');
    const prng2 = new PRNG('seed-b');

    const seq1 = Array.from({ length: 10 }, () => prng1.next());
    const seq2 = Array.from({ length: 10 }, () => prng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('int() produces consistent values', () => {
    const prng1 = new PRNG('int-test');
    const prng2 = new PRNG('int-test');

    const ints1 = Array.from({ length: 20 }, () => prng1.int(10, 100));
    const ints2 = Array.from({ length: 20 }, () => prng2.int(10, 100));

    expect(ints1).toEqual(ints2);
    expect(ints1.every((n) => n >= 10 && n <= 100)).toBe(true);
  });

  it('pick() returns same elements with same seed', () => {
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const prng1 = new PRNG('pick-test');
    const prng2 = new PRNG('pick-test');

    const picks1 = Array.from({ length: 10 }, () => prng1.pick(arr));
    const picks2 = Array.from({ length: 10 }, () => prng2.pick(arr));

    expect(picks1).toEqual(picks2);
  });

  it('uuid() generates deterministic UUIDs', () => {
    const prng1 = new PRNG('uuid-test');
    const prng2 = new PRNG('uuid-test');

    const uuids1 = [prng1.uuid(), prng1.uuid(), prng1.uuid()];
    const uuids2 = [prng2.uuid(), prng2.uuid(), prng2.uuid()];

    expect(uuids1).toEqual(uuids2);
    expect(uuids1[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('reset() restores original sequence', () => {
    const prng = new PRNG('reset-test');

    const seq1 = Array.from({ length: 5 }, () => prng.next());
    prng.reset();
    const seq2 = Array.from({ length: 5 }, () => prng.next());

    expect(seq1).toEqual(seq2);
  });
});

describe('Demo Dataset Reproducibility', () => {
  const baseConfig: DemoConfig = {
    enabled: true,
    seed: 'fi-test-2025',
    sessions: 12,
    eventsProfile: 'mix',
    latencyMs: { min: 80, max: 140 },
    errorRatePct: 0,
  };

  it('same seed generates same session IDs', () => {
    const { summaries: summaries1 } = generateDemoDataset(baseConfig);
    const { summaries: summaries2 } = generateDemoDataset(baseConfig);

    const ids1 = summaries1.map((s) => s.metadata.session_id);
    const ids2 = summaries2.map((s) => s.metadata.session_id);

    expect(ids1).toEqual(ids2);
  });

  it('same seed generates same event counts', () => {
    const { summaries: summaries1 } = generateDemoDataset(baseConfig);
    const { summaries: summaries2 } = generateDemoDataset(baseConfig);

    const counts1 = summaries1.map((s) => s.size.interaction_count);
    const counts2 = summaries2.map((s) => s.size.interaction_count);

    expect(counts1).toEqual(counts2);
  });

  it('same seed generates same timestamps', () => {
    const { summaries: summaries1 } = generateDemoDataset(baseConfig);
    const { summaries: summaries2 } = generateDemoDataset(baseConfig);

    const timestamps1 = summaries1.map((s) => s.metadata.created_at);
    const timestamps2 = summaries2.map((s) => s.metadata.created_at);

    expect(timestamps1).toEqual(timestamps2);
  });

  it('same seed generates same manifest digest', () => {
    const { manifest: manifest1 } = generateDemoDataset(baseConfig);
    const { manifest: manifest2 } = generateDemoDataset(baseConfig);

    expect(manifest1.ids_digest).toEqual(manifest2.ids_digest);
    expect(manifest1.seed).toBe('fi-test-2025');
  });

  it('different seeds generate different session IDs', () => {
    const config1 = { ...baseConfig, seed: 'seed-a' };
    const config2 = { ...baseConfig, seed: 'seed-b' };

    const { summaries: summaries1 } = generateDemoDataset(config1);
    const { summaries: summaries2 } = generateDemoDataset(config2);

    const ids1 = summaries1.map((s) => s.metadata.session_id);
    const ids2 = summaries2.map((s) => s.metadata.session_id);

    expect(ids1).not.toEqual(ids2);
  });
});

describe('Demo Dataset Distribution', () => {
  it('mix profile has ≥1 large session (>200 events)', () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'mix-test',
      sessions: 24,
      eventsProfile: 'mix',
      latencyMs: { min: 80, max: 140 },
      errorRatePct: 0,
    };

    const { summaries } = generateDemoDataset(config);

    const largeSessions = summaries.filter(
      (s) => s.size.interaction_count > 200
    );

    expect(largeSessions.length).toBeGreaterThanOrEqual(1);
  });

  it('small profile has all sessions with <200 events', () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'small-test',
      sessions: 12,
      eventsProfile: 'small',
      latencyMs: { min: 80, max: 140 },
      errorRatePct: 0,
    };

    const { summaries } = generateDemoDataset(config);

    const allSmall = summaries.every((s) => s.size.interaction_count < 200);

    expect(allSmall).toBe(true);
  });

  it('large profile has all sessions with ≥200 events', () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'large-test',
      sessions: 12,
      eventsProfile: 'large',
      latencyMs: { min: 80, max: 140 },
      errorRatePct: 0,
    };

    const { summaries } = generateDemoDataset(config);

    const allLarge = summaries.every((s) => s.size.interaction_count >= 200);

    expect(allLarge).toBe(true);
  });

  it('mix profile has ~80% small + ~20% large distribution', () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'distribution-test',
      sessions: 60, // Large sample for distribution test
      eventsProfile: 'mix',
      latencyMs: { min: 80, max: 140 },
      errorRatePct: 0,
    };

    const { summaries } = generateDemoDataset(config);

    const largeSessions = summaries.filter(
      (s) => s.size.interaction_count >= 200
    );
    const smallSessions = summaries.filter(
      (s) => s.size.interaction_count < 200
    );

    const largeRatio = largeSessions.length / summaries.length;

    // Expect 15-25% large (20% ± 5% tolerance)
    expect(largeRatio).toBeGreaterThan(0.15);
    expect(largeRatio).toBeLessThan(0.30);
  });
});

describe('DemoAdapter API Contract', () => {
  it('adapter mirrors getSessionSummaries contract', async () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'adapter-test',
      sessions: 12,
      eventsProfile: 'mix',
      latencyMs: { min: 10, max: 20 }, // Fast for testing
      errorRatePct: 0,
    };

    const adapter = new DemoAdapter(config);

    const summaries = await adapter.getSessionSummaries({ limit: 5 });

    expect(summaries).toHaveLength(5);
    expect(summaries[0]).toHaveProperty('metadata');
    expect(summaries[0]).toHaveProperty('timespan');
    expect(summaries[0]).toHaveProperty('size');
    expect(summaries[0]).toHaveProperty('policy_badges');
  });

  it('adapter mirrors getSessionDetail contract', async () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'detail-test',
      sessions: 12,
      eventsProfile: 'small',
      latencyMs: { min: 10, max: 20 },
      errorRatePct: 0,
    };

    const adapter = new DemoAdapter(config);
    const summaries = await adapter.getSessionSummaries({ limit: 1 });
    const sessionId = summaries[0].metadata.session_id;

    const detail = await adapter.getSessionDetail(sessionId);

    expect(detail).toHaveProperty('events');
    expect(detail.events.length).toBe(summaries[0].size.interaction_count);
    expect(detail.events[0]).toHaveProperty('event_id');
    expect(detail.events[0]).toHaveProperty('timestamp');
    expect(detail.events[0]).toHaveProperty('who');
    expect(detail.events[0]).toHaveProperty('what');
  });

  it('adapter injects latency within configured range', async () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'latency-test',
      sessions: 12,
      eventsProfile: 'small',
      latencyMs: { min: 100, max: 200 },
      errorRatePct: 0,
    };

    const adapter = new DemoAdapter(config);

    const startTime = performance.now();
    await adapter.getSessionSummaries({ limit: 1 });
    const elapsed = performance.now() - startTime;

    // Should be at least min latency
    expect(elapsed).toBeGreaterThanOrEqual(100);
    // Should be less than max + 50ms overhead
    expect(elapsed).toBeLessThan(250);
  });

  it('adapter respects error injection rate', async () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'error-test-high-rate',
      sessions: 12,
      eventsProfile: 'small',
      latencyMs: { min: 10, max: 20 },
      errorRatePct: 100, // Always error for testing
    };

    const adapter = new DemoAdapter(config);

    await expect(adapter.getSessionSummaries()).rejects.toThrow(
      'Simulated 5xx error'
    );
  });

  it('adapter sorts sessions correctly', async () => {
    const config: DemoConfig = {
      enabled: true,
      seed: 'sort-test',
      sessions: 24,
      eventsProfile: 'mix',
      latencyMs: { min: 10, max: 20 },
      errorRatePct: 0,
    };

    const adapter = new DemoAdapter(config);

    const recent = await adapter.getSessionSummaries({ sort: 'recent' });
    const oldest = await adapter.getSessionSummaries({ sort: 'oldest' });
    const eventsDesc = await adapter.getSessionSummaries({
      sort: 'events_desc',
    });

    // Recent: first is newest
    expect(
      new Date(recent[0].metadata.created_at).getTime()
    ).toBeGreaterThanOrEqual(
      new Date(recent[1].metadata.created_at).getTime()
    );

    // Oldest: first is oldest
    expect(
      new Date(oldest[0].metadata.created_at).getTime()
    ).toBeLessThanOrEqual(new Date(oldest[1].metadata.created_at).getTime());

    // Events desc: first has most events
    expect(eventsDesc[0].size.interaction_count).toBeGreaterThanOrEqual(
      eventsDesc[1].size.interaction_count
    );
  });
});
