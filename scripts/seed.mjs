// KeepOps — demo data seed.
//
// Usage (from the project root):  npm run seed
// Reads EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY from .env.local.
//
// It is idempotent: it wipes the demo team and recreates everything,
// so you can run it again before recording the video.
// All names, systems and tickets are fictitious.

import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error('Faltam variáveis no .env.local: EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const db = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const DEMO_PASSWORD = 'KeepOps#Demo2026';
const TEAM_NAME = 'NOC Demo — Banco Fictício S.A.';

const USERS = [
  {
    key: 'ana',
    email: 'ana.souza@example.com',
    full_name: 'Ana Souza',
    role: 'plantonista',
    avatar_color: '#10BFA5',
  },
  {
    key: 'joao',
    email: 'joao.lima@example.com',
    full_name: 'João Lima',
    role: 'plantonista',
    avatar_color: '#22C3EE',
  },
  {
    key: 'marina',
    email: 'marina.costa@example.com',
    full_name: 'Marina Costa',
    role: 'analista',
    avatar_color: '#8B5CF6',
  },
];

// ---------------------------------------------------------------------------
// Time helpers — São Paulo is UTC-3 all year (no DST since 2019).
// ---------------------------------------------------------------------------
const SP_OFFSET_H = -3;
const HOUR = 3_600_000;
const MIN = 60_000;
const now = new Date();

/** Calendar date in São Paulo as {y, m, d, dow}. */
function spToday() {
  const sp = new Date(now.getTime() + SP_OFFSET_H * HOUR);
  return { y: sp.getUTCFullYear(), m: sp.getUTCMonth(), d: sp.getUTCDate(), dow: sp.getUTCDay() };
}

/** São Paulo local time -> Date. dayOffset is relative to today in São Paulo. */
function sp(dayOffset, hour, minute = 0) {
  const t = spToday();
  return new Date(Date.UTC(t.y, t.m, t.d + dayOffset, hour - SP_OFFSET_H, minute));
}

const iso = (date) => date.toISOString();
const ago = (ms) => new Date(now.getTime() - ms);

// Offset (in days) of the most recent *completed-or-current* Saturday.
const today = spToday();
const lastSat = today.dow === 6 ? -7 : -((today.dow + 1) % 7);
const lastSun = lastSat + 1;
const lastFri = lastSat - 1;

// ---------------------------------------------------------------------------
async function must(promise, label) {
  const { data, error } = await promise;
  if (error) {
    console.error(`✗ ${label}:`, error.message);
    process.exit(1);
  }
  return data;
}

async function ensureUsers() {
  const ids = {};
  const { data, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  for (const u of USERS) {
    const existing = data.users.find((x) => x.email === u.email);
    if (existing) {
      await db.auth.admin.updateUserById(existing.id, {
        password: DEMO_PASSWORD,
        email_confirm: true,
      });
      ids[u.key] = existing.id;
    } else {
      const created = await must(
        db.auth.admin.createUser({
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.full_name },
        }),
        `criar usuário ${u.email}`,
      );
      ids[u.key] = created.user.id;
    }
  }
  return ids;
}

async function main() {
  console.log('→ Usuários demo');
  const uid = await ensureUsers();

  console.log('→ Limpando equipe demo anterior');
  await must(db.from('teams').delete().eq('name', TEAM_NAME), 'limpar equipe');

  console.log('→ Equipe e perfis');
  const [team] = await must(db.from('teams').insert({ name: TEAM_NAME }).select(), 'equipe');
  await must(
    db.from('profiles').upsert(
      USERS.map((u) => ({
        id: uid[u.key],
        team_id: team.id,
        full_name: u.full_name,
        role: u.role,
        avatar_color: u.avatar_color,
      })),
    ),
    'perfis',
  );

  console.log('→ Aplicações e roteiros');
  const appDefs = [
    {
      key: 'portal',
      name: 'Portal de Pagamentos',
      short_name: 'PAG-WEB',
      criticality: 'alta',
      health_url: 'https://httpbin.org/status/200',
      steps: [
        'Health check HTTP',
        'Login com usuário de teste',
        'Consultar extrato',
        'Simular pagamento de boleto',
      ],
    },
    {
      key: 'api',
      name: 'API de Pagamentos',
      short_name: 'PAG-API',
      criticality: 'alta',
      health_url: 'https://httpbin.org/status/503',
      steps: [
        'Health check HTTP',
        'Endpoint /payments responde',
        'Autorização de transação de teste',
        'Conferir logs sem erro 5xx',
        'Fila de liquidação consumindo',
      ],
    },
    {
      key: 'ib',
      name: 'Internet Banking',
      short_name: 'IB',
      criticality: 'alta',
      health_url: 'https://httpbin.org/status/200',
      steps: [
        'Health check HTTP',
        'Login com token de teste',
        'Consultar saldo',
        'Transferência simulada',
      ],
    },
    {
      key: 'auth',
      name: 'Serviço de Autenticação',
      short_name: 'AUTH',
      criticality: 'alta',
      health_url: 'https://httpbin.org/delay/2',
      steps: ['Health check HTTP', 'Emissão de token', 'Validação do certificado'],
    },
    {
      key: 'bus',
      name: 'Barramento de Integração',
      short_name: 'ESB',
      criticality: 'media',
      health_url: 'https://httpbin.org/status/200',
      steps: [
        'Health check HTTP',
        'Filas sem mensagens presas',
        'Integração com core bancário',
        'Reprocessamento de teste',
      ],
    },
  ];

  const apps = {};
  for (const a of appDefs) {
    const [row] = await must(
      db
        .from('applications')
        .insert({
          team_id: team.id,
          name: a.name,
          short_name: a.short_name,
          description: `Sistema fictício para demonstração (${a.short_name}).`,
          criticality: a.criticality,
          health_url: a.health_url,
        })
        .select(),
      `aplicação ${a.name}`,
    );
    apps[a.key] = row.id;
    await must(
      db.from('validation_steps').insert(
        a.steps.map((title, i) => ({
          application_id: row.id,
          position: i + 1,
          title,
          kind: i === 0 ? 'http_check' : 'manual',
        })),
      ),
      `roteiro ${a.name}`,
    );
  }

  // -------------------------------------------------------------------------
  // Shifts: last weekend (received) + Ana's current night shift
  // -------------------------------------------------------------------------
  console.log('→ Turnos');
  const shiftRows = await must(
    db
      .from('shifts')
      .insert([
        {
          team_id: team.id,
          user_id: uid.joao,
          kind: 'fim_de_semana',
          started_at: iso(sp(lastSat, 7)),
          ended_at: iso(sp(lastSat, 19)),
          status: 'recebido',
          notes:
            'Kernel do barramento aplicado. Fila ficou com mensagens presas, reprocessamento pendente.',
          next_steps: 'Acompanhar fila do ESB no próximo turno.',
          handover_snapshot: { seeded: true },
          received_by: uid.ana,
          received_at: iso(sp(lastSat, 19, 10)),
        },
        {
          team_id: team.id,
          user_id: uid.ana,
          kind: 'fim_de_semana',
          started_at: iso(sp(lastSat, 19)),
          ended_at: iso(sp(lastSun, 7)),
          status: 'recebido',
          notes: 'Reinício programado do Internet Banking executado às 6h e validado.',
          next_steps: 'Monitorar latência do IB na abertura de segunda.',
          handover_snapshot: { seeded: true },
          received_by: uid.joao,
          received_at: iso(sp(lastSun, 7, 15)),
        },
        {
          team_id: team.id,
          user_id: uid.joao,
          kind: 'fim_de_semana',
          started_at: iso(sp(lastSun, 7)),
          ended_at: iso(sp(lastSun, 19)),
          status: 'recebido',
          notes: 'Domingo tranquilo, sem GMUDs.',
          next_steps: 'Equipe da semana: reprocessar fila do barramento.',
          handover_snapshot: { seeded: true },
          received_by: uid.ana,
          received_at: iso(sp(lastSun, 19, 5)),
        },
        {
          team_id: team.id,
          user_id: uid.ana,
          kind: 'noturno',
          started_at: iso(ago(4 * HOUR)),
          status: 'aberto',
        },
      ])
      .select(),
    'turnos',
  );
  const [satDay, satNight] = shiftRows;

  // -------------------------------------------------------------------------
  // Changes (GMUDs)
  // -------------------------------------------------------------------------
  console.log('→ GMUDs principais');
  const changeDefs = [
    {
      key: 'java',
      change_number: 'CHG0012345',
      title: 'Atualização de Java no cluster de pagamentos',
      description: 'Upgrade do JDK nos nós do cluster de pagamentos.',
      window_start: ago(2 * HOUR),
      window_end: new Date(now.getTime() + 2 * HOUR),
      executor_team: 'Fornecedor Demo — Middleware',
      executor_contact: 'Plantão Middleware · (61) 0000-0000',
      status: 'em_validacao',
      apps: ['portal', 'api'],
    },
    {
      key: 'ohs',
      change_number: 'CHG0012346',
      title: 'Aplicação de patch no OHS',
      description: 'Patch de segurança do Oracle HTTP Server do Internet Banking.',
      window_start: ago(5 * HOUR),
      window_end: ago(3 * HOUR),
      executor_team: 'Equipe Web Demo',
      executor_contact: 'Teams · canal #web-demo',
      status: 'validada',
      apps: ['ib'],
    },
    {
      key: 'cert',
      change_number: 'CHG0012347',
      title: 'Renovação de certificado do serviço de autenticação',
      description: 'Troca do certificado TLS antes do vencimento.',
      window_start: new Date(now.getTime() + 3 * HOUR),
      window_end: new Date(now.getTime() + 4 * HOUR),
      executor_team: 'Equipe Segurança Demo',
      executor_contact: 'Teams · canal #seg-demo',
      status: 'agendada',
      apps: ['auth'],
    },
    {
      key: 'kernel',
      change_number: 'CHG0012348',
      title: 'Atualização de kernel no Barramento de Integração',
      description: 'Patch de kernel nos servidores do ESB (janela diurna de fim de semana).',
      window_start: sp(lastSat, 10),
      window_end: sp(lastSat, 12),
      executor_team: 'Equipe Linux Demo',
      executor_contact: 'Plantão Linux · (61) 0000-0001',
      status: 'validada_com_ressalvas',
      conclusion_note: 'Serviço no ar, mas fila com mensagens presas após o reboot.',
      apps: ['bus'],
    },
    {
      key: 'restart',
      change_number: 'CHG0012349',
      title: 'Reinício programado do Internet Banking',
      description: 'Reinício preventivo dos nós do IB.',
      window_start: sp(lastSun, 6),
      window_end: sp(lastSun, 7),
      executor_team: 'Equipe Web Demo',
      executor_contact: 'Teams · canal #web-demo',
      status: 'validada',
      apps: ['ib'],
    },
  ];

  const changes = {};
  for (const c of changeDefs) {
    const [row] = await must(
      db
        .from('changes')
        .insert({
          team_id: team.id,
          change_number: c.change_number,
          title: c.title,
          description: c.description,
          window_start: iso(c.window_start),
          window_end: iso(c.window_end),
          executor_team: c.executor_team,
          executor_contact: c.executor_contact,
          status: c.status,
          conclusion_note: c.conclusion_note ?? null,
          created_by: uid.ana,
        })
        .select(),
      `GMUD ${c.change_number}`,
    );
    changes[c.key] = { ...c, id: row.id };
    // The trigger creates the checklist (validations) for each linked app.
    await must(
      db
        .from('change_applications')
        .insert(c.apps.map((k) => ({ change_id: row.id, application_id: apps[k] }))),
      `vincular apps ${c.change_number}`,
    );
  }

  // Fill checklist results according to each change's story.
  async function setResults(changeKey, appKey, resultFor, performer, at) {
    const rows = await must(
      db
        .from('validations')
        .select('id, position')
        .eq('change_id', changes[changeKey].id)
        .eq('application_id', apps[appKey])
        .order('position'),
      'ler checklist',
    );
    for (const r of rows) {
      const { result, note } = resultFor(r.position);
      if (result === 'pendente') continue;
      await must(
        db
          .from('validations')
          .update({ result, note: note ?? null, performed_by: performer, performed_at: iso(at) })
          .eq('id', r.id),
        'gravar validação',
      );
    }
    return rows;
  }

  const t30 = ago(30 * MIN);
  await setResults('java', 'portal', () => ({ result: 'aprovado' }), uid.ana, ago(45 * MIN));
  const apiRows = await setResults(
    'java',
    'api',
    (p) =>
      p === 1
        ? { result: 'reprovado', note: 'Health check retornou HTTP 503 após o restart.' }
        : { result: 'pendente' },
    uid.ana,
    t30,
  );
  await setResults('ohs', 'ib', () => ({ result: 'aprovado' }), uid.ana, ago(3 * HOUR));
  await setResults(
    'kernel',
    'bus',
    (p) =>
      p === 2
        ? { result: 'reprovado', note: '1.240 mensagens presas na fila de liquidação.' }
        : { result: 'aprovado' },
    uid.joao,
    sp(lastSat, 11, 30),
  );
  await setResults('restart', 'ib', () => ({ result: 'aprovado' }), uid.ana, sp(lastSun, 6, 40));

  // Status history (the trigger only logs "created" for rows inserted already finalized).
  console.log('→ Histórico de status');
  const ev = (key, from, to, at, by, note = null) => ({
    change_id: changes[key].id,
    from_status: from,
    to_status: to,
    changed_at: iso(at),
    changed_by: by,
    note,
  });
  await must(
    db.from('change_events').insert([
      ev('java', 'agendada', 'aguardando_liberacao', ago(2 * HOUR), uid.ana),
      ev('java', 'aguardando_liberacao', 'em_validacao', ago(2 * HOUR - 15 * MIN), uid.ana),
      ev('ohs', 'agendada', 'aguardando_liberacao', ago(5 * HOUR), uid.ana),
      ev('ohs', 'aguardando_liberacao', 'em_validacao', ago(4 * HOUR), uid.ana),
      ev('ohs', 'em_validacao', 'validada', ago(3 * HOUR), uid.ana),
      ev('kernel', 'agendada', 'aguardando_liberacao', sp(lastSat, 10), uid.joao),
      ev('kernel', 'aguardando_liberacao', 'em_validacao', sp(lastSat, 11, 10), uid.joao),
      ev('kernel', 'em_validacao', 'validada_com_ressalvas', sp(lastSat, 12, 5), uid.joao, changes.kernel.conclusion_note),
      ev('restart', 'agendada', 'aguardando_liberacao', sp(lastSun, 6), uid.ana),
      ev('restart', 'aguardando_liberacao', 'em_validacao', sp(lastSun, 6, 25), uid.ana),
      ev('restart', 'em_validacao', 'validada', sp(lastSun, 6, 45), uid.ana),
    ]),
    'histórico de status',
  );

  console.log('→ Health checks');
  await must(
    db.from('health_checks').insert([
      {
        application_id: apps.portal,
        change_id: changes.java.id,
        phase: 'baseline',
        http_status: 200,
        latency_ms: 118,
        ok: true,
        checked_by: uid.ana,
        checked_at: iso(ago(2 * HOUR + 10 * MIN)),
      },
      {
        application_id: apps.api,
        change_id: changes.java.id,
        phase: 'baseline',
        http_status: 200,
        latency_ms: 120,
        ok: true,
        checked_by: uid.ana,
        checked_at: iso(ago(2 * HOUR + 9 * MIN)),
      },
      {
        application_id: apps.portal,
        change_id: changes.java.id,
        phase: 'pos',
        http_status: 200,
        latency_ms: 131,
        ok: true,
        checked_by: uid.ana,
        checked_at: iso(ago(46 * MIN)),
      },
      {
        application_id: apps.api,
        change_id: changes.java.id,
        phase: 'pos',
        http_status: 503,
        latency_ms: 87,
        ok: false,
        error_message: 'Service Unavailable',
        checked_by: uid.ana,
        checked_at: iso(t30),
      },
      {
        application_id: apps.ib,
        change_id: changes.ohs.id,
        phase: 'baseline',
        http_status: 200,
        latency_ms: 142,
        ok: true,
        checked_by: uid.ana,
        checked_at: iso(ago(5 * HOUR + 5 * MIN)),
      },
      {
        application_id: apps.ib,
        change_id: changes.ohs.id,
        phase: 'pos',
        http_status: 200,
        latency_ms: 139,
        ok: true,
        checked_by: uid.ana,
        checked_at: iso(ago(3 * HOUR + 5 * MIN)),
      },
    ]),
    'health checks',
  );

  console.log('→ Ocorrências');
  const apiFailed = apiRows.find((r) => r.position === 1);
  const [inc] = await must(
    db
      .from('incidents')
      .insert({
        team_id: team.id,
        change_id: changes.java.id,
        application_id: apps.api,
        validation_id: apiFailed?.id ?? null,
        title: 'API de Pagamentos indisponível após atualização de Java',
        severity: 'sev2',
        status: 'em_acompanhamento',
        external_ticket: 'INC0012345',
        opened_by: uid.ana,
        opened_at: iso(ago(28 * MIN)),
      })
      .select(),
    'ocorrência principal',
  );
  await must(
    db.from('incident_events').insert([
      {
        incident_id: inc.id,
        kind: 'nota',
        description: 'Ocorrência aberta a partir do passo reprovado "Health check HTTP".',
        created_by: uid.ana,
        created_at: iso(ago(28 * MIN)),
      },
      {
        incident_id: inc.id,
        kind: 'acionamento',
        description: 'Executor acionado para análise do HTTP 503.',
        channel: 'Telefone',
        contact: 'Plantão Middleware (fornecedor demo)',
        created_by: uid.ana,
        created_at: iso(ago(25 * MIN)),
      },
    ]),
    'eventos da ocorrência',
  );

  // Resolved incident from the weekend (feeds MTTR).
  const [incWeekend] = await must(
    db
      .from('incidents')
      .insert({
        team_id: team.id,
        change_id: changes.kernel.id,
        application_id: apps.bus,
        title: 'Mensagens presas na fila de liquidação do ESB',
        severity: 'sev3',
        status: 'resolvida',
        external_ticket: 'INC0012340',
        opened_by: uid.joao,
        opened_at: iso(sp(lastSat, 11, 35)),
        resolved_at: iso(sp(lastSat, 13, 5)),
      })
      .select(),
    'ocorrência do fim de semana',
  );
  await must(
    db.from('incident_events').insert([
      {
        incident_id: incWeekend.id,
        kind: 'acionamento',
        description: 'Equipe Linux acionada.',
        channel: 'Teams',
        contact: 'Plantão Linux (demo)',
        responded_at: iso(sp(lastSat, 11, 50)),
        created_by: uid.joao,
        created_at: iso(sp(lastSat, 11, 40)),
      },
      {
        incident_id: incWeekend.id,
        kind: 'resolucao',
        description:
          'Consumidores reiniciados; fila voltou a andar. Reprocessamento fica para a equipe da semana.',
        created_by: uid.joao,
        created_at: iso(sp(lastSat, 13, 5)),
      },
    ]),
    'eventos do fim de semana',
  );

  console.log('→ Pendências');
  await must(
    db.from('follow_ups').insert([
      {
        team_id: team.id,
        title: 'Reprocessar fila do barramento após kernel',
        description: '1.240 mensagens ficaram presas na fila de liquidação após o patch de kernel.',
        source_type: 'change',
        source_id: changes.kernel.id,
        application_id: apps.bus,
        created_in_shift_id: satDay.id,
        created_by: uid.joao,
        created_at: iso(sp(lastSat, 12, 10)),
      },
      {
        team_id: team.id,
        title: 'Acompanhar latência do Internet Banking pós-reinício',
        description:
          'Latência subiu ~15% após o reinício de domingo. Comparar com a baseline na segunda.',
        source_type: 'change',
        source_id: changes.restart.id,
        application_id: apps.ib,
        created_in_shift_id: satNight.id,
        created_by: uid.ana,
        created_at: iso(sp(lastSun, 6, 50)),
      },
      {
        team_id: team.id,
        title: 'Revisar alertas do Zabbix do ESB',
        description: 'Os alertas de fila não dispararam durante a janela.',
        source_type: 'incident',
        source_id: incWeekend.id,
        application_id: apps.bus,
        created_in_shift_id: satDay.id,
        status: 'em_andamento',
        assigned_to: uid.marina,
        assigned_at: iso(sp(lastSun + 1, 9, 20)),
        created_by: uid.joao,
        created_at: iso(sp(lastSat, 13, 10)),
      },
      {
        team_id: team.id,
        title: 'Confirmar rotação de logs do Portal',
        description: 'Disco de logs chegou a 85% durante a janela anterior.',
        source_type: 'manual',
        application_id: apps.portal,
        status: 'concluida',
        assigned_to: uid.marina,
        assigned_at: iso(sp(lastFri, 10)),
        resolution_note: 'Rotação ajustada para diária e retenção de 7 dias.',
        resolved_by: uid.marina,
        resolved_at: iso(sp(lastFri, 15)),
        created_by: uid.ana,
        created_at: iso(sp(lastFri - 1, 3)),
      },
    ]),
    'pendências',
  );

  // -------------------------------------------------------------------------
  // 30-day history so metrics and the weekday × weekend filter make sense.
  // -------------------------------------------------------------------------
  console.log('→ Histórico de 30 dias');
  const history = [
    // [dayOffset, startHour, durationH, title, appKey, status, hasIncident]
    [-3, 23, 2, 'Patch de segurança no WebLogic do Portal', 'portal', 'validada', false],
    [-4, 0, 2, 'Rotação de chaves do serviço de autenticação', 'auth', 'validada', false],
    [-6, 22, 3, 'Atualização do agente de monitoramento', 'api', 'validada_com_ressalvas', false],
    [-10, 23, 2, 'Ajuste de pool de conexões da API', 'api', 'reprovada', true],
    [-11, 1, 2, 'Patch do sistema operacional no IB', 'ib', 'validada', false],
    [-13, 10, 3, 'Migração de storage do barramento', 'bus', 'validada', false],
    [-14, 9, 2, 'Atualização de bibliotecas do Portal', 'portal', 'validada', true],
    [-17, 23, 2, 'Troca de balanceador do IB', 'ib', 'validada', false],
    [-18, 22, 2, 'Patch de OHS no Portal', 'portal', 'validada', false],
    [-20, 14, 2, 'Expansão de memória do ESB', 'bus', 'validada', false],
    [-21, 8, 3, 'Atualização de firmware dos servidores da API', 'api', 'reprovada', true],
    [-24, 23, 1, 'Reinício programado da autenticação', 'auth', 'validada', false],
    [-26, 0, 2, 'Aplicação de patch Java no IB', 'ib', 'validada_com_ressalvas', false],
    [-28, 11, 2, 'Limpeza de filas antigas do barramento', 'bus', 'validada', false],
  ];
  let seq = 12300;
  for (const [day, hour, dur, title, appKey, status, hasIncident] of history) {
    seq += 1;
    const start = sp(day, hour);
    const end = new Date(start.getTime() + dur * HOUR);
    const [row] = await must(
      db
        .from('changes')
        .insert({
          team_id: team.id,
          change_number: `CHG00${seq}`,
          title,
          description: 'GMUD histórica de demonstração.',
          window_start: iso(start),
          window_end: iso(end),
          executor_team: 'Fornecedor Demo',
          executor_contact: 'Plantão do fornecedor (demo)',
          status,
          conclusion_note: status === 'validada' ? null : 'Registrado na demonstração.',
          created_by: uid.ana,
        })
        .select(),
      `GMUD histórica ${title}`,
    );
    await must(
      db.from('change_applications').insert({ change_id: row.id, application_id: apps[appKey] }),
      'vincular app histórica',
    );
    await must(
      db
        .from('validations')
        .update({
          result: status === 'reprovada' ? 'reprovado' : 'aprovado',
          performed_by: uid.ana,
          performed_at: iso(end),
        })
        .eq('change_id', row.id),
      'resultado histórico',
    );
    if (hasIncident) {
      const opened = new Date(end.getTime() - 20 * MIN);
      const resolved = new Date(opened.getTime() + (45 + (seq % 4) * 30) * MIN);
      await must(
        db.from('incidents').insert({
          team_id: team.id,
          change_id: row.id,
          application_id: apps[appKey],
          title: `Falha após: ${title}`,
          severity: seq % 2 === 0 ? 'sev2' : 'sev3',
          status: 'resolvida',
          external_ticket: `INC00${seq - 100}`,
          opened_by: uid.ana,
          opened_at: iso(opened),
          resolved_at: iso(resolved),
        }),
        'ocorrência histórica',
      );
    }
  }

  console.log('\n✓ Seed concluído.');
  console.log(`  Equipe: ${TEAM_NAME}`);
  console.log(`  Usuários: ${USERS.map((u) => u.email).join(', ')}`);
  console.log(`  Senha de todos: ${DEMO_PASSWORD}`);
}

main().catch((err) => {
  console.error('✗ Erro inesperado:', err);
  process.exit(1);
});
