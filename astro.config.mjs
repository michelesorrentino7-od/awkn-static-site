import { cp } from "node:fs/promises";
import { defineConfig } from "astro/config";

// Relative URLs so the same build works on GitHub project pages and a private preview.
export default defineConfig({
  site: "https://michelesorrentino7-od.github.io/awkn-static-site/",
  base: "./",
  trailingSlash: "ignore",
  build: {
    format: "file",
  },
  integrations: [
    {
      name: "copy-images",
      hooks: {
        "astro:build:done": async ({ dir }) => {
          await cp(new URL("./images/", import.meta.url), new URL("images/", dir), {
            recursive: true,
            dereference: true,
          });
        },
      },
    },
  ],
});
