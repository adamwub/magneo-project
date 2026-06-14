import { useEffect, useState } from "preact/hooks";

// Alamat API (build-time). Default lokal; di Box di-set ke alamat lokal Box.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

type ApiState = "checking" | "online" | "offline";

export function App() {
  const [api, setApi] = useState<ApiState>("checking");

  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/health`)
      .then((r) => r.json())
      .then((b: { status?: string }) => alive && setApi(b.status === "ok" ? "online" : "offline"))
      .catch(() => alive && setApi("offline"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <main class="wrap">
      <div class="logo">Magnoo</div>
      <p class="tag">WiFi Sekolah</p>

      <form class="form" onSubmit={(e) => e.preventDefault()}>
        <input class="in" type="text" placeholder="Username / NIS" autoComplete="username" />
        <input class="in" type="password" placeholder="Kata sandi" autoComplete="current-password" />
        <button class="btn" type="submit">Masuk</button>
      </form>

      <p class="hours">Jam WiFi: 06:00–17:00</p>

      <div class={`status ${api}`}>
        {api === "checking" && "Memeriksa server…"}
        {api === "online" && "● Server terhubung"}
        {api === "offline" && "● Mode lokal / server tak terjangkau"}
      </div>
    </main>
  );
}
