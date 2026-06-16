import { defineConfig, devices } from "@playwright/test";

/**
 * Konfigurasi Playwright untuk QA visual dashboard (Fase 1i).
 * Browser: Chrome-for-Testing manual di /opt/cft (CDN Playwright keblokir firewall —
 * lihat memory playwright-chrome-workaround). baseURL = web dev di :3001.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.WEB_URL ?? "http://localhost:3001",
    launchOptions: {
      executablePath: "/opt/cft/chrome-linux64/chrome",
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
