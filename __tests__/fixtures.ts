import type { FollowUpItem } from '@/services/followUps';

export function followUp(p: Partial<FollowUpItem> & { id: string; title: string }): FollowUpItem {
  return {
    description: null,
    status: 'aberta',
    sourceType: 'manual',
    sourceId: null,
    sourceLabel: null,
    sourceChangeId: null,
    applicationId: null,
    appShortName: null,
    appName: null,
    shiftKind: null,
    shiftStartedAt: null,
    assignedTo: null,
    assigneeName: null,
    assignedAt: null,
    resolutionNote: null,
    resolverName: null,
    resolvedAt: null,
    creatorName: null,
    createdAt: '2026-11-14T15:00:00Z',
    ...p,
  };
}
