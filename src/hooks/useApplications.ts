import { useQuery } from '@tanstack/react-query';

import { listApplications } from '@/services/applications';

export function useApplications() {
  return useQuery({ queryKey: ['applications'], queryFn: listApplications });
}
