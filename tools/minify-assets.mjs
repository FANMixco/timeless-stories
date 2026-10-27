import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import CleanCSS from "clean-css";
import { minify as minifyJs } from "terser";
import { getMemoryAssetVersion, compileMemoryImports, updateMemoryAssetReferences } from "./memory-game-assets.mjs";

const ROOTS = ["css", "js"];
const EXTENSIONS = new Set([".css", ".js", ".mjs", ".json"]);
const CHECK_MODE = process.argv.includes("--check");

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function isMinifiedAsset(filePath) {
  const extension = path.extname(filePath);
  return filePath.endsWith(`.min${extension}`);
}

function minifiedPath(sourcePath) {
  const extension = path.extname(sourcePath);
  return sourcePath.slice(0, -extension.length) + `.min${extension === ".mjs" ? ".js" : extension}`;
}

async function collectSourceFiles(directory) {
  if (!(await pathExists(directory))) return [];

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(entryPath);
      if (!entry.isFile()) return [];
      if (entry.name === "package.json") return [];

      const extension = path.extname(entry.name);
      if (!EXTENSIONS.has(extension) || isMinifiedAsset(entry.name)) return [];
      return [entryPath];
    }),
  );

  return files.flat();
}

function minifyCss(source, filePath) {
  const result = new CleanCSS({
    level: 2,
    returnPromise: false,
  }).minify(source);

  if (result.errors.length) {
    throw new Error(`CSS minification failed for ${filePath}: ${result.errors.join("; ")}`);
  }

  return result.styles;
}

async function minifyFile(sourcePath, memoryVersion) {
  const extension = path.extname(sourcePath);
  let source = await fs.readFile(sourcePath, "utf8");
  if (extension === ".mjs" || path.relative(process.cwd(), sourcePath).replaceAll("\\", "/") === "js/memory-game.js") {
    source = compileMemoryImports(source, memoryVersion);
  }

  if (extension === ".css") return minifyCss(source, sourcePath);

  if (extension === ".js" || extension === ".mjs") {
    const result = await minifyJs(source, {
      compress: true,
      ecma: 2017,
      format: { comments: false },
      mangle: true,
    });

    if (!result.code) throw new Error(`JS minification produced no output for ${sourcePath}`);
    return result.code;
  }

  if (extension === ".json") {
    return JSON.stringify(JSON.parse(source));
  }

  throw new Error(`Unsupported asset type: ${sourcePath}`);
}

function normalize(content) {
  return content.replace(/\r\n/g, "\n").trim();
}

async function processFile(sourcePath, memoryVersion) {
  const outputPath = minifiedPath(sourcePath);
  const minified = await minifyFile(sourcePath, memoryVersion);
  const relativeOutput = path.relative(process.cwd(), outputPath);

  if (CHECK_MODE) {
    const existing = await pathExists(outputPath) ? await fs.readFile(outputPath, "utf8") : "";
    if (normalize(existing) !== normalize(minified)) {
      return { status: "outdated", output: relativeOutput };
    }
    return { status: "current", output: relativeOutput };
  }

  await fs.writeFile(outputPath, `${minified}\n`);
  return { status: "written", output: relativeOutput };
}

async function main() {
  const memoryVersion = await getMemoryAssetVersion();
  const sourceFiles = (
    await Promise.all(ROOTS.map((root) => collectSourceFiles(path.join(process.cwd(), root))))
  ).flat();

  const results = [];
  // Modules and data must exist before the entrypoint can reference their new version.
  const entrypoint = path.join(process.cwd(), "js", "memory-game.js");
  const ordered = sourceFiles.sort().filter(file => file !== entrypoint);
  if (sourceFiles.includes(entrypoint)) ordered.push(entrypoint);
  for (const file of ordered) {
    results.push(await processFile(file, memoryVersion));
  }

  // Publish references only after all compiled assets exist. Check mode never writes.
  const references = await updateMemoryAssetReferences(memoryVersion, { check: CHECK_MODE });
  if (CHECK_MODE) results.push(...references.map(output => ({ status: "outdated", output })));

  const outdated = results.filter((result) => result.status === "outdated");
  if (outdated.length) {
    console.error("Minified assets are out of date:");
    for (const result of outdated) console.error(`- ${result.output}`);
    console.error("\nRun `npm run minify` to regenerate them.");
    process.exitCode = 1;
    return;
  }

  const changed = results.filter((result) => result.status === "written");
  const verb = CHECK_MODE ? "Checked" : "Minified";
  console.log(`${verb} ${results.length} asset files.`);
  if (!CHECK_MODE && changed.length) {
    for (const result of changed) console.log(`- ${result.output}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
