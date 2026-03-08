import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const srcDir = path.join(root, "src");

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: "./vitest.setup.ts",
    css: true,
    include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    exclude: ["**/*.e2e.*"],

    alias: {
      "@": srcDir,
      "@/components": path.join(srcDir, "components"),
      "@/lib": path.join(srcDir, "lib"),
      "@/theme": path.join(srcDir, "theme"),

      // ⭐ THIS FIXES YOUR ERROR
      "styled-system": path.join(root, "styled-system"),
    },
  },
});
