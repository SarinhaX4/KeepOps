import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { DemoBadge } from '@/components/ui/DemoBadge';
import { TextField } from '@/components/ui/TextField';
import { signIn } from '@/services/auth';
import { colors, fonts, radius, spacing, typography } from '@/theme';
import { DEMO_PASSWORD, demoUsers } from '@/utils/demoUsers';

const logo = require('@/assets/brand/keepops-logo-horizontal-dark.png');

const avatarColor: Record<(typeof demoUsers)[number]['key'], string> = {
  ana: colors.brandPrimary,
  joao: colors.brandSecondary,
  marina: colors.brandHighlight,
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<string | null>(null);

  // After a successful sign-in, the root layout's guard swaps to the tabs automatically.
  async function handleSignIn(mail: string, pass: string, who: string) {
    setError(null);
    setPending(who);
    try {
      await signIn(mail.trim(), pass);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro inesperado ao entrar.');
      setPending(null);
    }
  }

  const formValid = email.trim().length > 3 && password.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brand}>
            <Image
              source={logo}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="KeepOps"
            />
          </View>

          <View style={styles.form}>
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="voce@empresa.com"
            />
            <TextField
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label="Entrar"
              onPress={() => void handleSignIn(email, password, 'form')}
              loading={pending === 'form'}
              disabled={!formValid || pending !== null}
            />
          </View>

          <View style={styles.demo}>
            <View style={styles.demoHeader}>
              <Text style={styles.section}>Entrar como</Text>
              <DemoBadge />
            </View>
            <Text style={styles.demoNote}>Ambiente demonstrativo · dados fictícios</Text>
            {demoUsers.map((u) => (
              <Pressable
                key={u.key}
                disabled={pending !== null}
                onPress={() => void handleSignIn(u.email, DEMO_PASSWORD, u.key)}
                accessibilityRole="button"
                accessibilityLabel={`Entrar como ${u.name}, ${u.role}`}
                style={({ pressed }) => [styles.demoRow, pressed && styles.pressed]}
              >
                <Avatar name={u.name} color={avatarColor[u.key]} size={36} />
                <View style={styles.flex}>
                  <Text style={styles.demoName}>{u.name}</Text>
                  <Text style={styles.demoRole}>{u.role}</Text>
                </View>
                <Text style={styles.demoAction}>{pending === u.key ? 'Entrando…' : 'Entrar'}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { padding: spacing.xxl, gap: spacing.xxl, flexGrow: 1, justifyContent: 'center' },
  brand: { alignItems: 'center', gap: spacing.md },
  logo: { width: 280, height: 72 },
  form: { gap: spacing.lg },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.badText },
  demo: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  demoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { ...typography.section, color: colors.muted },
  demoNote: { ...typography.meta, color: colors.dim, marginBottom: spacing.xs },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.control,
  },
  pressed: { backgroundColor: colors.surface2 },
  demoName: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  demoRole: { ...typography.meta, color: colors.muted },
  demoAction: { fontFamily: fonts.semibold, fontSize: 14, color: colors.brandPrimaryText },
});
