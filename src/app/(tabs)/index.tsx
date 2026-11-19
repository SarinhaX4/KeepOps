import { House } from 'lucide-react-native';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandHeader } from '@/components/domain/BrandHeader';
import { Avatar } from '@/components/ui/Avatar';
import { PlaceholderSection } from '@/components/ui/PlaceholderSection';
import { Screen } from '@/components/ui/Screen';
import { useProfile } from '@/hooks/useProfile';
import { signOut } from '@/services/auth';
import { colors, typography } from '@/theme';

function confirmSignOut() {
  Alert.alert('Sair da conta?', 'Você poderá entrar novamente com outro usuário demo.', [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Sair',
      style: 'destructive',
      onPress: () => {
        signOut().catch((e: unknown) =>
          Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível sair.'),
        );
      },
    },
  ]);
}

export default function HomeScreen() {
  const { data: profile } = useProfile();
  const firstName = profile?.full_name.split(' ')[0];
  const roleLabel = profile?.role === 'analista' ? 'Equipe da semana' : 'Plantonista';

  return (
    <Screen>
      <View style={styles.header}>
        <BrandHeader />
        {profile ? (
          <Pressable
            onPress={confirmSignOut}
            accessibilityRole="button"
            accessibilityLabel={`Perfil de ${profile.full_name}. Toque para sair`}
            hitSlop={8}
          >
            <Avatar name={profile.full_name} color={profile.avatar_color} />
          </Pressable>
        ) : null}
      </View>
      <View>
        <Text style={styles.greeting}>{firstName ? `Olá, ${firstName}` : 'Olá!'}</Text>
        {profile ? <Text style={styles.role}>{roleLabel}</Text> : null}
      </View>
      <PlaceholderSection
        icon={House}
        title="Início"
        description="Painel do turno, pendências abertas e resumo do período."
        stage="Chega na Etapa 3"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { ...typography.display, color: colors.text },
  role: { ...typography.bodySmall, color: colors.muted },
});
