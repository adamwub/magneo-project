import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

// Portal harus super ringan (<200KB). Tidak ada dependency berat.
export default defineConfig({
  plugins: [preact()],
  build: {
    target: "es2018",
    // Laporkan ukuran agar mudah dijaga di bawah ambang 200KB.
    reportCompressedSize: true,
  },
});
