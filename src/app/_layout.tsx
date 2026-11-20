import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Toast } from '@/components/ui/Toast';
import { useAuthListener } from '@/hooks/useAuthListener';
import { queryClient } from '@/lib/queryClient';
import { useSessionStore } from '@/store/session';
import { colors, fontAssets, fonts } from '@/theme';

// Keep the splash visible until fonts and the stored session are ready.
void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  useAuthListener();
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const initialized = useSessionStore((s) => s.initialized);
  const signedIn = useSessionStore((s) => s.session !== null);
  const ready = (fontsLoaded || fontError !== null) && initialized;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 16 },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="changes/new"
          options={{ headerShown: true, title: 'Nova GMUD', presentation: 'card' }}
        />
        <Stack.Screen name="changes/[id]/index" options={{ headerShown: true, title: 'GMUD' }} />
        <Stack.Screen
          name="changes/[id]/edit"
          options={{ headerShown: true, title: 'Editar GMUD' }}
        />
        <Stack.Screen
          name="applications/index"
          options={{ headerShown: true, title: 'Aplicações' }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)/login" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <RootNavigator />
      <Toast />
    </QueryClientProvider>
  );
}
