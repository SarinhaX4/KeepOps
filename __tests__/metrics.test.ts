import { describe, expect, it } from '@jest/globals';

import {
  ageBucket,
  changeFailureRate,
  formatDuration,
  formatRate,
  matchesFilter,
  meanTimeToRestore,
  type MetricsChange,
  type MetricsIncident,
} from '@/utils/metrics';

// Wed 18/11 23:00 SP (weekday) and Sat 21/11 10:00 SP (weekend).
const WEEKDAY = '2026-11-19T02:00:00Z';
const WEEKEND = '2026-11-21T13:00:00Z';

const change = (
  id: string,
  status: MetricsChange['status'],
  window_start = WEEKDAY,
): MetricsChange => ({
  id,
  status,
  window_start,
});

const incident = (p: Partial<MetricsIncident> & { id: string }): MetricsIncident => ({
  change_id: null,
  severity: 'sev3',
  status: 'resolvida',
  opened_at: '2026-11-19T03:00:00Z',
  resolved_at: '2026-11-19T04:00:00Z',
  ...p,
});

describe('matchesFilter', () => {
  it('splits weekday × weekend by the GMUD window (São Paulo)', () => {
    expect(matchesFilter(WEEKDAY, 'weekday')).toBe(true);
    expect(matchesFilter(WEEKDAY, 'weekend')).toBe(false);
    expect(matchesFilter(WEEKEND, 'weekend')).toBe(true);
    expect(matchesFilter(WEEKEND, 'all')).toBe(true);
  });
});

describe('changeFailureRate', () => {
  const changes = [
    change('a', 'validada'),
    change('b', 'reprovada'),
    change('c', 'validada_com_ressalvas'),
    change('d', 'validada'), // has a linked incident → counts as failure
    change('e', 'em_validacao'), // not finalized → ignored
    change('f', 'cancelada'), // ignored
    change('g', 'validada', WEEKEND),
  ];
  const incidents = [
    incident({ id: 'i1', change_id: 'd' }),
    incident({ id: 'i2', change_id: 'b' }),
  ];

  it('counts reprovada + com ressalvas + GMUDs with incident over finalized ones', () => {
    const r = changeFailureRate(changes, incidents);
    expect(r).toEqual({ finalized: 5, failed: 3, rate: 3 / 5 });
  });

  it('does not count a GMUD twice when it matches two rules', () => {
    // "b" is reprovada AND has an incident.
    expect(changeFailureRate([change('b', 'reprovada')], incidents).failed).toBe(1);
  });

  it('applies the weekday × weekend filter', () => {
    expect(changeFailureRate(changes, incidents, 'weekend')).toEqual({
      finalized: 1,
      failed: 0,
      rate: 0,
    });
    expect(changeFailureRate(changes, incidents, 'weekday').finalized).toBe(4);
  });

  it('returns null rate when nothing is finalized', () => {
    expect(changeFailureRate([change('x', 'agendada')], []).rate).toBeNull();
  });

  it('changes when data changes (acceptance criterion)', () => {
    const before = changeFailureRate([change('a', 'validada')], []).rate;
    const after = changeFailureRate([change('a', 'validada'), change('b', 'reprovada')], []).rate;
    expect(before).toBe(0);
    expect(after).toBe(0.5);
  });
});

describe('meanTimeToRestore', () => {
  it('averages resolved − opened of resolved incidents only', () => {
    const incidents = [
      incident({ id: '1', opened_at: '2026-11-19T03:00:00Z', resolved_at: '2026-11-19T03:30:00Z' }), // 30
      incident({ id: '2', opened_at: '2026-11-19T03:00:00Z', resolved_at: '2026-11-19T04:30:00Z' }), // 90
      incident({ id: '3', status: 'aberta', resolved_at: null }),
    ];
    expect(meanTimeToRestore(incidents, new Map())).toEqual({ resolved: 2, minutes: 60 });
  });

  it('filters by the linked GMUD window when present', () => {
    const windows = new Map([['w', WEEKEND]]);
    const incidents = [
      incident({
        id: '1',
        change_id: 'w',
        opened_at: WEEKDAY,
        resolved_at: '2026-11-19T02:20:00Z',
      }),
      incident({ id: '2' }),
    ];
    expect(meanTimeToRestore(incidents, windows, 'weekend')).toEqual({ resolved: 1, minutes: 20 });
    expect(meanTimeToRestore(incidents, windows, 'weekday').resolved).toBe(1);
  });

  it('returns null without resolved incidents', () => {
    expect(meanTimeToRestore([], new Map()).minutes).toBeNull();
  });
});

describe('formatting helpers', () => {
  it('formats rate and duration', () => {
    expect(formatRate(0.123)).toBe('12%');
    expect(formatRate(null)).toBe('—');
    expect(formatDuration(45)).toBe('45 min');
    expect(formatDuration(85)).toBe('1 h 25');
  });

  it('buckets follow-up age', () => {
    const now = new Date('2026-11-20T12:00:00Z');
    expect(ageBucket('2026-11-20T01:00:00Z', now)).toBe('< 1 dia');
    expect(ageBucket('2026-11-18T12:00:00Z', now)).toBe('1–3 dias');
    expect(ageBucket('2026-11-10T12:00:00Z', now)).toBe('> 3 dias');
  });
});
