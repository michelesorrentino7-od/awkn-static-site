import { cp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");
await rm(path.join(root, "_astro"), { recursive: true, force: true });
const entries = await readdir(dist);

for (const name of entries) {
  // Images already live at /images and are served beside the pages.
  if (name === "images") continue;
  await cp(path.join(dist, name), path.join(root, name), { recursive: true });
}

// Astro emits root-absolute asset URLs. Rewrite them so GitHub project pages
// and a private preview both resolve CSS and fonts next to the HTML.
async function relativize(file) {
  const text = await readFile(file, "utf8");
  const next = text
    .replaceAll('="/./_astro/', '="_astro/')
    .replaceAll('="/_astro/', '="_astro/')
    .replaceAll("url(/./_astro/", "url(_astro/")
    .replaceAll("url(/_astro/", "url(_astro/");
  if (next !== text) await writeFile(file, next);
}

const htmlFiles = (await readdir(root)).filter((name) => name.endsWith(".html"));
for (const name of htmlFiles) await relativize(path.join(root, name));

const astroDir = path.join(root, "_astro");
for (const name of await readdir(astroDir)) {
  if (name.endsWith(".css")) await relativize(path.join(astroDir, name));
}
