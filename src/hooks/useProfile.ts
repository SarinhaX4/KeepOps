import { useQuery } from '@tanstack/react-query';

import { getProfile } from '@/services/profiles';
import { useSessionStore } from '@/store/session';

export function useProfile() {
  const userId = useSessionStore((s) => s.session?.user.id);
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId as string),
    enabled: Boolean(userId),
    staleTime: Infinity,
  });
}
