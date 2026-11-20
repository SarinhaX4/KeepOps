import { router } from 'expo-router';

import { ChangeForm, defaultChangeFormValues } from '@/components/domain/ChangeForm';
import { useCreateChange } from '@/hooks/useChanges';
import { toast } from '@/store/toast';

export default function NewChangeScreen() {
  const createChange = useCreateChange();
  return (
    <ChangeForm
      defaultValues={defaultChangeFormValues()}
      submitLabel="Salvar GMUD"
      busy={createChange.isPending}
      onSubmit={async (input) => {
        await createChange.mutateAsync(input);
        toast('GMUD criada · checklist gerado');
        router.back();
      }}
    />
  );
}
