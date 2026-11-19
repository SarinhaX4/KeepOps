/**
 * Fictitious demo accounts created by `npm run seed`.
 * Shown on the login screen as shortcuts, clearly labeled as demo.
 */
export const DEMO_PASSWORD = 'KeepOps#Demo2026';

export const demoUsers = [
  { key: 'ana', name: 'Ana', role: 'plantonista', email: 'ana.souza@example.com' },
  { key: 'joao', name: 'João', role: 'plantonista', email: 'joao.lima@example.com' },
  { key: 'marina', name: 'Marina', role: 'equipe da semana', email: 'marina.costa@example.com' },
] as const;
