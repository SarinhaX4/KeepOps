# KeepOps — instruções para agentes

Leia nesta ordem antes de qualquer trabalho:

1. `docs/PROGRESSO.md` — etapa atual, decisões e próximo passo.
2. `docs/IDENTIDADE_VISUAL.md` — nome (KeepOps), slogan, logo e tokens de cor. **Manda sobre a Seção 9 da spec.**
3. `docs/SPEC.md` — especificação do produto (escrita quando o app se chamava NexOps; leia "KeepOps").
4. `AGENTS.md` — regras do Expo SDK 58 (rotas em `src/app/`, use `npx expo install`).

## Adaptações já decididas
- Rotas ficam em `src/app/` (template do SDK 58), não em `app/` na raiz. O resto segue `src/` como na spec.
- Abas são arquivos planos: `src/app/(tabs)/changes.tsx`, `incidents.tsx`, `follow-ups.tsx`, `shifts.tsx`.
- Foto de evidência = P2. Usuários demo criados por script Node com service key. Health check com URL reserva.
- Cores sempre via `@/theme` — nunca hex solto nas telas. Aqua = marca/ação; verde `ok` = aprovado.

## Supabase
- O ambiente do Claude NÃO alcança *.supabase.co. Migrations são aplicadas pela Sara no SQL Editor; seed roda na máquina dela (`npm run seed`, lê `.env.local`).
- `src/types/database.ts` é escrito à mão no formato do `supabase gen types` — mantenha em sincronia com `supabase/migrations/`.
- Chaves: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` (publishable) no app; `SUPABASE_SECRET_KEY` só no seed. Nunca commitar `.env.local`.

## Antes de dizer "pronto"
`npm run check` (typecheck + lint + Jest) sem erros. Testes em `__tests__/` importam `describe/it/expect` de `@jest/globals`.
