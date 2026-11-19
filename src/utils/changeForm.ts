import { z } from 'zod';

import { parseSpInput } from './format';

/** Validation rules for the "Nova GMUD" form (messages in pt-BR). */
export const changeFormSchema = z
  .object({
    changeNumber: z
      .string()
      .trim()
      .regex(/^CHG\d{7}$/i, 'Use o formato CHG seguido de 7 dígitos (ex.: CHG0012350).'),
    title: z.string().trim().min(5, 'Descreva a mudança em pelo menos 5 caracteres.'),
    description: z.string().trim(),
    windowStart: z
      .string()
      .refine((v) => parseSpInput(v) !== null, 'Data inválida. Use dd/mm/aaaa hh:mm.'),
    windowEnd: z
      .string()
      .refine((v) => parseSpInput(v) !== null, 'Data inválida. Use dd/mm/aaaa hh:mm.'),
    executorTeam: z.string().trim(),
    executorContact: z.string().trim(),
    applicationIds: z.array(z.string()).min(1, 'Selecione ao menos uma aplicação afetada.'),
  })
  .refine(
    (v) => {
      const s = parseSpInput(v.windowStart);
      const e = parseSpInput(v.windowEnd);
      return !s || !e || e > s;
    },
    { message: 'O fim da janela precisa ser depois do início.', path: ['windowEnd'] },
  );

export type ChangeFormValues = z.input<typeof changeFormSchema>;
