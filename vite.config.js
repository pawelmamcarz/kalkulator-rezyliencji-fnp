import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appVersion = (() => {
  try {
    if (existsSync("./.version")) {
      const v = readFileSync("./.version", "utf-8").trim();
      if (v) return v;
    }
  } catch {
    /* fall through */
  }
  return JSON.parse(readFileSync("./package.json", "utf-8")).version;
})();

const commitHash = (() => {
  try {
    return execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    return "unknown";
  }
})();

const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        calculator: fileURLToPath(new URL("./index.html", import.meta.url)),
        embed: fileURLToPath(new URL("./embed/index.html", import.meta.url)),
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __BUILD_DATE__: JSON.stringify(buildDate),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.{test,spec}.{js,jsx}"],
  },
});
