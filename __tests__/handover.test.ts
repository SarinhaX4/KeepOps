import { describe, expect, it } from '@jest/globals';

import { buildHandover, handoverToText, isHandover, type HandoverInput } from '@/utils/handover';

import { followUp } from './fixtures';

const input: HandoverInput = {
  generatedAt: new Date('2026-11-20T10:00:00Z'),
  shift: {
    id: 's1',
    kind: 'noturno',
    startedAt: '2026-11-20T01:00:00Z',
    endedAt: '2026-11-20T10:00:00Z',
    authorName: 'Ana Souza',
  },
  changes: [
    {
      id: 'c2',
      change_number: 'CHG0012346',
      title: 'Patch no OHS',
      status: 'validada',
      window_start: '2026-11-20T02:00:00Z',
      window_end: '2026-11-20T04:00:00Z',
      apps: [
        {
          name: 'Internet Banking',
          results: ['aprovado', 'aprovado'],
          lastCheck: { http_status: 200, latency_ms: 139, ok: true },
        },
      ],
    },
    {
      id: 'c1',
      change_number: 'CHG0012345',
      title: 'Atualização de Java',
      status: 'em_validacao',
      window_start: '2026-11-20T01:30:00Z',
      window_end: '2026-11-20T05:00:00Z',
      apps: [
        {
          name: 'API de Pagamentos',
          results: ['reprovado', 'pendente'],
          lastCheck: { http_status: 503, latency_ms: 80, ok: false },
        },
      ],
    },
    {
      id: 'c3',
      change_number: 'CHG0012399',
      title: 'Cancelada',
      status: 'cancelada',
      window_start: '2026-11-20T03:00:00Z',
      window_end: '2026-11-20T04:00:00Z',
      apps: [],
    },
  ],
  incidents: [
    {
      id: 'i1',
      external_ticket: 'INC0012345',
      title: 'API 503',
      severity: 'sev2',
      status: 'em_acompanhamento',
      appName: 'API de Pagamentos',
      opened_at: '2026-11-20T03:00:00Z',
    },
  ],
  calls: [
    {
      incidentId: 'i1',
      ticket: 'INC0012345',
      contact: 'Plantão Middleware',
      channel: 'Telefone',
      createdAt: '2026-11-20T03:05:00Z',
    },
  ],
  followUps: [
    followUp({ id: 'f1', title: 'Reprocessar fila do barramento', sourceLabel: 'CHG0012348' }),
  ],
  notes: '  Executor pediu nova janela  ',
  nextSteps: 'Revalidar a API às 7h',
};

describe('buildHandover', () => {
  const h = buildHandover(input);

  it('is a versioned snapshot', () => {
    expect(isHandover(h)).toBe(true);
    expect(isHandover({ seeded: true })).toBe(false);
    expect(h.generatedAt).toBe('2026-11-20T10:00:00.000Z');
  });

  it('lists window GMUDs chronologically and drops cancelled ones', () => {
    expect(h.changes.map((c) => c.number)).toEqual(['CHG0012345', 'CHG0012346']);
  });

  it('summarizes each application from its checklist and last check', () => {
    const api = h.changes[0]?.apps[0];
    expect(api).toMatchObject({
      approved: 0,
      failed: 1,
      pending: 1,
      total: 2,
      check: { httpStatus: 503, ok: false },
    });
  });

  it('computes totals', () => {
    expect(h.totals).toEqual({
      changes: 2,
      validated: 1,
      failed: 0,
      inProgress: 1,
      openIncidents: 1,
      unansweredCalls: 1,
      openFollowUps: 1,
    });
  });

  it('keeps open follow-ups with their origin and trims free text', () => {
    expect(h.followUps).toEqual([
      {
        id: 'f1',
        title: 'Reprocessar fila do barramento',
        assigneeName: null,
        origin: 'CHG0012348',
      },
    ]);
    expect(h.notes).toBe('Executor pediu nova janela');
  });

  it('is pure: same input, same output', () => {
    expect(buildHandover(input)).toEqual(h);
  });
});

describe('handoverToText', () => {
  const text = handoverToText(buildHandover(input));

  it('produces a shareable text with every section', () => {
    expect(text).toContain('*Passagem de plantão — KeepOps*');
    expect(text).toContain('Turno noturno · Ana Souza');
    expect(text).toContain('CHG0012345 — Atualização de Java [Em validação]');
    expect(text).toContain('API de Pagamentos: 0/2 ✓ · 1 ✗ · 1 pendente(s) · HTTP 503');
    expect(text).toContain('*Acionamentos sem resposta (1)*');
    expect(text).toContain('Reprocessar fila do barramento (CHG0012348) — sem responsável');
    expect(text).toContain('*Próximos passos*\nRevalidar a API às 7h');
  });

  it('shows times in São Paulo', () => {
    expect(text).toContain('19/11 22:00 → 20/11 07:00');
  });
});
