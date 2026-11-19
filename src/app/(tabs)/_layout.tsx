import { Tabs } from 'expo-router';
import { ArrowRightLeft, ClipboardCheck, House, ListTodo, Siren } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import type { ColorValue } from 'react-native';

import { colors, typography } from '@/theme';

type TabIconProps = { color: ColorValue };

function tabIcon(Icon: LucideIcon) {
  function TabIcon({ color }: TabIconProps) {
    // Lucide expects a string; the tab bar always passes our hex tokens.
    const tint = typeof color === 'string' ? color : colors.dim;
    return <Icon size={20} color={tint} strokeWidth={1.8} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brandPrimaryText,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: typography.tabLabel,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Início', tabBarIcon: tabIcon(House) }} />
      <Tabs.Screen
        name="changes"
        options={{ title: 'GMUDs', tabBarIcon: tabIcon(ClipboardCheck) }}
      />
      <Tabs.Screen
        name="incidents"
        options={{ title: 'Ocorrências', tabBarIcon: tabIcon(Siren) }}
      />
      <Tabs.Screen
        name="follow-ups"
        options={{ title: 'Pendências', tabBarIcon: tabIcon(ListTodo) }}
      />
      <Tabs.Screen
        name="shifts"
        options={{ title: 'Plantões', tabBarIcon: tabIcon(ArrowRightLeft) }}
      />
    </Tabs>
  );
}
