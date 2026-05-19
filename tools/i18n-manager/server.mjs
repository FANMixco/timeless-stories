import { createServer } from "node:http";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, join, normalize, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const rootDir = resolve(__dirname, "../..");
const managerDir = resolve(__dirname, "public");
const i18nDir = resolve(rootDir, "js/i18n");
const dataDir = resolve(rootDir, "js/data");
const port = Number(process.env.PORT || process.argv[2] || 4173);

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
]);

function send(response, status, body, headers = {}) {
  response.writeHead(status, headers);
  response.end(body);
}

function sendJson(response, status, body) {
  send(response, status, JSON.stringify(body), jsonHeaders);
}

function isInside(base, target) {
  const rel = relative(base, target);
  return rel === "" || (!rel.startsWith("..") && !resolve(rel).startsWith("\\\\"));
}

function ensureLanguage(code) {
  if (!/^[a-z]{2,8}(-[a-z0-9]{2,8})?$/i.test(code)) {
    throw new Error("Language code must look like en, es, fr, zh, or pt-br.");
  }
  return code.toLowerCase();
}

function ensureDataFile(name) {
  if (!/^[a-z0-9][a-z0-9._-]*\.json$/i.test(name) || name.endsWith(".min.json")) {
    throw new Error("Invalid data filename.");
  }
  return name;
}

function sourceFileFor(target) {
  if (target.type === "i18n") {
    const lang = ensureLanguage(target.lang);
    return resolve(i18nDir, `lang-${lang}.json`);
  }

  if (target.type === "data") {
    const file = ensureDataFile(target.file);
    return resolve(dataDir, file);
  }

  throw new Error("Unknown file type.");
}

function minFileFor(sourceFile) {
  return sourceFile.replace(/\.json$/i, ".min.json");
}

async function readBody(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 5_000_000) {
      throw new Error("Request body is too large.");
    }
  }
  return body ? JSON.parse(body) : {};
}

async function readJsonFile(file) {
  const content = await readFile(file, "utf8");
  return JSON.parse(content.replace(/^\uFEFF/, ""));
}

async function writeJsonPair(file, json, minify = false) {
  await writeFile(file, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  if (minify) {
    await writeFile(minFileFor(file), JSON.stringify(json), "utf8");
  }
}

async function minifyFile(file) {
  const json = await readJsonFile(file);
  const minFile = minFileFor(file);
  await writeFile(minFile, JSON.stringify(json), "utf8");
  return {
    source: relative(rootDir, file).replaceAll("\\", "/"),
    minified: relative(rootDir, minFile).replaceAll("\\", "/"),
  };
}

async function listJsonFiles(dir) {
  const entries = await readdir(dir);
  return entries
    .filter((entry) => entry.endsWith(".json") && !entry.endsWith(".min.json"))
    .sort((a, b) => a.localeCompare(b));
}

async function listFiles() {
  const i18nFiles = await listJsonFiles(i18nDir);
  const dataFiles = await listJsonFiles(dataDir);
  const languages = await Promise.all(
    i18nFiles.map(async (file) => {
      const lang = file.replace(/^lang-/, "").replace(/\.json$/, "");
      const json = await readJsonFile(resolve(i18nDir, file));
      const count = json && json.translations && typeof json.translations === "object"
        ? Object.keys(json.translations).length
        : Object.keys(json || {}).length;
      return { lang, file, count };
    }),
  );

  const data = await Promise.all(
    dataFiles.map(async (file) => {
      const json = await readJsonFile(resolve(dataDir, file));
      const count = json && typeof json === "object" ? Object.keys(json).length : 0;
      return { file, count };
    }),
  );

  return { languages, data };
}

function previewValue(value) {
  if (value && typeof value === "object") {
    return Array.isArray(value) ? `Array - ${value.length} items` : `Object - ${Object.keys(value).length} items`;
  }

  return String(value ?? "");
}

function searchJson(value, query, path = [], results = []) {
  const lowerQuery = query.toLowerCase();
  const pathText = path.join(".");
  const pathMatches = pathText.toLowerCase().includes(lowerQuery);
  const valueText = previewValue(value);
  const valueMatches = valueText.toLowerCase().includes(lowerQuery);

  if (path.length && (pathMatches || valueMatches)) {
    results.push({
      path,
      pathText,
      value: valueText.length > 160 ? `${valueText.slice(0, 157)}...` : valueText,
      match: pathMatches ? "key" : "value",
    });
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      searchJson(child, query, [...path, key], results);
    }
  }

  return results;
}

async function searchFile(query, target) {
  const file = sourceFileFor(target);
  const json = await readJsonFile(file);
  const descriptor = target.type === "i18n"
    ? { type: "i18n", lang: ensureLanguage(target.lang), file: `lang-${ensureLanguage(target.lang)}.json` }
    : { type: "data", file: ensureDataFile(target.file) };

  return searchJson(json, query).map((match) => ({
    ...match,
    ...descriptor,
    sourcePath: relative(rootDir, file).replaceAll("\\", "/"),
  }));
}

async function searchFiles(query, target = {}) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  if (!target.all && target.type) {
    return (await searchFile(trimmed, target)).slice(0, 80);
  }

  const matches = [];
  for (const language of (await listFiles()).languages) {
    const file = resolve(i18nDir, language.file);
    const json = await readJsonFile(file);
    matches.push(
      ...searchJson(json, trimmed).map((match) => ({
        ...match,
        type: "i18n",
        lang: language.lang,
        file: language.file,
        sourcePath: relative(rootDir, file).replaceAll("\\", "/"),
      })),
    );
  }

  for (const dataFile of (await listFiles()).data) {
    const file = resolve(dataDir, dataFile.file);
    const json = await readJsonFile(file);
    matches.push(
      ...searchJson(json, trimmed).map((match) => ({
        ...match,
        type: "data",
        file: dataFile.file,
        sourcePath: relative(rootDir, file).replaceAll("\\", "/"),
      })),
    );
  }

  return matches.slice(0, 80);
}

async function handleApi(request, response, url) {
  try {
    if (request.method === "GET" && url.pathname === "/api/files") {
      return sendJson(response, 200, await listFiles());
    }

    if (request.method === "GET" && url.pathname === "/api/search") {
      return sendJson(response, 200, {
        results: await searchFiles(url.searchParams.get("q") || "", {
          all: url.searchParams.get("all") === "1",
          type: url.searchParams.get("type"),
          lang: url.searchParams.get("lang"),
          file: url.searchParams.get("file"),
        }),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/file") {
      const type = url.searchParams.get("type");
      const lang = url.searchParams.get("lang");
      const file = url.searchParams.get("file");
      const sourceFile = sourceFileFor({ type, lang, file });
      const json = await readJsonFile(sourceFile);
      return sendJson(response, 200, {
        json,
        path: relative(rootDir, sourceFile).replaceAll("\\", "/"),
        minPath: relative(rootDir, minFileFor(sourceFile)).replaceAll("\\", "/"),
      });
    }

    if (request.method === "POST" && url.pathname === "/api/file") {
      const body = await readBody(request);
      const sourceFile = sourceFileFor(body);
      const json = typeof body.json === "string" ? JSON.parse(body.json) : body.json;
      await writeJsonPair(sourceFile, json, Boolean(body.minify));
      return sendJson(response, 200, { ok: true, minified: Boolean(body.minify) });
    }

    if (request.method === "POST" && url.pathname === "/api/minify") {
      const body = await readBody(request);
      const files = [];

      if (body.all) {
        for (const file of await listJsonFiles(i18nDir)) files.push(resolve(i18nDir, file));
        for (const file of await listJsonFiles(dataDir)) files.push(resolve(dataDir, file));
      } else {
        files.push(sourceFileFor(body));
      }

      const minified = [];
      for (const file of files) minified.push(await minifyFile(file));
      return sendJson(response, 200, { ok: true, minified });
    }

    if (request.method === "POST" && url.pathname === "/api/language") {
      const body = await readBody(request);
      const lang = ensureLanguage(body.lang || "");
      const target = resolve(i18nDir, `lang-${lang}.json`);
      if (!isInside(i18nDir, target)) throw new Error("Invalid language path.");

      try {
        await stat(target);
        return sendJson(response, 409, { error: `Language '${lang}' already exists.` });
      } catch {
        const templateLang = body.template ? ensureLanguage(body.template) : "en";
        const templateFile = resolve(i18nDir, `lang-${templateLang}.json`);
        const template = await readJsonFile(templateFile);
        await writeJsonPair(target, template, true);
        return sendJson(response, 201, { ok: true, lang });
      }
    }

    return sendJson(response, 404, { error: "API route not found." });
  } catch (error) {
    return sendJson(response, 400, { error: error.message });
  }
}

async function serveStatic(request, response, url) {
  const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const file = normalize(resolve(managerDir, `.${pathname}`));

  if (!isInside(managerDir, file)) {
    return send(response, 403, "Forbidden");
  }

  try {
    const content = await readFile(file);
    send(response, 200, content, {
      "content-type": mimeTypes.get(extname(file)) || "application/octet-stream",
    });
  } catch {
    send(response, 404, "Not found");
  }
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (url.pathname.startsWith("/api/")) {
    await handleApi(request, response, url);
    return;
  }

  await serveStatic(request, response, url);
}).listen(port, () => {
  console.log(`i18n Manager running at http://localhost:${port}`);
});
