import type { FollowUpItem } from '@/services/followUps';
import type { Enums } from '@/types/database';

import { formatShortDateTime, formatTime } from './format';
import { validationProgress } from './home';
import { shiftKindLabel } from './shiftKind';

type ChangeStatus = Enums<'change_status'>;

export type PeriodInput = {
  changes: {
    id: string;
    change_number: string;
    title: string;
    status: ChangeStatus;
    window_start: string;
    window_end: string;
    apps: { name: string; results: Enums<'validation_result'>[] }[];
  }[];
  shifts: {
    id: string;
    kind: Enums<'shift_kind'>;
    started_at: string;
    ended_at: string | null;
    authorName: string | null;
    status: Enums<'shift_status'>;
  }[];
  incidents: {
    id: string;
    external_ticket: string | null;
    title: string;
    severity: Enums<'incident_severity'>;
    status: Enums<'incident_status'>;
    opened_at: string;
    appName: string | null;
  }[];
  calls: {
    incidentId: string;
    ticket: string | null;
    contact: string | null;
    channel: string | null;
    createdAt: string;
  }[];
  followUps: FollowUpItem[];
};

export type PeriodChange = PeriodInput['changes'][number] & { failedSteps: number };

export type PeriodSummary = {
  from: string;
  to: string;
  totals: {
    changes: number;
    validated: number;
    withCaveats: number;
    failed: number;
    incidents: number;
    openFollowUps: number;
    unansweredCalls: number;
  };
  /** GMUDs grouped by the shift whose time range contains the window start. */
  groups: { shift: PeriodInput['shifts'][number] | null; changes: PeriodChange[] }[];
  /** Aggregated result per application across the period. */
  apps: { name: string; changes: number; approved: number; failed: number; pending: number }[];
  incidents: PeriodInput['incidents'];
  calls: PeriodInput['calls'];
  followUps: PeriodInput['followUps'];
};

const inRange = (iso: string, from: Date, to: Date) => {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t < to.getTime();
};

/**
 * Consolidates several shifts into one view (spec section 7): GMUDs with a window
 * in the interval, the interval's shifts, its incidents (plus still-open ones) and
 * open follow-ups. Derived, never stored.
 */
export function buildPeriodSummary(from: Date, to: Date, data: PeriodInput): PeriodSummary {
  const changes: PeriodChange[] = data.changes
    .filter((c) => c.status !== 'cancelada')
    .filter((c) => new Date(c.window_start) < to && new Date(c.window_end) > from)
    .sort((a, b) => a.window_start.localeCompare(b.window_start))
    .map((c) => ({
      ...c,
      failedSteps: c.apps.reduce((n, a) => n + validationProgress(a.results).failed, 0),
    }));

  const shifts = data.shifts
    .filter((s) => new Date(s.started_at) < to && new Date(s.ended_at ?? to.toISOString()) > from)
    .sort((a, b) => a.started_at.localeCompare(b.started_at));

  const shiftOf = (c: PeriodChange) =>
    shifts.find((s) => {
      const start = new Date(s.started_at).getTime();
      const end = new Date(s.ended_at ?? to.toISOString()).getTime();
      const t = new Date(c.window_start).getTime();
      return t >= start && t < end;
    }) ?? null;

  const groups: PeriodSummary['groups'] = shifts.map((s) => ({ shift: s, changes: [] }));
  const orphan: PeriodChange[] = [];
  for (const c of changes) {
    const s = shiftOf(c);
    const g = s ? groups.find((x) => x.shift?.id === s.id) : undefined;
    if (g) g.changes.push(c);
    else orphan.push(c);
  }
  if (orphan.length) groups.push({ shift: null, changes: orphan });

  const appMap = new Map<string, PeriodSummary['apps'][number]>();
  for (const c of changes) {
    for (const a of c.apps) {
      const p = validationProgress(a.results);
      const cur = appMap.get(a.name) ?? {
        name: a.name,
        changes: 0,
        approved: 0,
        failed: 0,
        pending: 0,
      };
      cur.changes += 1;
      cur.approved += p.approved;
      cur.failed += p.failed;
      cur.pending += p.pending;
      appMap.set(a.name, cur);
    }
  }

  const incidents = data.incidents
    .filter((i) => inRange(i.opened_at, from, to) || i.status !== 'resolvida')
    .sort((a, b) => a.opened_at.localeCompare(b.opened_at));

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      changes: changes.length,
      validated: changes.filter((c) => c.status === 'validada').length,
      withCaveats: changes.filter((c) => c.status === 'validada_com_ressalvas').length,
      failed: changes.filter((c) => c.status === 'reprovada').length,
      incidents: incidents.length,
      openFollowUps: data.followUps.length,
      unansweredCalls: data.calls.length,
    },
    groups: groups.filter((g) => g.changes.length > 0 || g.shift !== null),
    apps: [...appMap.values()].sort((a, b) => b.failed - a.failed || a.name.localeCompare(b.name)),
    incidents,
    calls: data.calls,
    followUps: data.followUps,
  };
}

const statusText: Record<ChangeStatus, string> = {
  agendada: 'Agendada',
  aguardando_liberacao: 'Aguardando liberação',
  em_validacao: 'Em validação',
  validada: 'Validada',
  validada_com_ressalvas: 'Com ressalvas',
  reprovada: 'Reprovada',
  cancelada: 'Cancelada',
};

/** Plain text for Share. */
export function periodSummaryToText(s: PeriodSummary, title: string): string {
  const t = s.totals;
  const lines = [
    `*${title} — KeepOps*`,
    `${formatShortDateTime(s.from)} → ${formatShortDateTime(s.to)}`,
    '',
    `GMUDs: ${t.changes} · validadas: ${t.validated} · com ressalvas: ${t.withCaveats} · reprovadas: ${t.failed}`,
    `Ocorrências: ${t.incidents} · acionamentos sem resposta: ${t.unansweredCalls} · pendências abertas: ${t.openFollowUps}`,
  ];
  for (const g of s.groups) {
    const head = g.shift
      ? `Turno ${shiftKindLabel[g.shift.kind].toLowerCase()} · ${g.shift.authorName ?? ''} · ${formatShortDateTime(g.shift.started_at)}`
      : 'Fora de turno registrado';
    lines.push('', `*${head}*`);
    if (!g.changes.length) lines.push('Sem GMUDs.');
    for (const c of g.changes) {
      lines.push(
        `• ${c.change_number} — ${c.title} [${statusText[c.status]}] ${formatTime(c.window_start)}`,
      );
    }
  }
  if (s.incidents.length) {
    lines.push('', '*Ocorrências*');
    s.incidents.forEach((i) =>
      lines.push(
        `• ${i.severity.toUpperCase()} ${i.external_ticket ?? ''} — ${i.title} [${i.status === 'resolvida' ? 'resolvida' : 'aberta'}]`,
      ),
    );
  }
  lines.push('', '*Pendências abertas*');
  if (!s.followUps.length) lines.push('Nenhuma.');
  s.followUps.forEach((f) =>
    lines.push(
      `• ${f.title}${f.sourceLabel ? ` (${f.sourceLabel})` : ''} — ${f.assigneeName ?? 'sem responsável'}`,
    ),
  );
  lines.push('', '_Gerado pelo KeepOps · ambiente demonstrativo, dados fictícios._');
  return lines.join('\n');
}
