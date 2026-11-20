import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import {
  addIncidentEvent,
  createIncident,
  getIncident,
  listIncidents,
  markCallAnswered,
  registerCall,
  resolveIncident,
  type NewIncident,
} from '@/services/incidents';

import { useProfile } from './useProfile';

export const incidentsKey = ['incidents'] as const;
export const incidentKey = (id: string) => ['incident', id] as const;

export function useIncidents() {
  return useQuery({ queryKey: incidentsKey, queryFn: listIncidents });
}

export function useIncident(id: string) {
  return useQuery({ queryKey: incidentKey(id), queryFn: () => getIncident(id) });
}

/** Everything an incident change can affect: lists, detail, home, related GMUD. */
function useInvalidate() {
  const qc = useQueryClient();
  return (id?: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: incidentsKey }),
      qc.invalidateQueries({ queryKey: ['home'] }),
      qc.invalidateQueries({ queryKey: ['change'] }),
      id ? qc.invalidateQueries({ queryKey: incidentKey(id) }) : Promise.resolve(),
    ]);
}

function useUserId() {
  const { data: profile } = useProfile();
  return () => {
    if (!profile) throw new Error('Perfil ainda não carregado.');
    return profile;
  };
}

export function useCreateIncident() {
  const invalidate = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: (input: NewIncident) => {
      const p = me();
      return createIncident(input, p.id, p.team_id);
    },
    onSuccess: () => invalidate(),
  });
}

export function useIncidentActions(id: string) {
  const invalidate = useInvalidate();
  const me = useUserId();
  const done = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    return invalidate(id);
  };

  return {
    addNote: useMutation({
      mutationFn: (description: string) =>
        addIncidentEvent(id, { kind: 'nota', description }, me().id),
      onSuccess: done,
    }),
    addUpdate: useMutation({
      mutationFn: (description: string) =>
        addIncidentEvent(id, { kind: 'atualizacao', description }, me().id),
      onSuccess: done,
    }),
    registerCall: useMutation({
      mutationFn: (call: {
        channel: string;
        contact: string;
        description: string;
        ticket?: string;
      }) => registerCall(id, call, me().id),
      onSuccess: done,
    }),
    markAnswered: useMutation({
      mutationFn: (eventId: string) => markCallAnswered(eventId),
      onSuccess: done,
    }),
    resolve: useMutation({
      mutationFn: (description: string) => resolveIncident(id, description, me().id),
      onSuccess: done,
    }),
  };
}
