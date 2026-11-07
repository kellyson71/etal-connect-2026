// Local, portable export. Does not touch the hosted build or publish anything.
import { build } from "vite";
import react from "@vitejs/plugin-react";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, ".html-export-work");
const mime = { ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const data = async (file) => `data:${mime[path.extname(file)]};base64,${(await readFile(file)).toString("base64")}`;
const assets = new Map();
for (const rel of ["/brand/nadic.png", "/demo-qr.svg", "/event-qr.svg"])
  assets.set(rel, await data(path.join(root, "public", rel)));
let fonts = "";
for (const font of JSON.parse(await readFile(path.join(root, "exportacao/fontes.json"), "utf8"))) {
  fonts += `@font-face{font-family:'${font.family}';font-style:normal;font-weight:400 800;font-display:swap;src:url(${await data(path.join(root, "exportacao/fontes", font.file))}) format('woff2');}\n`;
}
await mkdir(work, { recursive: true });
try {
  await writeFile(path.join(work, "entry.tsx"), `
import React from 'react';
import {createRoot} from 'react-dom/client';
import EtalApp from '../app/components/etal-app';
import '../app/globals.css';
// Hash navigation also supports double-click opening through file://.
globalThis.__etalExportNavigate = (state, title, url) => {
  const query = String(url || '').split('?')[1] || '';
  history.pushState(state, title, '#' + query);
};
createRoot(document.getElementById('root')!).render(<EtalApp/>);
`);
  const result = await build({
    configFile: false,
    root,
    publicDir: false,
    base: "./",
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    plugins: [{
      name: "etal-portable-assets",
      enforce: "pre",
      async load(id) {
        if (id === path.join(root, "app/globals.css")) {
          const css = await readFile(id, "utf8");
          return css
            .replace(/@import url\("https:\/\/fonts\.googleapis\.com[^\n]+\);/, "")
            .replace('@import "tailwindcss";', '@import "tailwindcss";\n' + fonts);
        }
      },
      transform(code, id) {
        if (!id.startsWith(path.join(root, "app")) || !id.endsWith(".tsx")) return;
        for (const [rel, uri] of assets) code = code.replaceAll(JSON.stringify(rel), JSON.stringify(uri));
        return code
          .replaceAll('href="/maps/bloco-principal.svg"', 'href="maps/bloco-principal.svg"')
          .replaceAll('new URLSearchParams(location.search)', 'new URLSearchParams(location.hash.slice(1))')
          .replaceAll('history.pushState(', 'globalThis.__etalExportNavigate(');
      },
    }, react()],
    build: {
      write: false,
      minify: true,
      cssCodeSplit: false,
      lib: { entry: path.join(work, "entry.tsx"), name: "EtalConnect", formats: ["iife"] },
      rollupOptions: { output: { inlineDynamicImports: true } },
    },
  });
  const outputs = (Array.isArray(result) ? result : [result]).flatMap(r => r.output);
  const js = outputs.filter(o => o.type === "chunk").map(o => o.code).join("\n");
  const css = outputs.filter(o => o.type === "asset" && o.fileName.endsWith(".css")).map(o => String(o.source)).join("\n");
  if (!js || !css) throw new Error("Incomplete HTML export");
  const favicon = await data(path.join(root, "public/favicon.svg"));
  await writeFile(path.join(root, "index.html"), `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="Protótipo independente e demonstrativo do ETAL Connect. Exportação local offline."><title>ETAL Connect — Protótipo local</title><link rel="icon" href="${favicon}"><style>${css.replaceAll("</style", "<\\/style")}</style></head><body><div id="root"></div><noscript>Ative o JavaScript para explorar este protótipo.</noscript><script>${js.replaceAll("</script", "<\\/script")}</script></body></html>\n`);
  await cp(path.join(root, "public/maps"), path.join(root, "maps"), { recursive: true });
  console.log("Exportação pronta: index.html (CSS, JavaScript, fontes e imagens incorporados).");
} finally {
  await rm(work, { recursive: true, force: true });
}
