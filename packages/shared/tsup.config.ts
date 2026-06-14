import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  // Generator script is a build-time tool, not part of the published library.
  external: ["zod-to-json-schema"],
});
