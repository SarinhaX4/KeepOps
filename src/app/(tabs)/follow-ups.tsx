import { router } from 'expo-router';
import { CircleCheck, ListTodo, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FollowUpRow } from '@/components/domain/FollowUpRow';
import { Appear } from '@/components/ui/Appear';
import { Chip } from '@/components/ui/Chip';
import { FAB } from '@/components/ui/FAB';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useAssignFromList, useFollowUps } from '@/hooks/useFollowUps';
import { useProfile } from '@/hooks/useProfile';
import type { FollowUpItem } from '@/services/followUps';
import { toast } from '@/store/toast';
import { colors, spacing, typography } from '@/theme';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

type Tab = 'mine' | 'unassigned' | 'all' | 'done';

export default function FollowUpsScreen() {
  const list = useFollowUps();
  useRefreshOnFocus(list.refetch);
  const assign = useAssignFromList();
  const { data: profile } = useProfile();
  const [tab, setTab] = useState<Tab>('mine');
  const me = profile?.id ?? '';

  const tabs: { key: Tab; label: string; test: (f: FollowUpItem) => boolean; empty: string }[] = [
    {
      key: 'mine',
      label: 'Minhas',
      test: (f) => f.status !== 'concluida' && f.assignedTo === me,
      empty: 'Você não tem pendências. Assuma uma em "Sem responsável".',
    },
    {
      key: 'unassigned',
      label: 'Sem responsável',
      test: (f) => f.status !== 'concluida' && f.assignedTo === null,
      empty: 'Todas as pendências têm responsável.',
    },
    {
      key: 'all',
      label: 'Todas',
      test: (f) => f.status !== 'concluida',
      empty: 'Nenhuma pendência aberta.',
    },
    {
      key: 'done',
      label: 'Concluídas',
      test: (f) => f.status === 'concluida',
      empty: 'Nenhuma pendência concluída ainda.',
    },
  ];
  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  const items = list.data?.filter(active.test) ?? [];
  const goToNew = () => router.push('/follow-ups/new');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Pendências</Text>
        <Text style={styles.subtitle}>O que atravessa turnos até alguém concluir.</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsBar}
        contentContainerStyle={styles.chips}
      >
        {tabs.map((t) => (
          <Chip
            key={t.key}
            label={t.label}
            count={list.data?.filter(t.test).length}
            selected={tab === t.key}
            onPress={() => setTab(t.key)}
          />
        ))}
      </ScrollView>

      {list.isPending ? (
        <View style={styles.list}>
          <Skeleton height={90} />
          <Skeleton height={90} />
        </View>
      ) : list.isError ? (
        <ErrorState message={list.error.message} onRetry={() => void list.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(f) => f.id}
          renderItem={({ item, index }) => (
            <Appear index={index}>
              <FollowUpRow
                followUp={item}
                currentUserId={me}
                showAge
                onPress={() =>
                  router.push({ pathname: '/follow-ups/[id]', params: { id: item.id } })
                }
                onAssign={() =>
                  assign.mutate(item.id, {
                    onSuccess: () => toast('Pendência assumida'),
                    onError: (e) => Alert.alert('Não foi possível assumir', e.message),
                  })
                }
              />
            </Appear>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching}
              onRefresh={() => void list.refetch()}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={tab === 'done' ? CircleCheck : ListTodo}
              title={active.empty}
              description="Pendências nascem de passos reprovados, ocorrências e GMUDs com ressalvas — ou manualmente."
              actionLabel={tab === 'mine' ? 'Ver sem responsável' : 'Nova pendência'}
              onAction={tab === 'mine' ? () => setTab('unassigned') : goToNew}
            />
          }
        />
      )}
      <FAB label="Nova pendência" icon={Plus} onPress={goToNew} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: 2,
  },
  title: { ...typography.display, color: colors.text },
  subtitle: { ...typography.bodySmall, color: colors.muted },
  chipsBar: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  list: { padding: spacing.xl, paddingBottom: 96, gap: spacing.md },
});
