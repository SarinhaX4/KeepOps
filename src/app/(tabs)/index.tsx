import { House } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { BrandHeader } from '@/components/domain/BrandHeader';
import { PlaceholderSection } from '@/components/ui/PlaceholderSection';
import { Screen } from '@/components/ui/Screen';
import { colors, typography } from '@/theme';

export default function HomeScreen() {
  return (
    <Screen>
      <BrandHeader />
      <Text style={styles.greeting}>Olá!</Text>
      <Text style={styles.slogan}>Keep the context. Keep operations moving.</Text>
      <PlaceholderSection
        icon={House}
        title="Início"
        description="Painel do turno, pendências abertas e resumo do período."
        stage="Chega na Etapa 3 · qui 19/11"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { ...typography.display, color: colors.text },
  slogan: { ...typography.bodySmall, color: colors.muted },
});
