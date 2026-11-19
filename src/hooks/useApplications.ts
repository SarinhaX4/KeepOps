import { useQuery } from '@tanstack/react-query';

import { listApplications, listApplicationsWithLastCheck } from '@/services/applications';

export function useApplications() {
  return useQuery({ queryKey: ['applications'], queryFn: listApplications });
}

export function useApplicationsWithLastCheck() {
  return useQuery({
    queryKey: ['applications', 'with-check'],
    queryFn: listApplicationsWithLastCheck,
  });
}
