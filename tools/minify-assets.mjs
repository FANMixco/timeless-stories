import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import CleanCSS from "clean-css";
import { minify as minifyJs } from "terser";

const ROOTS = ["css", "js"];
const EXTENSIONS = new Set([".css", ".js", ".json"]);
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
  return sourcePath.slice(0, -extension.length) + `.min${extension}`;
}

async function collectSourceFiles(directory) {
  if (!(await pathExists(directory))) return [];

  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectSourceFiles(entryPath);
      if (!entry.isFile()) return [];

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

async function minifyFile(sourcePath) {
  const extension = path.extname(sourcePath);
  const source = await fs.readFile(sourcePath, "utf8");

  if (extension === ".css") return minifyCss(source, sourcePath);

  if (extension === ".js") {
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

async function processFile(sourcePath) {
  const outputPath = minifiedPath(sourcePath);
  const minified = await minifyFile(sourcePath);
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
  const sourceFiles = (
    await Promise.all(ROOTS.map((root) => collectSourceFiles(path.join(process.cwd(), root))))
  ).flat();

  const results = [];
  for (const file of sourceFiles.sort()) {
    results.push(await processFile(file));
  }

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
