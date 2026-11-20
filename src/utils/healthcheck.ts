/**
 * On-demand HTTP health check (spec section 8):
 * fetch with an 8 s AbortController timeout, latency via performance.now().
 * Failure = timeout, network error or status >= 400.
 *
 * Demo endpoints use httpbin.org. If it is unreachable (network/timeout),
 * the same path is retried on httpbingo.org — the "URL reserva".
 */
export type HealthCheckResult = {
  ok: boolean;
  httpStatus: number | null;
  latencyMs: number | null;
  errorMessage: string | null;
  /** True when the fallback host answered. */
  usedFallback: boolean;
};

type Deps = {
  fetchImpl?: typeof fetch;
  now?: () => number;
  timeoutMs?: number;
};

export const PRIMARY_DEMO_HOST = 'httpbin.org';
export const FALLBACK_DEMO_HOST = 'httpbingo.org';

async function probe(
  url: string,
  { fetchImpl = fetch, now = () => performance.now(), timeoutMs = 8000 }: Deps,
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = now();
  try {
    const res = await fetchImpl(url, {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });
    const latencyMs = Math.round(now() - started);
    return {
      kind: 'response' as const,
      httpStatus: res.status,
      latencyMs,
      ok: res.status < 400,
    };
  } catch (e) {
    const aborted = controller.signal.aborted;
    return {
      kind: 'error' as const,
      message: aborted
        ? `Timeout após ${Math.round(timeoutMs / 1000)} s`
        : e instanceof Error
          ? e.message
          : 'Erro de rede',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function runHealthCheck(url: string, deps: Deps = {}): Promise<HealthCheckResult> {
  const first = await probe(url, deps);
  if (first.kind === 'response') {
    return {
      ok: first.ok,
      httpStatus: first.httpStatus,
      latencyMs: first.latencyMs,
      errorMessage: null,
      usedFallback: false,
    };
  }

  if (url.includes(`//${PRIMARY_DEMO_HOST}`)) {
    const fallbackUrl = url.replace(`//${PRIMARY_DEMO_HOST}`, `//${FALLBACK_DEMO_HOST}`);
    const second = await probe(fallbackUrl, deps);
    if (second.kind === 'response') {
      return {
        ok: second.ok,
        httpStatus: second.httpStatus,
        latencyMs: second.latencyMs,
        errorMessage: `via ${FALLBACK_DEMO_HOST} (reserva)`,
        usedFallback: true,
      };
    }
  }

  return {
    ok: false,
    httpStatus: null,
    latencyMs: null,
    errorMessage: first.message,
    usedFallback: false,
  };
}
