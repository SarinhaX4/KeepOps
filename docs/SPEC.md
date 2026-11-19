# PROMPT DE INICIALIZAÇÃO — NEXOPS

> Cole este documento como primeira mensagem para o agente de desenvolvimento (Claude Code, Cursor etc.) ou salve como `CLAUDE.md` na raiz do repositório. Ele é a especificação oficial do projeto.

---

## 0. SEU PAPEL

Atue como um time completo: **Product Manager, UX/UI Designer, Arquiteto de Software, Desenvolvedor Mobile Sênior (React Native) e Engenheiro DevOps/SRE**.

Você vai construir comigo o **NexOps**, um aplicativo mobile real e funcional. Eu sou estudante de Engenharia de Software com experiência em infraestrutura (sustentação, GMUDs, patching WebLogic/OHS, vulnerabilidades), mas meu conhecimento de programação mobile ainda está em desenvolvimento.

### Regras de trabalho (obrigatórias)
1. **Trabalhe em etapas.** Ao fim de cada etapa da Seção 12, PARE, explique o que foi feito, diga como eu testo e espere minha confirmação antes de seguir.
2. **Explique decisões técnicas** em linguagem simples, sem enrolação.
3. **Entregue arquivos completos**, sempre indicando o caminho exato (`app/(tabs)/index.tsx`, por exemplo).
4. **Peça permissão antes de adicionar qualquer dependência** que não esteja listada na Seção 8.
5. **Nada de botão decorativo.** Todo elemento clicável executa uma ação real ou não existe.
6. **Nada de dados reais.** Sem nomes de empresas reais, IPs, hosts, credenciais ou clientes. Tudo fictício e identificado como demonstrativo.
7. **Não afirme integrações que não existem** (ServiceNow, Jira, Qualys). Números de chamado são campos de texto.
8. Interface 100% em **português do Brasil**. Código, nomes de variáveis e commits em **inglês**.
9. TypeScript em modo `strict`. Sem `any` sem justificativa.
10. Quando algo der erro, ajude-me a ler a mensagem e diagnosticar antes de reescrever código.

---

## 1. CONTEXTO ACADÊMICO

- Disciplina: atividade AT2-N2 — app mobile em **React Native**.
- Avaliação: **problema real**, **UI/UX** e **funcionalidade real**.
- Entrega: **vídeo de ~30 segundos** + apresentação em sala. Código-fonte não é exigido.
- Prazo: **~1 semana**.
- Objetivo secundário: o projeto vai para meu **portfólio de SRE/DevOps**, então a qualidade de engenharia (estrutura, testes, CI, README) importa.

---

## 2. O PRODUTO

**Nome:** NexOps
**Slogan:** Continuidade operacional na palma da mão.
**Definição em uma frase:** o caderno de validação digital do plantonista que acompanha mudanças de infraestrutura fora do horário comercial (madrugadas e fins de semana) e garante que o próximo turno e a equipe da semana assumam o que ficou pendente.

### O problema
Em empresas que dependem de sistemas críticos (ex.: setor financeiro), mudanças (GMUDs) são executadas por equipes técnicas ou fornecedores **em janelas de baixo impacto**: madrugadas durante a semana e **fins de semana, inclusive durante o dia**. Um **plantonista do cliente**, sozinho no turno:
- espera o executor avisar "liberado para validação";
- valida manualmente as aplicações afetadas;
- aciona o executor quando algo falha;
- registra tudo em anotações soltas, chats e planilhas;
- no fim do turno, passa o plantão de forma verbal ou por mensagem.

Depois disso, dois públicos são afetados:
- **O próximo plantonista**, que assume o turno seguinte e precisa da passagem.
- **A equipe de sustentação da semana**, que na manhã seguinte (ou na **segunda-feira**, após um fim de semana com várias GMUDs) precisa reconstruir o que aconteceu a partir de fragmentos espalhados por vários turnos e **assumir as pendências** que sobraram.

### O que o NexOps responde
1. Quais mudanças aconteceram nesta janela (ou neste fim de semana) e em que estado estão?
2. O que foi validado, o que falhou e quem foi acionado?
3. O que o próximo turno precisa saber e fazer?
4. Quais pendências a equipe da semana precisa assumir, e quem ficou responsável por cada uma?

### Posicionamento
O NexOps **não substitui** ServiceNow ou ferramentas de ITSM. Ele é a ferramenta de **quem valida**, não de quem executa. Os registros formais continuam no ITSM; o NexOps referencia os números (CHG, INC) como texto.

### Natureza da colaboração
A colaboração é **assíncrona**, em dois níveis, nunca simultânea. Não precisamos resolver edição concorrente. O foco é a **continuidade**.
- **Turno → turno:** passagem de plantão (noite → dia, sábado dia → sábado noite etc.).
- **Plantão → equipe da semana:** resumo de um período inteiro (ex.: sexta 22h → segunda 7h) com pendências que alguém da equipe **assume**.

### Tipos de turno
O app trata qualquer turno da mesma forma; o tipo serve para organização e filtros:
- **Noturno (semana):** ex.: 22h–7h.
- **Diurno (semana):** ex.: 7h–19h.
- **Fim de semana:** diurno ou noturno, sábado, domingo e feriados.
O tipo é **sugerido automaticamente** pela data e hora de início, e o usuário pode ajustar.

---

## 3. PERSONAS

### Ana — plantonista (noites e fins de semana) — usuária principal
- Trabalha sozinha no turno: madrugadas durante a semana e escalas de sábado/domingo, inclusive de dia.
- Precisa registrar rápido, com uma mão, cansada, às 3h da manhã ou num sábado com várias janelas seguidas.
- Necessidades: checklist pronto, poucos toques, prova de que validou e acionou, passagem sem reescrever tudo.

### João — próximo plantonista
- Assume o turno seguinte (dia da semana, ou o próximo turno da escala de fim de semana).
- Precisa entender o estado da operação em menos de 1 minuto.
- Necessidades: resumo claro, pendências destacadas, confirmar que recebeu.

### Marina — analista da equipe de sustentação (semana)
- Não faz plantão. Trabalha em horário comercial e é afetada por tudo que as GMUDs mudaram.
- Na segunda-feira (ou no dia seguinte a uma janela), quer ver **tudo o que aconteceu no período** sem abrir passagem por passagem.
- Necessidades: resumo do período, lista de pendências, **assumir** pendências (ficar como responsável) e concluí-las, avisando a equipe.

### Executor / fornecedor
- **Não usa o app.** Aparece apenas como campo de texto ("Equipe responsável" e "Contato para acionamento") na GMUD.

---

## 4. FLUXOS PRINCIPAIS (guia de todas as decisões)

### Fluxo A — Turno a turno
```
Ana inicia o turno (tipo sugerido: noturno ou fim de semana)
  → vê as pendências abertas (inclusive as herdadas de turnos anteriores)
  → cadastra as GMUDs da janela (vindas do calendário de mudanças)
  → executor avisa "liberado" → Ana muda status para "Em validação"
  → abre a validação: o checklist de cada aplicação afetada já vem pronto
  → executa health check (antes/depois) + marca passos manuais
  → um passo falha → registra ocorrência a partir do passo reprovado
  → registra acionamento do executor (canal, horário, contato, INC)
  → conclui a GMUD (Validada / Com ressalvas / Reprovada)
  → o que ficou em aberto vira PENDÊNCIA (gerada a partir do passo, ocorrência ou GMUD, ou criada manualmente)
  → gera a passagem de plantão (montada automaticamente) e encerra o turno
João abre o app
  → vê a passagem pendente de recebimento
  → lê o resumo por aplicação, pendências e acionamentos sem resposta
  → confirma o recebimento → as pendências abertas aparecem no Início dele
```

### Fluxo B — Fim de semana → equipe da semana
```
Sábado 10h: Ana acompanha uma GMUD diurna de fim de semana (mesmo fluxo A)
Sábado e domingo: outros turnos registram mais GMUDs, ocorrências e pendências
Segunda 9h: Marina abre o app
  → o Início mostra o card "Resumo do fim de semana disponível"
  → abre o Resumo do período (sexta 19h → segunda 7h): GMUDs, resultado por aplicação,
    ocorrências, acionamentos sem resposta e pendências abertas, em uma única tela
  → toca em "Assumir" numa pendência → passa a ser a responsável
  → ao resolver, marca como concluída com uma nota → todos veem o status atualizado
```

---

## 5. ESCOPO

### MVP — semana da entrega (OBRIGATÓRIO)
1. Login com usuários demonstrativos (atalho "Entrar como Ana / João / Marina").
2. **Início** (tela inicial que se adapta ao usuário): com turno aberto, mostra o painel do turno (GMUDs da janela por status, ocorrências abertas, acionamentos sem resposta); sem turno, mostra o que mudou desde o último acesso e o card do resumo do período. Para todos: pendências abertas ("Minhas" e "Sem responsável") e mini-métricas.
3. **GMUDs**: listar, filtrar, criar, editar, detalhar, mudar status.
4. **Catálogo de aplicações com roteiro de validação** (passos padrão por aplicação, reutilizados em toda GMUD).
5. **Validação**: checklist por aplicação, resultado por passo (Aprovado / Reprovado / N/A / Pendente), observação, foto de evidência, autor e horário automáticos.
6. **Health check HTTP sob demanda** com status code e latência, comparando **antes** (baseline) e **depois** da mudança.
7. **Ocorrências**: criar (inclusive a partir de um passo reprovado), severidade, número de INC externo, **linha do tempo** de eventos, **acionamentos** com marcação de resposta, resolução.
8. **Passagem de plantão**: turnos de qualquer tipo (noturno, diurno, fim de semana), gerada automaticamente dos registros, observações manuais, compartilhar texto (Teams/WhatsApp via Share nativo), histórico e **confirmação de recebimento**.
9. **Pendências** com responsável: criadas a partir de passo reprovado, ocorrência, GMUD com ressalvas ou manualmente; podem ser **assumidas**, reatribuídas e concluídas com nota; persistem entre turnos até serem concluídas.
10. **Resumo do período**: consolida vários turnos em uma única visão, com atalhos "Último fim de semana", "Últimas 24h" e período personalizado; pode ser compartilhado como texto.
11. **Métricas operacionais (inspiradas em DORA/SRE)**: taxa de falha de mudanças e MTTR das ocorrências, com filtro semana × fim de semana.
12. Dados compartilhados entre usuários e dispositivos via Supabase.

### Se sobrar tempo
- Atualização em tempo real (Supabase Realtime) na tela Início.
- Tema claro (o escuro é o principal).

### Fase 2 — portfólio (DEPOIS da entrega acadêmica)
- GitHub Actions: lint, typecheck e testes em todo PR; build via EAS.
- Migrations aplicadas por pipeline (Supabase CLI).
- Edge Function agendada (cron) executando health checks no servidor.
- Edge Function "ambiente simulado" com falhas controláveis para demonstração.
- Push notification para o próximo plantonista quando a passagem fica pronta e para a equipe da semana quando o resumo do fim de semana é fechado.
- Envio agendado do "Resumo do fim de semana" toda segunda às 8h (Edge Function + cron).
- Webhook postando a passagem no Slack/Teams.
- Sentry para erros do app.
- Página web pública do "Relatório pós-janela".
- README com diagrama de arquitetura, ADRs e GIF do fluxo.

### Fora do escopo
Integração real com ServiceNow/Jira/Qualys, monitoramento contínuo, execução de comandos em servidores, permissões complexas por papel, Terraform/Kubernetes.

---

## 6. TELAS E NAVEGAÇÃO

### Estrutura
- **(auth)** Login.
- **(tabs)** barra inferior com 5 abas: **Início · GMUDs · Ocorrências · Pendências · Plantões**.
- No cabeçalho do Início: ícone de **Aplicações** (catálogo e roteiros) e avatar (perfil / sair).

### Telas

**Login**
- Logo, slogan, e-mail/senha.
- Atalhos "Entrar como Ana (plantonista)", "João (plantonista)" e "Marina (equipe da semana)" com selo *Ambiente demonstrativo*.

**Início (home)**
- Saudação + estado do turno (botão "Iniciar turno" para plantonistas; cronômetro e tipo do turno se aberto).
- Banner "Passagem aguardando seu recebimento" (se houver) → leva à passagem.
- Card "Resumo do fim de semana disponível" (segunda e terça) ou "Resumo das últimas 24h" (demais dias) → Resumo do período.
- Pendências: "Minhas" e "Sem responsável", cada uma com botão "Assumir".
- Com turno aberto: cards da janela Agendadas · Em validação · Validadas · Com falha (tocáveis, levam à lista filtrada), ocorrências abertas e acionamentos sem resposta (com tempo decorrido).
- Card de métricas (taxa de falha, MTTR) → tela Métricas.
- Pull-to-refresh.

**Pendências**
- Abas segmentadas: Minhas · Sem responsável · Todas · Concluídas.
- Item: título, origem (GMUD/ocorrência/passo, tocável), aplicação, criada em qual turno (ex.: "Sáb · fim de semana"), responsável, idade.
- Ações: Assumir, Reatribuir, Concluir (com nota obrigatória). Criação manual via FAB.

**Plantões**
- Abas segmentadas: **Turno atual · Histórico · Resumo do período**.

**Resumo do período**
- Seletor: Último fim de semana · Últimas 24h · Personalizado (início e fim).
- Cabeçalho com números do período: GMUDs, validadas, com falha, ocorrências, pendências abertas.
- Seções: GMUDs em ordem cronológica agrupadas por turno (com tipo e plantonista), resultado por aplicação, ocorrências e acionamentos sem resposta, pendências abertas com "Assumir".
- "Compartilhar" (texto formatado via Share nativo).

**GMUDs — lista**
- Chips de filtro por status, busca por número/título.
- Item: número em fonte mono, título, janela, apps afetadas (ícones/siglas), badge de status.
- FAB "Nova GMUD".

**GMUD — formulário (criar/editar)**
- Número (ex.: CHG0012345), título, descrição curta, início e fim da janela, equipe executora, contato, aplicações afetadas (multi-seleção).
- No máximo uma tela de rolagem. Validação com mensagens claras.

**GMUD — detalhe**
- Cabeçalho com número, título e badge de status.
- Ação principal contextual por status (ex.: "Liberada para validação", "Iniciar validação", "Concluir").
- Lista de aplicações afetadas com progresso da validação (ex.: 3/5 ✓, 1 ✗).
- Linha do tempo da GMUD (mudanças de status, validações, ocorrências vinculadas).

**Validação — por aplicação**
- Bloco de health check: "Baseline" e "Pós-mudança" lado a lado (status code, latência, horário) e botão "Executar check".
- Lista de passos do roteiro com controle segmentado grande: ✓ Aprovado · ✗ Reprovado · N/A.
- Ao reprovar: campo de observação, foto opcional e botões "Abrir ocorrência" (pré-preenchida) e "Criar pendência".
- Autor e horário aparecem automaticamente em cada passo concluído.

**Concluir GMUD**
- Resultado sugerido automaticamente (todos aprovados → Validada; algum N/A ou ressalva → Com ressalvas; algum reprovado → Reprovada). O usuário pode ajustar com justificativa.
- Se o resultado não for "Validada", o app sugere criar uma pendência para a equipe (pré-preenchida).

**Ocorrências — lista e detalhe**
- Lista com severidade (SEV1–SEV4), aplicação, INC, tempo aberto.
- Detalhe: dados + **linha do tempo** com eventos: Nota, Acionamento (canal, contato, "respondido em"), Atualização, Resolução.
- Botões: "Registrar acionamento", "Marcar como respondido", "Adicionar nota", "Resolver".

**Passagem (aba Turno atual de Plantões)**
- Turno atual: prévia gerada automaticamente em seções (GMUDs da janela, resultado por aplicação, ocorrências, acionamentos sem resposta, pendências abertas) + campos "Observações" e "Próximos passos".
- "Encerrar turno e gerar passagem" (com confirmação) → salva um snapshot.
- "Compartilhar" (texto formatado via Share nativo).
- Histórico de passagens; detalhe com "Confirmar recebimento" (para quem não é o autor).

**Aplicações**
- Lista: nome, criticidade, URL de health check, último resultado.
- Detalhe: editar dados, editar roteiro (adicionar, remover e reordenar passos), histórico de checks.

**Métricas**
- Taxa de falha de mudanças (últimos 30 dias), MTTR, total de GMUDs por status, ocorrências por severidade, pendências abertas por idade. Filtro: Todas · Semana · Fim de semana. Gráficos simples.

---

## 7. MODELO DE DADOS (Supabase / PostgreSQL)

Use `uuid` como chave primária, `timestamptz` para datas e `created_at default now()`. Use enums do Postgres para status.

```
teams            (id, name)
profiles         (id = auth.users.id, team_id, full_name, role ['plantonista','analista'], avatar_color)
applications     (id, team_id, name, short_name, description, criticality ['alta','media','baixa'], health_url)
validation_steps (id, application_id, position, title, kind ['manual','http_check'])
changes          (id, team_id, change_number, title, description, window_start, window_end,
                  executor_team, executor_contact,
                  status ['agendada','aguardando_liberacao','em_validacao','validada',
                          'validada_com_ressalvas','reprovada','cancelada'],
                  conclusion_note, created_by, created_at, updated_at)
change_applications (change_id, application_id)   -- PK composta
validations      (id, change_id, application_id, step_id, step_title,   -- título copiado (snapshot)
                  result ['pendente','aprovado','reprovado','na'],
                  note, evidence_path, performed_by, performed_at)
health_checks    (id, application_id, change_id null, phase ['baseline','pos','avulso'],
                  http_status, latency_ms, ok, error_message, checked_by, checked_at)
incidents        (id, team_id, change_id null, application_id, validation_id null,
                  title, severity ['sev1','sev2','sev3','sev4'],
                  status ['aberta','em_acompanhamento','resolvida'],
                  external_ticket, opened_by, opened_at, resolved_at)
incident_events  (id, incident_id, kind ['nota','acionamento','atualizacao','resolucao'],
                  description, channel null, contact null, responded_at null,
                  created_by, created_at)
shifts           (id, team_id, user_id, started_at, ended_at,
                  kind ['noturno','diurno','fim_de_semana'],
                  status ['aberto','encerrado','recebido'],
                  notes, next_steps, handover_snapshot jsonb,
                  received_by, received_at)
follow_ups       (id, team_id, title, description,
                  source_type ['change','incident','validation','manual'], source_id null,
                  application_id null, created_in_shift_id null,
                  status ['aberta','em_andamento','concluida'],
                  assigned_to null, assigned_at null,
                  resolution_note null, resolved_by null, resolved_at null,
                  created_by, created_at)
```

### Regras
- **RLS ativado em todas as tabelas**: o usuário só lê e escreve registros do seu `team_id` (via `profiles`).
- Storage: bucket privado `evidences`, com caminho `{team_id}/{change_id}/{uuid}.jpg`.
- Ao vincular uma aplicação a uma GMUD, criar automaticamente os registros `validations` (status `pendente`) a partir do roteiro dessa aplicação.
- **A passagem é derivada**, não digitada: uma função pura `buildHandover(data)` monta o objeto. O snapshot é salvo em `shifts.handover_snapshot` ao encerrar o turno.
- **O resumo do período também é derivado**: `buildPeriodSummary(from, to, data)` consulta GMUDs com janela no intervalo, os turnos do intervalo, ocorrências e pendências. Não é salvo; é calculado na hora.
- **Pendências são a única coisa que atravessa turnos e dias.** Elas ficam abertas até alguém concluir, independentemente de passagem. A passagem e o resumo apenas listam as pendências abertas com o status atual.
- `kind` do turno é sugerido por `suggestShiftKind(startedAt)`: sábado, domingo ou feriado → `fim_de_semana`; entre 19h e 7h → `noturno`; senão → `diurno`. Feriados: lista fixa em `src/utils/holidays.ts`.
- Ao concluir uma pendência, `resolution_note` é obrigatória.

### Métricas
- **Taxa de falha de mudanças** = (GMUDs `reprovada` + `validada_com_ressalvas` + GMUDs com ocorrência vinculada) ÷ GMUDs finalizadas no período.
- **MTTR** = média de (`resolved_at − opened_at`) das ocorrências resolvidas no período.
- Ambas podem ser filtradas por **semana × fim de semana** (pela data da janela da GMUD).
- Implemente em `src/utils/metrics.ts` como funções puras, **com testes unitários**.

---

## 8. ARQUITETURA E STACK

### Stack (não adicionar nada além disso sem perguntar)
- **Expo** (SDK estável mais recente) + **TypeScript** + **Expo Router**
- **Supabase**: Postgres, Auth (e-mail/senha), Storage, RLS; `@supabase/supabase-js`
- **TanStack Query v5**: cache, loading/erro, refetch e atualização otimista
- **Zustand**: estado de sessão/turno atual (leve)
- **react-hook-form + zod**: formulários e validação
- **date-fns** (locale `ptBR`)
- **lucide-react-native** + **react-native-svg** (ícones, iguais aos do protótipo), **expo-haptics**, **expo-image-picker**, **expo-secure-store** (sessão)
- **react-native-reanimated** (já vem no Expo) para microanimações
- Fontes **Geist** (UI) e **Geist Mono** (números de GMUD/INC, latências, horários); ver Seção 9
- **Jest** + `@testing-library/react-native` para testes de utils e componentes-chave
- **ESLint + Prettier**

### Estrutura de pastas
```
app/
  _layout.tsx
  (auth)/login.tsx
  (tabs)/_layout.tsx
  (tabs)/index.tsx                 # Início
  (tabs)/changes/index.tsx
  (tabs)/incidents/index.tsx
  (tabs)/follow-ups/index.tsx      # Pendências
  (tabs)/shifts/index.tsx          # Plantões (turno atual, histórico, resumo do período)
  changes/new.tsx
  changes/[id]/index.tsx
  changes/[id]/edit.tsx
  changes/[id]/validate/[appId].tsx
  changes/[id]/conclude.tsx
  incidents/new.tsx
  incidents/[id].tsx
  shifts/[id].tsx                  # detalhe da passagem
  shifts/summary.tsx               # resumo do período
  follow-ups/new.tsx
  follow-ups/[id].tsx
  applications/index.tsx
  applications/[id].tsx
  metrics.tsx
src/
  lib/supabase.ts
  lib/queryClient.ts
  services/        # acesso a dados por entidade (changes.ts, incidents.ts...)
  hooks/           # useChanges, useIncident, useCurrentShift...
  components/ui/   # design system genérico
  components/domain/  # StatusBadge, ValidationStepRow, Timeline, HealthCheckCard...
  theme/           # tokens: colors, spacing, radius, typography
  utils/           # handover.ts, periodSummary.ts, shiftKind.ts, holidays.ts, metrics.ts, healthcheck.ts, format.ts
  types/database.ts   # gerado por `supabase gen types`
  store/session.ts
supabase/
  migrations/
  seed.sql
__tests__/
```

### Princípios
- Telas não chamam o Supabase diretamente: **tela → hook (TanStack Query) → service → Supabase**.
- Lógica de negócio (passagem, resumo do período, tipo de turno, métricas, resultado sugerido, health check) em **funções puras testáveis** em `src/utils`.
- Datas: armazenar em UTC (`timestamptz`) e exibir em `America/Sao_Paulo`. O cálculo de "fim de semana" usa o fuso local.
- Health check: `fetch` com `AbortController` (timeout de 8 s), medindo latência com `performance.now()`. Considerar falha: timeout, erro de rede ou status ≥ 400.
- Endpoints de demonstração: serviços públicos de teste (ex.: `https://httpbin.org/status/200`, `/status/503`, `/delay/2`), claramente rotulados como **simulados**. Na Fase 2, isso migra para uma Edge Function própria.

---

## 9. DESIGN SYSTEM

### Direção
Ferramenta de operações profissional, inspirada em apps de observabilidade. **Tema escuro principal**, alto contraste, informação densa porém respirável. Deve parecer produto real.

### Identidade aprovada: paleta "Terminal" (preto + verde esmeralda + azul)
Estética minimalista inspirada em Vercel e Linear: fundo quase preto, cartões com bordas sutis, muito espaçamento interno, tipografia bem hierarquizada, verde como cor da marca e azul para estados informativos. O protótipo aprovado é a tela Início do turno da Ana (variante B · Terminal).

### Tokens (usar exatamente estes em `src/theme/colors.ts`)
```
bg          #050607                 surface     #0D0F10          surface2   #1C2023
border      rgba(255,255,255,0.08)  borderHi    rgba(255,255,255,0.18)
text        #EDEFEE                 muted       #9BA3A0          dim        #68716D
accent      #10B981 (botão primário, texto do botão #022C22)
accentText  #6EE7B7 (links, aba ativa)   accentSoft rgba(16,185,129,0.14)
info        #38BDF8  infoText #7DD3FC   infoSoft rgba(56,189,248,0.13)
ok          #10B981  okText   #6EE7B7   okSoft   rgba(16,185,129,0.14)
warn        #F59E0B  warnText #FCD34D   warnSoft rgba(245,158,11,0.14)
bad         #F43F5E  badText  #FDA4AF   badSoft  rgba(244,63,94,0.14)
radius: 8 (chips) / 12 (botões, inputs) / 14–16 (cards)     spacing: escala de 4 (4, 8, 12, 16, 20, 24, 28)
```
Badges e chips: fundo `*Soft` + texto `*Text`. Números grandes e valores de destaque: `text` ou `*Text`.

### Tipografia
- **Geist** (UI): 11 (rótulos da tab bar), 12 (meta), 13 (títulos de seção, CAIXA ALTA, letter-spacing 0.04em, cor `muted`), 14–15 (corpo), 16 (título de card, 600), 24–30 (números e saudação, 600, letter-spacing negativo).
- **Geist Mono**: números de GMUD/INC, horários, latências, cronômetro do turno, contadores.
- Fontes via `@expo-google-fonts/geist` e `@expo-google-fonts/geist-mono`. Se algum pacote não existir, baixar os arquivos da Geist e carregar com `expo-font`.

### Padrões do protótipo aprovado (reproduzir)
- Cabeçalho: marca (quadrado 30 px com ícone `Activity`) + "NexOps" + selo `DEMO`; à direita, botão de Aplicações e avatar com iniciais (44 px).
- Cartão de turno: ponto verde pulsando + "Turno noturno em andamento" + cronômetro em mono.
- Grade 2×2 de contadores da janela com ponto colorido por status.
- Cartão "Em validação agora": número da GMUD, badge de status, título, janela e executor, barra segmentada de progresso (ok / falha / pendente), lista de aplicações com ícone de resultado e valor em mono (ex.: `5/5 · 118 ms`, `HTTP 503`), botão primário de largura total.
- Lista de pendências com botão "Assumir" (contorno) que vira "Com você" (verde suave).
- Tab bar com 5 itens: ícone 20 px + rótulo 11 px; ativo em `accentText`, inativos em `dim`.

### Semântica de status (consistente em todo o app)
- Verde: aprovado, validada, disponível, resolvida.
- Âmbar: pendente, aguardando, com ressalvas, acionamento sem resposta.
- Vermelho (rosa-vermelho `bad`): reprovado, reprovada, indisponível, SEV1/SEV2.
- Azul (`info`): em validação, informativo.
- Cinza: agendada, N/A, cancelada.
- Selo de tipo de turno (discreto, sem conflitar com status): ícone lua = noturno, sol = diurno, calendário = fim de semana.
- **Nunca usar só cor**: sempre cor + ícone + texto.

### Componentes base
`Screen`, `Header`, `Card`, `StatCard`, `StatusBadge`, `Chip`, `Button` (primary/secondary/danger/ghost), `IconButton`, `FAB`, `TextField`, `DateTimeField`, `MultiSelect`, `SegmentedResult`, `ListItem`, `SectionHeader`, `Timeline`, `EmptyState`, `Skeleton`, `ErrorState`, `ConfirmSheet`, `Toast`, `DemoBadge`.

### Requisitos de UX
- Alvos de toque ≥ 44 pt. Ações principais ao alcance do polegar.
- **Todo estado de tela**: carregando (skeleton), vazio (com ação sugerida), erro (com "Tentar novamente") e sucesso.
- Atualização otimista nos passos de validação (resposta instantânea) e haptics leves ao marcar.
- Confirmação antes de ações irreversíveis (encerrar turno, cancelar GMUD, resolver ocorrência).
- Toasts de feedback ("Validação salva", "Acionamento registrado").
- Datas relativas ("há 12 min") e absolutas no detalhe.
- Teclado não cobre campos (`KeyboardAvoidingView`). Formulários curtos.
- `accessibilityLabel` em ícones e botões sem texto. Contraste mínimo AA.
- Microanimações discretas (entrada de cards, troca de status). Nada chamativo.

---

## 10. DADOS DEMONSTRATIVOS (seed)

- Equipe: **"NOC Demo — Banco Fictício S.A."**
- Usuários: **Ana Souza** (plantonista), **João Lima** (plantonista), **Marina Costa** (analista da equipe da semana). Senhas de demonstração documentadas no README.
- Aplicações (com roteiros de 3 a 5 passos cada): Portal de Pagamentos, API de Pagamentos, Internet Banking, Serviço de Autenticação, Barramento de Integração.
- GMUDs:
  - `CHG0012345` — Atualização de Java no cluster de pagamentos (Portal + API) → em validação, com a API reprovada.
  - `CHG0012346` — Aplicação de patch no OHS (Internet Banking) → validada.
  - `CHG0012347` — Renovação de certificado (Autenticação) → agendada.
  - `CHG0012348` — Atualização de kernel no Barramento de Integração, **sábado 10h (fim de semana, diurno)** → validada com ressalvas.
  - `CHG0012349` — Reinício programado do Internet Banking, **domingo 6h** → validada.
- Ocorrência: falha na API de Pagamentos, SEV2, `INC0012345`, com 1 acionamento sem resposta.
- Turnos do último fim de semana (sábado diurno, sábado noturno, domingo diurno), com passagens recebidas.
- Pendências: 2 sem responsável vindas do fim de semana (ex.: "Reprocessar fila do barramento após kernel"), 1 assumida por Marina, 1 concluída com nota.
- Histórico de 30 dias, com GMUDs na semana e no fim de semana, para as métricas e o filtro fazerem sentido.

---

## 11. CRITÉRIOS DE ACEITE (o que precisa funcionar de verdade)

- [ ] Ana cria uma GMUD no celular A e João a vê no celular B após atualizar.
- [ ] Vincular aplicações à GMUD gera o checklist automaticamente a partir do roteiro.
- [ ] Marcar um passo grava resultado, autor e horário no banco.
- [ ] Health check executa uma requisição real e grava status e latência; baseline e pós aparecem lado a lado.
- [ ] Reprovar um passo permite abrir ocorrência pré-preenchida e vinculada.
- [ ] Acionamentos aparecem na linha do tempo e em "sem resposta" até serem marcados.
- [ ] A passagem é gerada sem digitação, reflete o estado real e pode ser compartilhada como texto.
- [ ] João confirma o recebimento, e as pendências abertas aparecem no Início dele.
- [ ] Um turno iniciado no sábado às 10h é sugerido como "Fim de semana".
- [ ] Marina abre o Resumo do período "Último fim de semana" e vê GMUDs, ocorrências e pendências de **todos** os turnos do intervalo.
- [ ] Marina assume uma pendência; ela some de "Sem responsável" e aparece em "Minhas" para ela, com o nome dela visível para todos.
- [ ] Concluir uma pendência exige nota e grava autor e horário.
- [ ] As métricas mudam quando os dados mudam, e o filtro semana × fim de semana funciona.
- [ ] Nenhuma tela trava sem feedback: há loading, vazio e erro tratados.
- [ ] `buildHandover`, `buildPeriodSummary`, `suggestShiftKind`, `metrics` e `suggestConclusion` têm testes unitários passando.

---

## 12. CRONOGRAMA (início ter 17/11 · entrega qui 26/11)

Estratégia: **primeiro o "grosso"** (o fluxo completo funcionando de ponta a ponta, com visual correto, até **seg 23/11**), depois polimento e extras. Pare e valide comigo ao fim de cada etapa. Cada etapa termina com um commit.

Prioridades: **P0** = grosso, obrigatório até seg 23 · **P1** = polimento, até qua 25 · **P2** = depois da entrega (portfólio).

| Data | Etapa | Entrega (P0 salvo indicação) | Como validar |
|---|---|---|---|
| Ter 17 | 0 | Projeto Expo + TS strict + Expo Router + ESLint/Prettier + tokens da paleta Terminal + fontes Geist + tab bar com as 5 abas vazias | App abre no Expo Go com o tema e a navegação |
| Qua 18 | 1–2 | Supabase: migrations, enums, RLS, seed completo, tipos gerados. Auth com atalhos demo + **corte vertical** (lista e criação simples de GMUD) | GMUD criada no aparelho A aparece no B |
| Qui 19 | 3 | Componentes do design system + tela **Início** fiel ao protótipo, com dados reais | Início igual ao protótipo, lendo do banco |
| Sex 20 | 4 | GMUDs: lista com filtros, formulário, detalhe, transições de status, geração automática do checklist ao vincular aplicações | Criar GMUD e ver checklist gerado |
| Sáb 21 | 5 | Validação por aplicação (passos, observação, autor/horário), health check baseline × pós, concluir GMUD com resultado sugerido | Validar uma GMUD inteira |
| Dom 22 | 6 | Ocorrências (criar a partir de passo reprovado, timeline, acionamentos, resolver) + Pendências (criar, assumir, concluir com nota) | Falha → ocorrência → acionamento → pendência |
| Seg 23 | 7 | Turnos (iniciar com tipo sugerido, encerrar), passagem gerada e compartilhada, histórico, confirmar recebimento. **MARCO: grosso pronto** | Ciclo Ana → João completo |
| Ter 24 | 8 | P1: Resumo do período (fim de semana / 24h), card de métricas, testes unitários das funções puras, estados de loading/vazio/erro em todas as telas | Ciclo fim de semana → Marina; testes passando |
| Qua 25 | 9 | P1: polimento visual, haptics, ícone e splash, seed final da demo, README curto. **Gravar o vídeo** e preparar a apresentação | Vídeo de 30 s gravado |
| Qui 26 | — | Entrega e apresentação. Sem código novo, só ensaio | — |

**P2 (pós-entrega):** foto de evidência, reatribuir pendência, período personalizado, tela de Métricas completa, edição de roteiros, Realtime, CI/CD e itens da Fase 2.

**Se atrasar**, corte nesta ordem: Realtime → foto de evidência → tela de Métricas completa (fica o card) → período personalizado → reatribuir → Resumo do período (a passagem cobre o essencial). **Nunca corte** o fluxo GMUD → validação → ocorrência → passagem → recebimento.

---

## 13. ROTEIRO DO VÍDEO (30 s)

| Tempo | Cena |
|---|---|
| 0–4 s | Login como Ana → Início com turno aberto e GMUDs da janela |
| 4–9 s | Abre CHG0012345 → "Iniciar validação" |
| 9–14 s | Health check: baseline 120 ms → pós 503 em vermelho; marca passos (um ✗) |
| 14–18 s | "Abrir ocorrência" pré-preenchida → registra acionamento com INC |
| 18–22 s | Passagem gerada automaticamente → encerrar turno |
| 22–26 s | Troca para João → confirma recebimento |
| 26–30 s | Troca para Marina → "Resumo do fim de semana" → toca em "Assumir" numa pendência |

Na apresentação em sala, use o Fluxo B para mostrar que o app atende também as GMUDs de fim de semana e a equipe da semana.

---

## 14. COMECE AGORA

1. Leia tudo e me devolva em até 10 linhas: riscos que você vê e qualquer ajuste que recomende **antes** de codar.
2. Liste o que preciso ter instalado e quais contas criar (com links oficiais), para eu conferir.
3. Depois da minha confirmação, execute **somente a Etapa 0**, explicando cada comando e arquivo.
4. Ao fim de cada etapa, diga em uma linha se estamos no prazo do cronograma da Seção 12.
