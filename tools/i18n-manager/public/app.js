const state = {
  files: { languages: [], data: [] },
  current: null,
  json: null,
  path: [],
  dirty: false,
};

const els = {
  languageList: document.getElementById("languageList"),
  dataList: document.getElementById("dataList"),
  dataCount: document.getElementById("dataCount"),
  refreshButton: document.getElementById("refreshButton"),
  languageForm: document.getElementById("languageForm"),
  languageInput: document.getElementById("languageInput"),
  fileTitle: document.getElementById("fileTitle"),
  filePath: document.getElementById("filePath"),
  breadcrumbs: document.getElementById("breadcrumbs"),
  nodeMeta: document.getElementById("nodeMeta"),
  fieldList: document.getElementById("fieldList"),
  addFieldButton: document.getElementById("addFieldButton"),
  rawButton: document.getElementById("rawButton"),
  validateButton: document.getElementById("validateButton"),
  minifyButton: document.getElementById("minifyButton"),
  minifyAllButton: document.getElementById("minifyAllButton"),
  saveButton: document.getElementById("saveButton"),
  rawDialog: document.getElementById("rawDialog"),
  rawEditor: document.getElementById("rawEditor"),
  formatRawButton: document.getElementById("formatRawButton"),
  applyRawButton: document.getElementById("applyRawButton"),
  toast: document.getElementById("toast"),
};

function api(path, options = {}) {
  return fetch(path, {
    headers: { "content-type": "application/json" },
    ...options,
  }).then(async (response) => {
    const body = await response.json();
    if (!response.ok) throw new Error(body.error || "Request failed.");
    return body;
  });
}

function typeOf(value) {
  if (Array.isArray(value)) return "Array";
  if (value === null) return "Null";
  return value && typeof value === "object" ? "Object" : typeof value;
}

function getAtPath(path = state.path) {
  return path.reduce((value, key) => value[key], state.json);
}

function setDirty(value) {
  state.dirty = value;
  els.saveButton.disabled = !state.current || !state.dirty;
}

function toast(message, isError = false) {
  els.toast.textContent = message;
  els.toast.classList.toggle("error", isError);
  els.toast.classList.add("visible");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.remove("visible"), 3200);
}

function itemCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function renderSidebar() {
  els.languageList.innerHTML = "";
  for (const language of state.files.languages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = state.current?.type === "i18n" && state.current.lang === language.lang ? "active" : "";
    button.innerHTML = `<span>${language.lang}</span><span class="count">${language.count}</span>`;
    button.addEventListener("click", () => loadFile({ type: "i18n", lang: language.lang }));
    els.languageList.append(button);
  }

  els.dataCount.textContent = `${state.files.data.length} JSON`;
  els.dataList.innerHTML = "";
  for (const file of state.files.data) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = state.current?.type === "data" && state.current.file === file.file ? "active" : "";
    button.innerHTML = `<span>${file.file}</span><span class="count">${file.count}</span>`;
    button.addEventListener("click", () => loadFile({ type: "data", file: file.file }));
    els.dataList.append(button);
  }
}

function renderHeader(fileInfo = {}) {
  if (!state.current) {
    els.fileTitle.textContent = "Select a file";
    els.filePath.textContent = "js/i18n or js/data";
    return;
  }

  els.fileTitle.textContent = state.current.type === "i18n"
    ? `lang-${state.current.lang}.json`
    : state.current.file;
  els.filePath.textContent = fileInfo.path || "";
}

function renderBreadcrumbs() {
  els.breadcrumbs.innerHTML = "";
  const rootButton = document.createElement("button");
  rootButton.type = "button";
  rootButton.textContent = "Root";
  rootButton.addEventListener("click", () => {
    state.path = [];
    renderEditor();
  });
  els.breadcrumbs.append(rootButton);

  state.path.forEach((part, index) => {
    const separator = document.createElement("span");
    separator.className = "crumb-separator";
    separator.textContent = "/";
    els.breadcrumbs.append(separator);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = part;
    button.addEventListener("click", () => {
      state.path = state.path.slice(0, index + 1);
      renderEditor();
    });
    els.breadcrumbs.append(button);
  });
}

function updateObjectKey(target, oldKey, newKey) {
  if (!newKey || oldKey === newKey) return;
  if (Object.prototype.hasOwnProperty.call(target, newKey)) {
    toast(`Field '${newKey}' already exists.`, true);
    return;
  }

  const next = {};
  for (const [key, value] of Object.entries(target)) {
    if (key === oldKey) next[newKey] = value;
    else next[key] = value;
  }

  Object.keys(target).forEach((key) => delete target[key]);
  Object.assign(target, next);
  setDirty(true);
  renderEditor();
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return value;
}

function createValueControl(parent, key, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "field-value";

  if (value && typeof value === "object") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `Open ${typeOf(value)} - ${itemCount(value)} items`;
    button.addEventListener("click", () => {
      state.path = [...state.path, key];
      renderEditor();
    });
    wrapper.append(button);
    return wrapper;
  }

  const control = typeof value === "string" && value.length > 48
    ? document.createElement("textarea")
    : document.createElement("input");
  control.value = value === null ? "null" : String(value);
  control.addEventListener("input", () => {
    parent[key] = typeof value === "string" ? control.value : parseScalar(control.value);
    setDirty(true);
  });
  wrapper.append(control);
  return wrapper;
}

function renderEditor() {
  renderBreadcrumbs();
  const node = getAtPath();
  const kind = typeOf(node);
  els.nodeMeta.textContent = `${kind} - ${itemCount(node)} items`;
  els.addFieldButton.disabled = !(node && typeof node === "object");
  els.fieldList.innerHTML = "";

  if (!node || typeof node !== "object") {
    els.fieldList.innerHTML = '<div class="empty-state">This value can be edited from the parent or raw JSON view.</div>';
    return;
  }

  const entries = Array.isArray(node)
    ? node.map((value, index) => [String(index), value])
    : Object.entries(node);

  if (!entries.length) {
    els.fieldList.innerHTML = '<div class="empty-state">No fields yet.</div>';
    return;
  }

  for (const [key, value] of entries) {
    const row = document.createElement("div");
    row.className = "field-row";

    const keyBlock = document.createElement("div");
    keyBlock.className = "field-key";

    if (Array.isArray(node)) {
      keyBlock.innerHTML = `<strong>${key}</strong><small>${state.path.concat(key).join(".")}</small>`;
    } else {
      const keyInput = document.createElement("input");
      keyInput.value = key;
      keyInput.ariaLabel = "Field key";
      keyInput.addEventListener("change", () => updateObjectKey(node, key, keyInput.value.trim()));
      keyBlock.append(keyInput);
      const small = document.createElement("small");
      small.textContent = state.path.concat(key).join(".");
      keyBlock.append(small);
    }

    const tools = document.createElement("div");
    tools.className = "field-tools";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.title = "Delete field";
    deleteButton.textContent = "Del";
    deleteButton.addEventListener("click", () => {
      if (Array.isArray(node)) node.splice(Number(key), 1);
      else delete node[key];
      setDirty(true);
      renderEditor();
    });
    tools.append(deleteButton);

    row.append(keyBlock, createValueControl(node, Array.isArray(node) ? Number(key) : key, value), tools);
    els.fieldList.append(row);
  }
}

async function refreshFiles() {
  state.files = await api("/api/files");
  renderSidebar();
}

async function loadFile(target) {
  if (state.dirty && !confirm("You have unsaved changes. Continue without saving?")) return;

  const params = new URLSearchParams(target);
  const result = await api(`/api/file?${params.toString()}`);
  state.current = target;
  state.json = result.json;
  state.path = target.type === "i18n" && result.json.translations ? ["translations"] : [];
  setDirty(false);
  renderSidebar();
  renderHeader(result);
  renderEditor();
}

function currentPayload(extra = {}) {
  return JSON.stringify({ ...state.current, json: state.json, ...extra });
}

async function saveCurrent({ minify = false } = {}) {
  if (!state.current) return;
  await api("/api/file", { method: "POST", body: currentPayload({ minify }) });
  setDirty(false);
  await refreshFiles();
  toast(minify ? "Saved and minified." : "Saved.");
}

function validateCurrent() {
  JSON.stringify(state.json);
  toast("JSON is valid.");
}

function addField() {
  const node = getAtPath();
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    node.push("");
  } else {
    let index = 1;
    let key = "newField";
    while (Object.prototype.hasOwnProperty.call(node, key)) {
      index += 1;
      key = `newField${index}`;
    }
    node[key] = "";
  }

  setDirty(true);
  renderEditor();
}

els.refreshButton.addEventListener("click", () => refreshFiles().then(() => toast("File list refreshed.")));

els.languageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const lang = els.languageInput.value.trim();
  if (!lang) return;
  const template = state.files.languages[0]?.lang || "en";
  await api("/api/language", {
    method: "POST",
    body: JSON.stringify({ lang, template }),
  });
  els.languageInput.value = "";
  await refreshFiles();
  await loadFile({ type: "i18n", lang: lang.toLowerCase() });
  toast(`Created lang-${lang.toLowerCase()}.json and minified copy.`);
});

els.rawButton.addEventListener("click", () => {
  if (!state.current) return;
  els.rawEditor.value = JSON.stringify(state.json, null, 2);
  els.rawDialog.showModal();
});

els.formatRawButton.addEventListener("click", () => {
  try {
    els.rawEditor.value = JSON.stringify(JSON.parse(els.rawEditor.value), null, 2);
    toast("Raw JSON formatted.");
  } catch (error) {
    toast(error.message, true);
  }
});

els.applyRawButton.addEventListener("click", (event) => {
  try {
    state.json = JSON.parse(els.rawEditor.value);
    state.path = state.current?.type === "i18n" && state.json.translations ? ["translations"] : [];
    setDirty(true);
    renderEditor();
  } catch (error) {
    event.preventDefault();
    toast(error.message, true);
  }
});

els.validateButton.addEventListener("click", validateCurrent);
els.addFieldButton.addEventListener("click", addField);
els.saveButton.addEventListener("click", () => saveCurrent());
els.minifyButton.addEventListener("click", async () => {
  if (!state.current) return;
  if (state.dirty) await saveCurrent({ minify: true });
  else {
    await api("/api/minify", { method: "POST", body: JSON.stringify(state.current) });
    toast("Current minified file generated.");
  }
});
els.minifyAllButton.addEventListener("click", async () => {
  if (state.dirty) await saveCurrent();
  const result = await api("/api/minify", { method: "POST", body: JSON.stringify({ all: true }) });
  toast(`Generated ${result.minified.length} minified files.`);
});

window.addEventListener("beforeunload", (event) => {
  if (!state.dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

refreshFiles()
  .then(() => {
    const firstLanguage = state.files.languages[0]?.lang;
    if (firstLanguage) return loadFile({ type: "i18n", lang: firstLanguage });
    const firstData = state.files.data[0]?.file;
    if (firstData) return loadFile({ type: "data", file: firstData });
    return undefined;
  })
  .catch((error) => toast(error.message, true));
