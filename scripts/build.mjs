import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

async function buildBundle() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  await build({
    entryPoints: [path.join(rootDir, "app-entry.ts")],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["es2019"],
    sourcemap: true,
    outfile: path.join(distDir, "app.js"),
  });

  await copyStaticAssets();
  await writeBuiltHtml();
}

async function copyStaticAssets() {
  await cp(path.join(rootDir, "gameboy.css"), path.join(distDir, "gameboy.css"));
  await cp(path.join(rootDir, "assets"), path.join(distDir, "assets"), { recursive: true });
}

async function writeBuiltHtml() {
  const sourceHtml = await readFile(path.join(rootDir, "index.html"), "utf8");
  const builtHtml = sourceHtml.replace(
    '<script src="./dist/app.js"></script>',
    '<script src="./app.js"></script>'
  );

  await writeFile(path.join(distDir, "index.html"), builtHtml);
}

buildBundle().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
