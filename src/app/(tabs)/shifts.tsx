import { ArrowRightLeft } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { PlaceholderSection } from '@/components/ui/PlaceholderSection';
import { Screen } from '@/components/ui/Screen';
import { colors, typography } from '@/theme';

export default function ShiftsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Plantões</Text>
      <PlaceholderSection
        icon={ArrowRightLeft}
        title="Plantões"
        description="Turno atual, passagem de plantão, histórico e resumo do período."
        stage="Chega na Etapa 7 · seg 23/11"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
});
