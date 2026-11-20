import { router } from 'expo-router';
import { Plus, Siren } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IncidentListItem } from '@/components/domain/IncidentListItem';
import { Appear } from '@/components/ui/Appear';
import { Chip } from '@/components/ui/Chip';
import { FAB } from '@/components/ui/FAB';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useIncidents } from '@/hooks/useIncidents';
import type { IncidentListItem as Incident } from '@/services/incidents';
import { colors, spacing, typography } from '@/theme';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

type Filter = 'open' | 'resolved' | 'all';
const filters: { key: Filter; label: string; test: (i: Incident) => boolean }[] = [
  { key: 'open', label: 'Abertas', test: (i) => i.status !== 'resolvida' },
  { key: 'resolved', label: 'Resolvidas', test: (i) => i.status === 'resolvida' },
  { key: 'all', label: 'Todas', test: () => true },
];

export default function IncidentsScreen() {
  const incidents = useIncidents();
  useRefreshOnFocus(incidents.refetch);
  const [filter, setFilter] = useState<Filter>('open');
  const active = filters.find((f) => f.key === filter) ?? filters[0];
  const items = incidents.data?.filter(active.test) ?? [];
  const goToNew = () => router.push('/incidents/new');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Ocorrências</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsBar}
        contentContainerStyle={styles.chips}
      >
        {filters.map((f) => (
          <Chip
            key={f.key}
            label={f.label}
            count={incidents.data?.filter(f.test).length}
            selected={filter === f.key}
            onPress={() => setFilter(f.key)}
          />
        ))}
      </ScrollView>

      {incidents.isPending ? (
        <View style={styles.list}>
          <Skeleton height={120} />
          <Skeleton height={120} />
        </View>
      ) : incidents.isError ? (
        <ErrorState message={incidents.error.message} onRetry={() => void incidents.refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={({ item, index }) => (
            <Appear index={index}>
              <IncidentListItem
                incident={item}
                onPress={() =>
                  router.push({ pathname: '/incidents/[id]', params: { id: item.id } })
                }
              />
            </Appear>
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={incidents.isRefetching}
              onRefresh={() => void incidents.refetch()}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={Siren}
              title={filter === 'open' ? 'Nenhuma ocorrência aberta' : 'Nenhuma ocorrência'}
              description="Ocorrências podem ser abertas aqui ou direto de um passo reprovado na validação."
              actionLabel="Nova ocorrência"
              onAction={goToNew}
            />
          }
        />
      )}
      <FAB label="Nova ocorrência" icon={Plus} onPress={goToNew} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  title: { ...typography.display, color: colors.text },
  chipsBar: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  list: { padding: spacing.xl, paddingBottom: 96, gap: spacing.md },
});
