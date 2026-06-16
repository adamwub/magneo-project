import { apiFetch } from "@/lib/api";

/** Proxy unduh PDF batch kode undangan (BFF, token via cookie). */
export async function GET(
  _req: Request,
  { params }: { params: { batchId: string } },
): Promise<Response> {
  const res = await apiFetch(`/school/invite-codes/batch/${params.batchId}`);
  if (!res.ok) return new Response("Tidak tersedia", { status: res.status });
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/pdf",
      "content-disposition": res.headers.get("content-disposition") ?? 'attachment; filename="undangan-ortu.pdf"',
    },
  });
}
