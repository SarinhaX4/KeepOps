import { ListTodo } from 'lucide-react-native';
import { StyleSheet, Text } from 'react-native';

import { PlaceholderSection } from '@/components/ui/PlaceholderSection';
import { Screen } from '@/components/ui/Screen';
import { colors, typography } from '@/theme';

export default function FollowUpsScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Pendências</Text>
      <PlaceholderSection
        icon={ListTodo}
        title="Pendências"
        description="O que ficou em aberto, com responsável, entre turnos."
        stage="Chega na Etapa 6 · dom 22/11"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.display, color: colors.text },
});
