import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { viteSingleFile } from "vite-plugin-singlefile";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), cssInjectedByJsPlugin(), viteSingleFile()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
