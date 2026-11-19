# KeepOps — Diário de progresso

> Cópia no repositório do diário mantido no Projeto do Claude. Atualizar ao fim de cada etapa.

## Estado atual
- Etapa: **Etapa 3 entregue (19/11 ~05h30)** — aguardando validação no iPhone. Etapas 1–2 validadas.
- Supabase: projeto `keepops` em us-west-2 (Oregon), plano free.
- Stack instalada: Expo SDK 58, React Native 0.88, Expo Router, TypeScript strict, Geist/Geist Mono, lucide-react-native, react-native-svg, ESLint (eslint-config-expo) + Prettier.

## Etapas
- [x] 0 — Projeto Expo, TS strict, ESLint/Prettier, tokens KeepOps, fontes Geist, assets da marca, 5 abas
- [x] 1–2 — Supabase (migrations, enums, RLS, seed, tipos) + Auth com atalhos demo + corte vertical de GMUD
- [x] 3 — Design system + Início
- [ ] 4 — GMUDs
- [ ] 5 — Validação + health check + concluir GMUD
- [ ] 6 — Ocorrências + Pendências
- [ ] 7 — Turnos + passagem + recebimento (MARCO: grosso pronto)
- [ ] 8 — Resumo do período, métricas, testes
- [ ] 9 — Polimento, README, vídeo

## Log
- 17/11 — Ambiente Windows preparado (Node 26, Git).
- 18/11 — Rebranding NexOps → KeepOps.
- 19/11 — Projeto criado e rodando no iPhone; Etapa 0 entregue e validada.
- 19/11 — App do Claude instalado no GitHub: a partir daqui o Claude faz commit/push direto; Sara só roda `git pull`.
- 19/11 — Etapas 1–2: schema + RLS + trigger de checklist (testados em PGlite), seed idempotente, login com atalhos demo, lista e criação de GMUD.
- 19/11 — Etapa 3: Início com dados reais (turno + cronômetro, iniciar turno com tipo sugerido, contadores da janela, card "Em validação agora", acionamentos sem resposta, pendências com Assumir otimista), catálogo de Aplicações, detalhe de GMUD (somente leitura), filtro por status na lista.
