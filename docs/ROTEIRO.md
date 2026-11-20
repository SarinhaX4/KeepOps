# KeepOps — Roteiro do vídeo (30 s) e da apresentação

## Antes de gravar (5 min)
1. `npm run seed` **logo antes** de gravar — os horários da demo são relativos ao momento do seed.
2. `npx expo start -c`, abra no iPhone e faça **um ensaio completo** (o primeiro health check "acorda" a rede).
3. Esconda o botão azul de engrenagem do Expo Go: agite o celular para abrir o menu do Expo Go e desative o botão de ferramentas. Se não houver a opção, corte na edição.
4. iPhone: **Não Perturbe** ligado, brilho alto, Wi-Fi bom. Grave com a Gravação de Tela da Central de Controle.
5. Grave com calma (60–90 s) e **acelere na edição** (CapCut/iMovie, 1,5×–2×) até caber em 30 s. Cortes secos entre as cenas.

Estado inicial que o seed deixa pronto:
- **Ana** com turno aberto; CHG0012345 **aguardando liberação**, baseline já capturada (Portal 118 ms, API **120 ms**).
- A API de Pagamentos aponta para um endpoint de teste que responde **HTTP 503** (falha simulada).
- Fim de semana passado com 3 turnos, GMUD do kernel com ressalvas e pendências sem responsável.

## Vídeo — cena a cena

| Tempo | Cena | Toques |
|---|---|---|
| 0–4 s | Login como Ana → Início com turno aberto e a janela | "Entrar como Ana" |
| 4–9 s | Abrir a GMUD e liberar para validação | contador **Agendadas** (ou aba GMUDs) → **CHG0012345** → **Liberada para validação** → **API de Pagamentos** |
| 9–14 s | Health check: baseline **120 ms** × pós **HTTP 503** em vermelho; marcar o passo como reprovado | **Executar check (pós-mudança)** → no passo "Health check HTTP", **✗ Reprovado** |
| 14–18 s | Abrir ocorrência pré-preenchida e registrar acionamento com INC | **Abrir ocorrência** → **Abrir ocorrência** → **Registrar acionamento** (Telefone · "Plantão Middleware" · `INC0012345`) → **Salvar** |
| 18–22 s | Passagem gerada sozinha → encerrar turno | aba **Plantões** (rolar a prévia) → **Encerrar turno e gerar passagem** → confirmar |
| 22–26 s | Troca para João → confirma o recebimento | avatar → Sair → "Entrar como João" → banner **Passagem aguardando seu recebimento** → **Confirmar recebimento** |
| 26–30 s | Troca para Marina → resumo do fim de semana → assumir pendência | avatar → Sair → "Entrar como Marina" → **Último fim de semana** → **Assumir** em "Reprocessar fila do barramento" |

Texto sugerido na tela final: **KeepOps — Keep the context. Keep operations moving.**

## Apresentação em sala (5–7 min)

1. **Problema (1 min)** — "Quem valida mudança de madrugada e no fim de semana trabalha sozinho, anota em chat e passa o plantão de boca. Na segunda-feira a equipe reconstrói tudo a partir de fragmentos." (Vivência real de sustentação com GMUDs de patching.)
2. **Para quem (30 s)** — Ana (plantonista), João (próximo turno), Marina (equipe da semana). O executor não usa o app.
3. **Demo do Fluxo B (2–3 min)** — como Marina:
   - Início → card **Resumo do período** → **Último fim de semana**: GMUDs de sábado e domingo agrupadas por turno, a do kernel com ressalvas, ocorrência resolvida, pendências.
   - **Assumir** a pendência → ela vai para "Minhas" com o nome da Marina para todos.
   - Abrir a pendência → origem clicável (GMUD) → **Concluir** com nota obrigatória.
   - **Métricas**: taxa de falha e MTTR; alternar **Semana × Fim de semana**.
   - Curiosidade: hoje (20/11) é feriado — um turno iniciado hoje é sugerido como **fim de semana** automaticamente.
4. **Engenharia (1–2 min)** — Supabase com **RLS por equipe**; **triggers** que geram o checklist e o histórico; passagem e resumo **derivados** por funções puras; **45 testes** (Jest); health check real com timeout e endereço reserva; atualização otimista.
5. **Próximos passos (30 s)** — CI no GitHub Actions, health check agendado em Edge Function, push para o próximo plantonista, resumo automático de segunda às 8h.

## Se algo falhar ao vivo
- Sem internet no check → o app tenta o endereço reserva; se ainda falhar, mostra "Timeout após 8 s" (também é uma demonstração válida de falha).
- Dados "velhos" → `npm run seed` e recarregue (r no terminal do Expo).
