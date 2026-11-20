import type { ChangeDetail } from '@/services/changes';

export type TimelineTone = 'ok' | 'warn' | 'bad' | 'info' | 'neutral';

export type TimelineItem = {
  id: string;
  at: string;
  title: string;
  subtitle?: string;
  tone: TimelineTone;
};

const statusLabel: Record<ChangeDetail['status'], string> = {
  agendada: 'Agendada',
  aguardando_liberacao: 'Aguardando liberação',
  em_validacao: 'Em validação',
  validada: 'Validada',
  validada_com_ressalvas: 'Validada com ressalvas',
  reprovada: 'Reprovada',
  cancelada: 'Cancelada',
};

const statusTone: Record<ChangeDetail['status'], TimelineTone> = {
  agendada: 'neutral',
  aguardando_liberacao: 'warn',
  em_validacao: 'info',
  validada: 'ok',
  validada_com_ressalvas: 'warn',
  reprovada: 'bad',
  cancelada: 'neutral',
};

const withBy = (text: string, by: string | null) => (by ? `${text} · ${by}` : text);

/**
 * Merges status changes, validation results, health checks and incidents
 * into one chronological list (oldest first).
 */
export function buildChangeTimeline(change: ChangeDetail): TimelineItem[] {
  const items: TimelineItem[] = [];

  for (const e of change.events) {
    items.push({
      id: `ev-${e.id}`,
      at: e.changed_at,
      title: e.from_status ? `Status: ${statusLabel[e.to_status]}` : 'GMUD cadastrada',
      subtitle: withBy(
        e.note ??
          (e.from_status ? `Antes: ${statusLabel[e.from_status]}` : statusLabel[e.to_status]),
        e.by,
      ),
      tone: statusTone[e.to_status],
    });
  }

  for (const app of change.apps) {
    const approved = app.steps.filter((s) => s.result === 'aprovado' && s.performed_at);
    if (approved.length) {
      const last = approved.reduce((a, b) =>
        (a.performed_at ?? '') > (b.performed_at ?? '') ? a : b,
      );
      items.push({
        id: `ok-${app.id}`,
        at: last.performed_at as string,
        title: `${app.name}: ${approved.length} de ${app.steps.length} passos aprovados`,
        tone: 'ok',
      });
    }
    for (const s of app.steps) {
      if (!s.performed_at || s.result === 'aprovado' || s.result === 'pendente') continue;
      items.push({
        id: `step-${s.id}`,
        at: s.performed_at,
        title: `${app.name}: ${s.result === 'reprovado' ? 'reprovado' : 'N/A'} — ${s.step_title}`,
        subtitle: s.note ?? undefined,
        tone: s.result === 'reprovado' ? 'bad' : 'neutral',
      });
    }
  }

  for (const c of change.checks) {
    const app = change.apps.find((a) => a.id === c.application_id);
    const phase =
      c.phase === 'baseline' ? 'baseline' : c.phase === 'pos' ? 'pós-mudança' : 'avulso';
    items.push({
      id: `hc-${c.id}`,
      at: c.checked_at,
      title: `Health check ${phase}${app ? ` · ${app.short_name}` : ''}`,
      subtitle: withBy(`HTTP ${c.http_status ?? '—'} · ${c.latency_ms ?? '—'} ms`, c.by),
      tone: c.ok ? 'ok' : 'bad',
    });
  }

  for (const i of change.incidents) {
    items.push({
      id: `inc-${i.id}`,
      at: i.opened_at,
      title: `Ocorrência ${i.severity.toUpperCase()} aberta`,
      subtitle: [i.external_ticket, i.title].filter(Boolean).join(' · '),
      tone: 'bad',
    });
    if (i.resolved_at) {
      items.push({
        id: `incr-${i.id}`,
        at: i.resolved_at,
        title: 'Ocorrência resolvida',
        subtitle: i.external_ticket ?? i.title,
        tone: 'ok',
      });
    }
  }

  return items.sort((a, b) => a.at.localeCompare(b.at));
}
