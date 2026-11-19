import { router } from 'expo-router';
import { ClipboardCheck, Plus } from 'lucide-react-native';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChangeListItem } from '@/components/domain/ChangeListItem';
import { FAB } from '@/components/ui/FAB';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useChanges } from '@/hooks/useChanges';
import { colors, spacing, typography } from '@/theme';

export default function ChangesScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useChanges();
  const goToNew = () => router.push('/changes/new');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>GMUDs</Text>
        {data ? <Text style={styles.count}>{data.length} no total</Text> : null}
      </View>

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
          data={data}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <ChangeListItem change={item} />}
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
              title="Nenhuma GMUD cadastrada"
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
  // Bottom padding keeps the last card above the FAB.
  list: { padding: spacing.xl, paddingBottom: 96, gap: spacing.md },
});
