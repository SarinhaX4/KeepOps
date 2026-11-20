import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Refetches when the screen regains focus (e.g. switching tabs), so data written
 * by another person/device shows up without pulling to refresh. Skips the first focus.
 * The latest `refetch` is kept in a ref so the focus callback stays stable
 * (a changing callback would make useFocusEffect fire on every render).
 */
export function useRefreshOnFocus(refetch: () => unknown) {
  const latest = useRef(refetch);
  const firstFocus = useRef(true);

  useEffect(() => {
    latest.current = refetch;
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      void latest.current();
    }, []),
  );
}
