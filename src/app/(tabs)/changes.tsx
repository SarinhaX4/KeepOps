import { router, useLocalSearchParams } from 'expo-router';
import { ClipboardCheck, Plus, X } from 'lucide-react-native';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChangeListItem } from '@/components/domain/ChangeListItem';
import { changeStatusTone } from '@/components/domain/StatusBadge';
import { FAB } from '@/components/ui/FAB';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useChanges } from '@/hooks/useChanges';
import type { ChangeStatus } from '@/services/changes';
import { colors, fonts, hitTarget, radius, spacing, typography } from '@/theme';

export default function ChangesScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useChanges();
  const { status } = useLocalSearchParams<{ status?: string }>();
  const goToNew = () => router.push('/changes/new');

  // Optional filter coming from the home counters (?status=a,b).
  const statusFilter = (status ? status.split(',') : []).filter(
    (s): s is ChangeStatus => s in changeStatusTone,
  );
  const items = statusFilter.length ? data?.filter((c) => statusFilter.includes(c.status)) : data;
  const filterLabel = statusFilter.map((s) => changeStatusTone[s].label).join(' + ');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>GMUDs</Text>
        {items ? <Text style={styles.count}>{items.length} GMUDs</Text> : null}
      </View>
      {statusFilter.length ? (
        <Pressable
          onPress={() => router.setParams({ status: undefined })}
          accessibilityRole="button"
          accessibilityLabel={`Remover filtro ${filterLabel}`}
          style={styles.filter}
        >
          <Text style={styles.filterText}>Filtro: {filterLabel}</Text>
          <X size={14} color={colors.brandPrimaryText} strokeWidth={2.2} />
        </Pressable>
      ) : null}

      {isPending ? (
        <View style={styles.list}>
          <Skeleton height={120} />
          <Skeleton height={120} />
          <Skeleton height={120} />
        </View>
      ) : isError ? (
        <ErrorState message={error.message} onRetry={() => void refetch()} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <ChangeListItem
              change={item}
              onPress={() => router.push({ pathname: '/changes/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={colors.brandPrimary}
              colors={[colors.brandPrimary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={ClipboardCheck}
              title={
                statusFilter.length ? 'Nenhuma GMUD com este status' : 'Nenhuma GMUD cadastrada'
              }
              description="Cadastre as mudanças da janela para começar a validar."
              actionLabel="Nova GMUD"
              onAction={goToNew}
            />
          }
        />
      )}

      <FAB label="Nova GMUD" icon={Plus} onPress={goToNew} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  title: { ...typography.display, color: colors.text },
  count: { ...typography.meta, color: colors.muted },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: hitTarget - 8,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    backgroundColor: colors.brandPrimarySoft,
  },
  filterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.brandPrimaryText },
  // Bottom padding keeps the last card above the FAB.
  list: { padding: spacing.xl, paddingBottom: 96, gap: spacing.md },
});
