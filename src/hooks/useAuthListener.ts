import { useEffect } from 'react';

import { queryClient } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/session';

/** Reads the stored session on boot and keeps the store in sync with Supabase Auth. */
export function useAuthListener() {
  const setSession = useSessionStore((s) => s.setSession);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [setSession]);
}
