# KeepOps — Diário de progresso

> Cópia no repositório do diário mantido no Projeto do Claude. Atualizar ao fim de cada etapa.

## Estado atual
- Etapa: **Etapa 9 entregue (20/11 ~12h30)** — MVP completo; falta gravar o vídeo. Etapas 0–8 validadas, 45 testes passando no Windows.
- Supabase: projeto `keepops` em us-west-2 (Oregon), plano free.
- Stack instalada: Expo SDK 58, React Native 0.88, Expo Router, TypeScript strict, Geist/Geist Mono, lucide-react-native, react-native-svg, ESLint (eslint-config-expo) + Prettier.

## Etapas
- [x] 0 — Projeto Expo, TS strict, ESLint/Prettier, tokens KeepOps, fontes Geist, assets da marca, 5 abas
- [x] 1–2 — Supabase (migrations, enums, RLS, seed, tipos) + Auth com atalhos demo + corte vertical de GMUD
- [x] 3 — Design system + Início
- [x] 4 — GMUDs
- [x] 5 — Validação + health check + concluir GMUD
- [x] 6 — Ocorrências + Pendências
- [x] 7 — Turnos + passagem + recebimento (MARCO: grosso pronto)
- [x] 8 — Resumo do período, métricas, testes
- [x] 9 — Polimento, README, vídeo

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
- 20/11 — Etapa 7 (marco): aba Plantões (turno atual com prévia da passagem gerada por buildHandover, observações/próximos passos com rascunho salvo, compartilhar via Share, encerrar com snapshot; histórico), detalhe da passagem com Confirmar recebimento, banner no Início, refetch ao focar abas.
- 20/11 — Etapa 8: Resumo do período (último fim de semana / últimas 24h, agrupado por turno, compartilhável), Métricas (taxa de falha + MTTR com filtro semana × fim de semana, gráficos simples), cards no Início, jest-expo + 45 testes das funções puras (`npm test`).
- 20/11 — Etapa 9: seed alinhado ao roteiro do vídeo (CHG0012345 aguardando liberação, baseline 120 ms, INC livre para criar ao vivo, passagens do fim de semana com snapshot real), microanimações de entrada, card de resumo com atalhos fim de semana/24h, LICENSE e README finais, docs/ROTEIRO.md (vídeo + apresentação).
