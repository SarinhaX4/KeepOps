import type { Enums } from '@/types/database';

import { formatShortDateTime, formatTime } from './format';
import { validationProgress } from './home';
import { shiftKindLabel } from './shiftKind';

type ChangeStatus = Enums<'change_status'>;

/* ------------------------------------------------------------------ */
/* Input: raw records already loaded from the database                 */
/* ------------------------------------------------------------------ */

export type HandoverInput = {
  generatedAt: Date;
  shift: {
    id: string;
    kind: Enums<'shift_kind'>;
    startedAt: string;
    endedAt: string | null;
    authorName: string;
  };
  changes: {
    id: string;
    change_number: string;
    title: string;
    status: ChangeStatus;
    window_start: string;
    window_end: string;
    apps: {
      name: string;
      results: Enums<'validation_result'>[];
      lastCheck: { http_status: number | null; latency_ms: number | null; ok: boolean } | null;
    }[];
  }[];
  incidents: {
    id: string;
    external_ticket: string | null;
    title: string;
    severity: Enums<'incident_severity'>;
    status: Enums<'incident_status'>;
    appName: string | null;
    opened_at: string;
  }[];
  calls: {
    incidentId: string;
    ticket: string | null;
    contact: string | null;
    channel: string | null;
    createdAt: string;
  }[];
  followUps: {
    id: string;
    title: string;
    assigneeName: string | null;
    sourceLabel: string | null;
    appShortName: string | null;
  }[];
  notes: string;
  nextSteps: string;
};

/* ------------------------------------------------------------------ */
/* Output: the handover snapshot (saved in shifts.handover_snapshot)   */
/* ------------------------------------------------------------------ */

export type HandoverApp = {
  name: string;
  approved: number;
  failed: number;
  notApplicable: number;
  pending: number;
  total: number;
  check: { httpStatus: number | null; latencyMs: number | null; ok: boolean } | null;
};

export type Handover = {
  version: 1;
  generatedAt: string;
  shift: HandoverInput['shift'];
  totals: {
    changes: number;
    validated: number;
    failed: number;
    inProgress: number;
    openIncidents: number;
    unansweredCalls: number;
    openFollowUps: number;
  };
  changes: {
    id: string;
    number: string;
    title: string;
    status: ChangeStatus;
    windowStart: string;
    windowEnd: string;
    apps: HandoverApp[];
  }[];
  incidents: {
    id: string;
    ticket: string | null;
    title: string;
    severity: Enums<'incident_severity'>;
    status: Enums<'incident_status'>;
    appName: string | null;
  }[];
  unansweredCalls: {
    incidentId: string;
    ticket: string | null;
    contact: string | null;
    channel: string | null;
    since: string;
  }[];
  followUps: { id: string; title: string; assigneeName: string | null; origin: string | null }[];
  notes: string;
  nextSteps: string;
};

const DONE_OK: ChangeStatus[] = ['validada', 'validada_com_ressalvas'];
const IN_PROGRESS: ChangeStatus[] = ['agendada', 'aguardando_liberacao', 'em_validacao'];

/**
 * Builds the shift handover from the shift's records — no typing needed (spec section 7).
 * Pure function: same input, same output; the snapshot is what the next person receives.
 */
export function buildHandover(input: HandoverInput): Handover {
  const changes = [...input.changes]
    .filter((c) => c.status !== 'cancelada')
    .sort((a, b) => a.window_start.localeCompare(b.window_start))
    .map((c) => ({
      id: c.id,
      number: c.change_number,
      title: c.title,
      status: c.status,
      windowStart: c.window_start,
      windowEnd: c.window_end,
      apps: c.apps.map((a) => {
        const p = validationProgress(a.results);
        return {
          name: a.name,
          approved: p.approved,
          failed: p.failed,
          notApplicable: p.notApplicable,
          pending: p.pending,
          total: p.total,
          check: a.lastCheck
            ? {
                httpStatus: a.lastCheck.http_status,
                latencyMs: a.lastCheck.latency_ms,
                ok: a.lastCheck.ok,
              }
            : null,
        };
      }),
    }));

  const incidents = input.incidents.map((i) => ({
    id: i.id,
    ticket: i.external_ticket,
    title: i.title,
    severity: i.severity,
    status: i.status,
    appName: i.appName,
  }));

  return {
    version: 1,
    generatedAt: input.generatedAt.toISOString(),
    shift: input.shift,
    totals: {
      changes: changes.length,
      validated: changes.filter((c) => DONE_OK.includes(c.status)).length,
      failed: changes.filter((c) => c.status === 'reprovada').length,
      inProgress: changes.filter((c) => IN_PROGRESS.includes(c.status)).length,
      openIncidents: incidents.filter((i) => i.status !== 'resolvida').length,
      unansweredCalls: input.calls.length,
      openFollowUps: input.followUps.length,
    },
    changes,
    incidents,
    unansweredCalls: input.calls.map((c) => ({
      incidentId: c.incidentId,
      ticket: c.ticket,
      contact: c.contact,
      channel: c.channel,
      since: c.createdAt,
    })),
    followUps: input.followUps.map((f) => ({
      id: f.id,
      title: f.title,
      assigneeName: f.assigneeName,
      origin: f.sourceLabel ?? f.appShortName,
    })),
    notes: input.notes.trim(),
    nextSteps: input.nextSteps.trim(),
  };
}

/** Type guard for snapshots read back from the database (jsonb). */
export function isHandover(value: unknown): value is Handover {
  return (
    typeof value === 'object' && value !== null && (value as { version?: unknown }).version === 1
  );
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

export function appSummary(a: HandoverApp): string {
  const parts = [`${a.approved}/${a.total} ✓`];
  if (a.failed) parts.push(`${a.failed} ✗`);
  if (a.pending) parts.push(`${a.pending} pendente(s)`);
  if (a.check)
    parts.push(
      a.check.ok
        ? `${a.check.latencyMs ?? '—'} ms`
        : `HTTP ${a.check.httpStatus ?? 'sem resposta'}`,
    );
  return parts.join(' · ');
}

/** Plain text for Share (WhatsApp/Teams): *bold* works in both. */
export function handoverToText(h: Handover): string {
  const lines: string[] = [];
  const kind = shiftKindLabel[h.shift.kind].toLowerCase();
  const end = h.shift.endedAt ? formatShortDateTime(h.shift.endedAt) : 'em andamento';
  lines.push('*Passagem de plantão — KeepOps*');
  lines.push(`Turno ${kind} · ${h.shift.authorName}`);
  lines.push(`${formatShortDateTime(h.shift.startedAt)} → ${end}`);
  lines.push('');
  lines.push(
    `Resumo: ${h.totals.changes} GMUD(s) · ${h.totals.validated} validada(s) · ${h.totals.failed} reprovada(s) · ${h.totals.inProgress} em andamento`,
  );

  lines.push('', `*GMUDs da janela (${h.changes.length})*`);
  if (!h.changes.length) lines.push('Nenhuma GMUD na janela.');
  for (const c of h.changes) {
    lines.push(
      `• ${c.number} — ${c.title} [${statusText[c.status]}] ${formatTime(c.windowStart)}–${formatTime(c.windowEnd)}`,
    );
    for (const a of c.apps) lines.push(`   - ${a.name}: ${appSummary(a)}`);
  }

  lines.push('', `*Ocorrências (${h.incidents.length})*`);
  if (!h.incidents.length) lines.push('Nenhuma ocorrência.');
  for (const i of h.incidents) {
    lines.push(
      `• ${i.severity.toUpperCase()} ${i.ticket ?? ''} — ${i.title} [${i.status === 'resolvida' ? 'resolvida' : 'aberta'}]`.replace(
        '  ',
        ' ',
      ),
    );
  }

  if (h.unansweredCalls.length) {
    lines.push('', `*Acionamentos sem resposta (${h.unansweredCalls.length})*`);
    for (const c of h.unansweredCalls) {
      lines.push(
        `• ${[c.contact, c.channel].filter(Boolean).join(' · ')} — ${c.ticket ?? ''} desde ${formatTime(c.since)}`,
      );
    }
  }

  lines.push('', `*Pendências abertas (${h.followUps.length})*`);
  if (!h.followUps.length) lines.push('Nenhuma pendência aberta.');
  for (const f of h.followUps) {
    lines.push(
      `• ${f.title}${f.origin ? ` (${f.origin})` : ''} — ${f.assigneeName ?? 'sem responsável'}`,
    );
  }

  if (h.notes) lines.push('', '*Observações*', h.notes);
  if (h.nextSteps) lines.push('', '*Próximos passos*', h.nextSteps);
  lines.push('', '_Gerado pelo KeepOps · ambiente demonstrativo, dados fictícios._');
  return lines.join('\n');
}
