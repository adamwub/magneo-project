import { API_PREFIX } from "@magnoo/shared";

// Selalu dirender saat diminta (status API real-time), bukan di-cache saat build.
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL ?? "http://localhost:3000";

interface HealthResult {
  ok: boolean;
  detail: string;
}

async function checkApi(): Promise<HealthResult> {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: "no-store" });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const body = (await res.json()) as { status?: string; service?: string };
    return { ok: body.status === "ok", detail: body.service ?? "tidak dikenal" };
  } catch {
    return { ok: false, detail: "tidak dapat menjangkau server" };
  }
}

export default async function HomePage() {
  const health = await checkApi();

  return (
    <main className="card">
      <div className="brand">Magnoo</div>
      <p className="sub">Dashboard Web — kerangka Fase 0</p>

      {health.ok ? (
        <span className="status ok">
          <span className="dot" /> API terhubung
        </span>
      ) : (
        <span className="status down">
          <span className="dot" /> API tidak terhubung
        </span>
      )}

      <div className="meta">
        Target: {API_URL} (prefix {API_PREFIX}) · {health.detail}
      </div>
    </main>
  );
}
