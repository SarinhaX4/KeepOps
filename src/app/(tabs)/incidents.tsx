import { Siren } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { PlaceholderSection } from '@/components/ui/PlaceholderSection';
import { Screen } from '@/components/ui/Screen';
import { colors, typography } from '@/theme';

export default function IncidentsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Ocorrências</Text>
      <PlaceholderSection
        icon={Siren}
        title="Ocorrências"
        description="Falhas, severidade, acionamentos e linha do tempo."
        stage="Chega na Etapa 6 · dom 22/11"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
});
