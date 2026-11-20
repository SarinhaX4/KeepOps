import { describe, expect, it } from '@jest/globals';

import { lastWeekend, last24h } from '@/utils/calendar';
import { buildPeriodSummary, periodSummaryToText, type PeriodInput } from '@/utils/periodSummary';

import { followUp } from './fixtures';

describe('lastWeekend', () => {
  it('on a Friday, returns the previous Friday 19h → Monday 7h (São Paulo)', () => {
    const p = lastWeekend(new Date('2026-11-20T06:00:00Z')); // Fri 20/11 03:00 SP
    expect(p.from.toISOString()).toBe('2026-11-13T22:00:00.000Z');
    expect(p.to.toISOString()).toBe('2026-11-16T10:00:00.000Z');
  });

  it('on Monday after 7h, returns the weekend that just ended', () => {
    const p = lastWeekend(new Date('2026-11-23T12:00:00Z')); // Mon 23/11 09:00 SP
    expect(p.from.toISOString()).toBe('2026-11-20T22:00:00.000Z');
    expect(p.to.toISOString()).toBe('2026-11-23T10:00:00.000Z');
  });

  it('on Monday before 7h, still returns the previous completed weekend', () => {
    const p = lastWeekend(new Date('2026-11-23T08:00:00Z')); // Mon 23/11 05:00 SP
    expect(p.to.toISOString()).toBe('2026-11-16T10:00:00.000Z');
  });

  it('last24h is exactly one day', () => {
    const now = new Date('2026-11-20T12:00:00Z');
    expect(last24h(now).from.toISOString()).toBe('2026-11-19T12:00:00.000Z');
  });
});

describe('buildPeriodSummary', () => {
  // Weekend 13/11 19h → 16/11 07h (SP).
  const from = new Date('2026-11-13T22:00:00Z');
  const to = new Date('2026-11-16T10:00:00Z');

  const data: PeriodInput = {
    changes: [
      {
        id: 'k',
        change_number: 'CHG0012348',
        title: 'Kernel no barramento',
        status: 'validada_com_ressalvas',
        window_start: '2026-11-14T13:00:00Z', // Sat 10h
        window_end: '2026-11-14T15:00:00Z',
        apps: [
          { name: 'Barramento de Integração', results: ['aprovado', 'reprovado', 'aprovado'] },
        ],
      },
      {
        id: 'r',
        change_number: 'CHG0012349',
        title: 'Reinício do IB',
        status: 'validada',
        window_start: '2026-11-15T09:00:00Z', // Sun 6h
        window_end: '2026-11-15T10:00:00Z',
        apps: [{ name: 'Internet Banking', results: ['aprovado'] }],
      },
      {
        id: 'out',
        change_number: 'CHG0000001',
        title: 'Fora do período',
        status: 'validada',
        window_start: '2026-11-18T02:00:00Z',
        window_end: '2026-11-18T03:00:00Z',
        apps: [],
      },
    ],
    shifts: [
      {
        id: 'satDay',
        kind: 'fim_de_semana',
        started_at: '2026-11-14T10:00:00Z',
        ended_at: '2026-11-14T22:00:00Z',
        authorName: 'João Lima',
        status: 'recebido',
      },
      {
        id: 'satNight',
        kind: 'fim_de_semana',
        started_at: '2026-11-14T22:00:00Z',
        ended_at: '2026-11-15T10:00:00Z',
        authorName: 'Ana Souza',
        status: 'recebido',
      },
      {
        id: 'old',
        kind: 'noturno',
        started_at: '2026-11-10T01:00:00Z',
        ended_at: '2026-11-10T10:00:00Z',
        authorName: 'Ana Souza',
        status: 'recebido',
      },
    ],
    incidents: [
      {
        id: 'w',
        external_ticket: 'INC0012340',
        title: 'Fila presa',
        severity: 'sev3',
        status: 'resolvida',
        opened_at: '2026-11-14T14:35:00Z',
        appName: 'Barramento de Integração',
      },
      {
        id: 'open',
        external_ticket: 'INC0012345',
        title: 'API 503',
        severity: 'sev2',
        status: 'aberta',
        opened_at: '2026-11-19T03:00:00Z',
        appName: 'API de Pagamentos',
      },
      {
        id: 'oldResolved',
        external_ticket: 'INC0000001',
        title: 'Antiga',
        severity: 'sev4',
        status: 'resolvida',
        opened_at: '2026-11-01T03:00:00Z',
        appName: null,
      },
    ],
    calls: [],
    followUps: [followUp({ id: 'f', title: 'Reprocessar fila', sourceLabel: 'CHG0012348' })],
  };

  const s = buildPeriodSummary(from, to, data);

  it('includes GMUDs from every shift in the interval (acceptance criterion)', () => {
    expect(s.totals).toMatchObject({ changes: 2, validated: 1, withCaveats: 1, failed: 0 });
    expect(s.groups.map((g) => [g.shift?.id, g.changes.map((c) => c.change_number)])).toEqual([
      ['satDay', ['CHG0012348']],
      ['satNight', ['CHG0012349']],
    ]);
  });

  it('keeps incidents opened in the period plus still-open ones', () => {
    expect(s.incidents.map((i) => i.id)).toEqual(['w', 'open']);
  });

  it('aggregates results per application, failures first', () => {
    expect(s.apps[0]).toEqual({
      name: 'Barramento de Integração',
      changes: 1,
      approved: 2,
      failed: 1,
      pending: 0,
    });
  });

  it('puts GMUDs without a matching shift in a separate group', () => {
    const noShift = buildPeriodSummary(from, to, { ...data, shifts: [] });
    expect(noShift.groups).toHaveLength(1);
    expect(noShift.groups[0]?.shift).toBeNull();
  });

  it('exports shareable text', () => {
    const text = periodSummaryToText(s, 'Resumo do fim de semana');
    expect(text).toContain('*Resumo do fim de semana — KeepOps*');
    expect(text).toContain('13/11 19:00 → 16/11 07:00');
    expect(text).toContain('CHG0012348 — Kernel no barramento [Com ressalvas]');
    expect(text).toContain('Reprocessar fila (CHG0012348) — sem responsável');
  });
});
