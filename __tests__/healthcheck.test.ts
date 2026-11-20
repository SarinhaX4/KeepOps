import { describe, expect, it } from '@jest/globals';

import { runHealthCheck } from '@/utils/healthcheck';

type FetchLike = typeof fetch;

function clock(step = 120) {
  let t = 0;
  return () => (t += step);
}

const respond = (status: number): FetchLike => (async () => ({ status }) as Response) as FetchLike;

describe('runHealthCheck', () => {
  it('records status and latency for a healthy endpoint', async () => {
    const r = await runHealthCheck('https://httpbin.org/status/200', {
      fetchImpl: respond(200),
      now: clock(),
    });
    expect(r).toEqual({
      ok: true,
      httpStatus: 200,
      latencyMs: 120,
      errorMessage: null,
      usedFallback: false,
    });
  });

  it('treats status >= 400 as failure', async () => {
    const r = await runHealthCheck('https://httpbin.org/status/503', {
      fetchImpl: respond(503),
      now: clock(),
    });
    expect(r.ok).toBe(false);
    expect(r.httpStatus).toBe(503);
  });

  it('falls back to httpbingo.org when httpbin.org is unreachable', async () => {
    const calls: string[] = [];
    const flaky: FetchLike = (async (url: string) => {
      calls.push(url);
      if (url.includes('//httpbin.org')) throw new Error('Network request failed');
      return { status: 200 } as Response;
    }) as FetchLike;
    const r = await runHealthCheck('https://httpbin.org/status/200', {
      fetchImpl: flaky,
      now: clock(),
    });
    expect(calls).toEqual(['https://httpbin.org/status/200', 'https://httpbingo.org/status/200']);
    expect(r).toMatchObject({ ok: true, usedFallback: true });
  });

  it('reports a timeout when the request hangs', async () => {
    const hang: FetchLike = ((_url: string, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new Error('Aborted')));
      })) as FetchLike;
    const r = await runHealthCheck('https://example.com/health', {
      fetchImpl: hang,
      now: clock(),
      timeoutMs: 20,
    });
    expect(r).toMatchObject({ ok: false, httpStatus: null, latencyMs: null });
    expect(r.errorMessage).toMatch(/Timeout/);
  });
});
