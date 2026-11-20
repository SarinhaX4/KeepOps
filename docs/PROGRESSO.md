# KeepOps — Diário de progresso

> Cópia no repositório do diário mantido no Projeto do Claude. Atualizar ao fim de cada etapa.

## Estado atual
- Etapa: **Etapa 6 entregue (20/11 ~04h30)** — aguardando validação das Etapas 4, 5 e 6.
- Supabase: projeto `keepops` em us-west-2 (Oregon), plano free.
- Stack instalada: Expo SDK 58, React Native 0.88, Expo Router, TypeScript strict, Geist/Geist Mono, lucide-react-native, react-native-svg, ESLint (eslint-config-expo) + Prettier.

## Etapas
- [x] 0 — Projeto Expo, TS strict, ESLint/Prettier, tokens KeepOps, fontes Geist, assets da marca, 5 abas
- [x] 1–2 — Supabase (migrations, enums, RLS, seed, tipos) + Auth com atalhos demo + corte vertical de GMUD
- [x] 3 — Design system + Início
- [x] 4 — GMUDs
- [x] 5 — Validação + health check + concluir GMUD
- [x] 6 — Ocorrências + Pendências
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
- 20/11 — Etapa 4: migration 2 (change_events + trigger de histórico), lista com chips/busca, detalhe com ações por status (iniciar janela, liberar para validação, cancelar com confirmação), editar GMUD (sincroniza aplicações), linha do tempo, toast global e haptics.
- 20/11 — Etapa 5: tela de validação por aplicação (Aprovado/Reprovado/N/A otimista + haptics, observação, autor/horário, criar pendência), health check real baseline × pós com URL reserva (httpbingo.org), concluir GMUD com resultado sugerido + justificativa obrigatória se divergir + sugestão de pendência.
- 20/11 — Etapa 6: Ocorrências (lista Abertas/Resolvidas, nova com pré-preenchimento a partir do passo reprovado, detalhe com timeline, registrar acionamento, marcar respondido, nota, resolver) + Pendências (Minhas/Sem responsável/Todas/Concluídas, criar manual, detalhe com origem clicável, assumir, concluir com nota obrigatória).
