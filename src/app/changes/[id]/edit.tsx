import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { ChangeForm } from '@/components/domain/ChangeForm';
import { ErrorState, Skeleton } from '@/components/ui/StateViews';
import { useChange, useUpdateChange } from '@/hooks/useChanges';
import { toast } from '@/store/toast';
import { colors, spacing } from '@/theme';
import { toSpInput } from '@/utils/format';

export default function EditChangeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const change = useChange(id);
  const update = useUpdateChange(id);

  if (change.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.xl, gap: spacing.md }}>
        <Skeleton height={60} />
        <Skeleton height={60} />
        <Skeleton height={60} />
      </View>
    );
  }
  if (change.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ErrorState message={change.error.message} onRetry={() => void change.refetch()} />
      </View>
    );
  }

  const c = change.data;
  const currentAppIds = c.apps.map((a) => a.id);

  return (
    <ChangeForm
      defaultValues={{
        changeNumber: c.change_number,
        title: c.title,
        description: c.description ?? '',
        windowStart: toSpInput(new Date(c.window_start)),
        windowEnd: toSpInput(new Date(c.window_end)),
        executorTeam: c.executor_team ?? '',
        executorContact: c.executor_contact ?? '',
        applicationIds: currentAppIds,
      }}
      submitLabel="Salvar alterações"
      busy={update.isPending}
      onSubmit={async (input) => {
        await update.mutateAsync({ input, currentAppIds });
        toast('GMUD atualizada');
        router.back();
      }}
    />
  );
}
