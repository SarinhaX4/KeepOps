import { router, useLocalSearchParams } from 'expo-router';
import { ClipboardCheck, Plus, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChangeListItem } from '@/components/domain/ChangeListItem';
import { changeStatusTone } from '@/components/domain/StatusBadge';
import { Appear } from '@/components/ui/Appear';
import { Chip } from '@/components/ui/Chip';
import { FAB } from '@/components/ui/FAB';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useChanges } from '@/hooks/useChanges';
import type { ChangeStatus } from '@/services/changes';
import { colors, fonts, hitTarget, radius, spacing, typography } from '@/theme';
import { changeFilters, filterChanges, type ChangeFilterKey } from '@/utils/changeFilters';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';

export default function ChangesScreen() {
  const { data, isPending, isError, error, refetch, isRefetching } = useChanges();
  useRefreshOnFocus(refetch);
  const { status } = useLocalSearchParams<{ status?: string }>();
  const [filter, setFilter] = useState<ChangeFilterKey>('all');
  const [query, setQuery] = useState('');
  const goToNew = () => router.push('/changes/new');

  // A filter coming from the home counters (?status=a,b) wins until cleared.
  const paramStatuses = (status ? status.split(',') : []).filter(
    (s): s is ChangeStatus => s in changeStatusTone,
  );
  const activeStatuses = paramStatuses.length
    ? paramStatuses
    : (changeFilters.find((f) => f.key === filter)?.statuses ?? []);

  // React Compiler memoizes this; no manual useMemo needed.
  const items = data ? filterChanges(data, activeStatuses, query) : [];
  const countFor = (statuses: ChangeStatus[]) =>
    data ? data.filter((c) => statuses.length === 0 || statuses.includes(c.status)).length : 0;

  function selectChip(key: ChangeFilterKey) {
    if (paramStatuses.length) router.setParams({ status: undefined });
    setFilter(key);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>GMUDs</Text>
        {data ? (
          <Text style={styles.count}>
            {items.length} de {data.length}
          </Text>
        ) : null}
      </View>

      <View style={styles.search}>
        <Search size={16} color={colors.dim} strokeWidth={1.8} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar por número ou título"
          placeholderTextColor={colors.dim}
          selectionColor={colors.brandPrimary}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar GMUD por número ou título"
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Limpar busca">
            <X size={16} color={colors.muted} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>

      {paramStatuses.length ? (
        <Pressable
          onPress={() => router.setParams({ status: undefined })}
          accessibilityRole="button"
          accessibilityLabel="Remover filtro vindo do Início"
          style={styles.paramFilter}
        >
          <Text style={styles.paramFilterText}>
            Filtro: {paramStatuses.map((s) => changeStatusTone[s].label).join(' + ')}
          </Text>
          <X size={14} color={colors.brandPrimaryText} strokeWidth={2.2} />
        </Pressable>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsBar}
        >
          {changeFilters.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              count={countFor(f.statuses)}
              selected={filter === f.key}
              onPress={() => selectChip(f.key)}
            />
          ))}
        </ScrollView>
      )}

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
          keyboardShouldPersistTaps="handled"
          renderItem={({ item, index }) => (
            <Appear index={index}>
              <ChangeListItem
                change={item}
                onPress={() => router.push({ pathname: '/changes/[id]', params: { id: item.id } })}
              />
            </Appear>
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
            data && data.length > 0 ? (
              <EmptyState
                icon={Search}
                title="Nada encontrado"
                description="Nenhuma GMUD corresponde ao filtro ou à busca."
                actionLabel="Limpar filtros"
                onAction={() => {
                  setQuery('');
                  selectChip('all');
                }}
              />
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="Nenhuma GMUD cadastrada"
                description="Cadastre as mudanças da janela para começar a validar."
                actionLabel="Nova GMUD"
                onAction={goToNew}
              />
            )
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
    paddingBottom: spacing.md,
  },
  title: { ...typography.display, color: colors.text },
  count: { ...typography.meta, color: colors.muted },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.md,
    minHeight: hitTarget,
    borderRadius: radius.control,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15 },
  chipsBar: { flexGrow: 0, marginTop: spacing.md },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  paramFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sm,
    minHeight: 36,
    marginTop: spacing.md,
    marginHorizontal: spacing.xl,
    paddingHorizontal: spacing.md,
    borderRadius: radius.chip,
    backgroundColor: colors.brandPrimarySoft,
  },
  paramFilterText: { fontFamily: fonts.medium, fontSize: 13, color: colors.brandPrimaryText },
  // Bottom padding keeps the last card above the FAB.
  list: { padding: spacing.xl, paddingBottom: 96, gap: spacing.md },
});
