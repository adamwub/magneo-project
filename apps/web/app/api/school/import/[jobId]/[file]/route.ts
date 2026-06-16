import { apiFetch } from "@/lib/api";

const ALLOWED = new Set(["errors.csv", "credentials.csv"]);

/**
 * Proxy unduh laporan impor (BFF): teruskan ke backend dengan token cookie, lalu
 * alirkan kembali ke browser. Klien tak pernah memegang token. credentials.csv
 * bersifat sekali-unduh (ditegakkan backend).
 */
export async function GET(
  _req: Request,
  { params }: { params: { jobId: string; file: string } },
): Promise<Response> {
  if (!ALLOWED.has(params.file)) return new Response("Not found", { status: 404 });
  const res = await apiFetch(`/school/users/import/${params.jobId}/${params.file}`);
  if (!res.ok) return new Response("Tidak tersedia", { status: res.status });
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: {
      "content-type": res.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "content-disposition": res.headers.get("content-disposition") ?? `attachment; filename="${params.file}"`,
    },
  });
}
