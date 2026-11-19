import { ClipboardCheck } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { PlaceholderSection } from '@/components/ui/PlaceholderSection';
import { Screen } from '@/components/ui/Screen';
import { colors, typography } from '@/theme';

export default function ChangesScreen() {
  return (
    <Screen>
      <Text style={styles.title}>GMUDs</Text>
      <PlaceholderSection
        icon={ClipboardCheck}
        title="GMUDs"
        description="Mudanças da janela: lista, filtros, criação e validação."
        stage="Chega nas Etapas 1–5 · qua 18 a sáb 21/11"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
});
