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

/** Stack screens that show a native header: [route, title]. */
const headerScreens: [string, string][] = [
  ['changes/new', 'Nova GMUD'],
  ['changes/[id]/index', 'GMUD'],
  ['changes/[id]/edit', 'Editar GMUD'],
  ['changes/[id]/validate/[appId]', 'Validação'],
  ['changes/[id]/conclude', 'Concluir GMUD'],
  ['applications/index', 'Aplicações'],
  ['incidents/new', 'Nova ocorrência'],
  ['incidents/[id]', 'Ocorrência'],
  ['follow-ups/new', 'Nova pendência'],
  ['follow-ups/[id]', 'Pendência'],
];

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
        {headerScreens.map(([name, title]) => (
          <Stack.Screen key={name} name={name} options={{ headerShown: true, title }} />
        ))}
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
