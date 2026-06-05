const state = {
  files: { languages: [], memoryLanguages: [], data: [] },
  current: null,
  json: null,
  path: [],
  inlineSelections: {},
  activeSearchPath: null,
  dirty: false,
};

const els = {
  languageList: document.getElementById("languageList"),
  memoryList: document.getElementById("memoryList"),
  dataList: document.getElementById("dataList"),
  memoryCount: document.getElementById("memoryCount"),
  dataCount: document.getElementById("dataCount"),
  refreshButton: document.getElementById("refreshButton"),
  languageForm: document.getElementById("languageForm"),
  languageInput: document.getElementById("languageInput"),
  fileTitle: document.getElementById("fileTitle"),
  filePath: document.getElementById("filePath"),
  breadcrumbs: document.getElementById("breadcrumbs"),
  nodeMeta: document.getElementById("nodeMeta"),
  fieldList: document.getElementById("fieldList"),
  addEventButton: document.getElementById("addEventButton"),
  addFieldButton: document.getElementById("addFieldButton"),
  searchInput: document.getElementById("searchInput"),
  searchAllFiles: document.getElementById("searchAllFiles"),
  searchResults: document.getElementById("searchResults"),
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

function pathLabel(path) {
  return path.reduce((label, part) => {
    const isIndex = typeof part === "number" || /^\d+$/.test(String(part));
    return isIndex ? `${label}[${part}]` : label ? `${label}.${part}` : String(part);
  }, "");
}

function pathsEqual(left, right) {
  if (!left || !right || left.length !== right.length) return false;
  return left.every((part, index) => String(part) === String(right[index]));
}

function markSearchHit(element, path) {
  if (!pathsEqual(path, state.activeSearchPath)) return;
  element.classList.add("search-hit");
  element.dataset.searchHit = "true";
}

function scrollToSearchHit() {
  const scroll = () => {
    const hit = document.querySelector("[data-search-hit='true']");
    if (!hit) return;
    hit.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = hit.querySelector("input, textarea, select, button");
    if (focusable) focusable.focus({ preventScroll: true });
  };
  requestAnimationFrame(scroll);
  setTimeout(scroll, 120);
}

function selectionKey(path) {
  const fileKey = state.current
    ? Object.entries(state.current).map(([key, value]) => `${key}:${value}`).join("|")
    : "no-file";
  return `${fileKey}::${path.map(String).join(".")}`;
}

function optionEntries(value) {
  if (Array.isArray(value)) return value.map((item, index) => [Number(index), item]);
  return Object.entries(value || {});
}

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyScalarChildren(value) {
  return isObject(value) && Object.values(value).every((child) => !child || typeof child !== "object");
}

function isCollectionObject(value) {
  return isObject(value)
    && Object.values(value).length > 1
    && Object.values(value).every((child) => child && typeof child === "object");
}

function isCollectionViewNode(path, value) {
  const key = path[path.length - 1];
  if (key === "mapLegends") return isObject(value);
  if (key === "pairs") return Array.isArray(value);
  if (Array.isArray(value)) {
    return value.length > 1 && value.every((child) => child && typeof child === "object");
  }
  return isCollectionObject(value);
}

function selectedOptionKey(path, value) {
  const entries = optionEntries(value);
  if (!entries.length) return null;

  const key = selectionKey(path);
  const saved = state.inlineSelections[key];
  const match = entries.find(([entryKey]) => String(entryKey) === String(saved));
  return match ? match[0] : entries[0][0];
}

function setSelectedOption(path, selected) {
  state.inlineSelections[selectionKey(path)] = String(selected);
}

function findCollectionJump(path) {
  for (let index = path.length - 2; index >= 0; index -= 1) {
    const parentPath = path.slice(0, index + 1);
    const parent = parentPath.reduce((value, key) => value?.[key], state.json);
    const selected = path[index + 1];
    if (parent && typeof parent === "object" && Object.prototype.hasOwnProperty.call(parent, selected)) {
      const selectedValue = parent[selected];
      if (selectedValue && typeof selectedValue === "object") {
        return {
          editorPath: parentPath.slice(0, -1),
          selectionPath: parentPath,
          selected,
        };
      }
    }
  }

  return { editorPath: path.slice(0, -1), selectionPath: null, selected: null };
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

function debounce(fn, wait) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

function itemCount(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function canCloneToLanguages() {
  return state.current?.type === "i18n" || state.current?.type === "memory";
}

function shouldOpenTranslations(target, json) {
  return (target?.type === "i18n" || target?.type === "memory") && json?.translations;
}

async function cloneToOtherLanguages(path, value, label = "field") {
  if (!canCloneToLanguages()) return;

  const result = await api("/api/clone-field", {
    method: "POST",
    body: JSON.stringify({
      ...state.current,
      path,
      value,
    }),
  });

  if (result.cloned.length) {
    toast(`Cloned ${label} to ${result.cloned.map((item) => item.lang).join(", ")}.`);
  } else {
    toast(`${label} already exists in the other languages.`);
  }
}

function eventNumbers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.keys(value)
    .map((key) => key.match(/^event(\d+)$/))
    .filter(Boolean)
    .map((match) => Number(match[1]))
    .sort((a, b) => a - b);
}

function canAddEvent(value) {
  return eventNumbers(value).length > 0;
}

function readableCollectionName(key) {
  const spaced = String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .toLowerCase();
  return spaced.endsWith("legends") ? "legend"
    : spaced === "pairs" ? "pair"
    : spaced.endsWith("technologies") ? "technology"
      : spaced.endsWith("ies") ? spaced.replace(/ies$/, "y")
        : spaced.endsWith("s") ? spaced.slice(0, -1)
          : "item";
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

  els.memoryCount.textContent = `${state.files.memoryLanguages.length} JSON`;
  els.memoryList.innerHTML = "";
  for (const language of state.files.memoryLanguages) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = state.current?.type === "memory" && state.current.lang === language.lang ? "active" : "";
    button.innerHTML = `<span>${language.lang}</span><span class="count">${language.count}</span>`;
    button.addEventListener("click", () => loadFile({ type: "memory", lang: language.lang }));
    els.memoryList.append(button);
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
    : state.current.type === "memory"
      ? `memory-game/lang-${state.current.lang}.json`
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

function createScalarControl(parent, key, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "field-value";

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

function createInlineScalar(parent, key, value) {
  const control = typeof value === "string" && value.length > 48
    ? document.createElement("textarea")
    : document.createElement("input");
  control.value = value === null ? "null" : String(value);
  control.addEventListener("input", () => {
    parent[key] = typeof value === "string" ? control.value : parseScalar(control.value);
    setDirty(true);
  });
  return control;
}

function addNestedValue(collection, path, mode) {
  if (Array.isArray(collection)) {
    collection.push(mode === "object" ? {} : "");
    setSelectedOption(path, collection.length - 1);
  } else {
    let index = 1;
    const base = mode === "object" ? "newGroup" : "newField";
    let key = base;
    while (Object.prototype.hasOwnProperty.call(collection, key)) {
      index += 1;
      key = `${base}${index}`;
    }
    collection[key] = mode === "object" ? {} : "";
    setSelectedOption(path, key);
  }
  setDirty(true);
  renderEditor();
}

function emptyClone(value) {
  if (Array.isArray(value)) return [];
  if (isObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, emptyClone(child)]));
  }
  return "";
}

function addCollectionItem(collection, path, selected) {
  const selectedValue = selected === null ? null : collection[selected];
  const nextValue = emptyClone(selectedValue);

  if (Array.isArray(collection)) {
    collection.push(nextValue);
    setSelectedOption(path, collection.length - 1);
  } else {
    const key = prompt("New item key");
    if (!key) return;
    const cleanKey = key.trim();
    if (!cleanKey) return;
    if (Object.prototype.hasOwnProperty.call(collection, cleanKey)) {
      toast(`'${cleanKey}' already exists.`, true);
      return;
    }
    collection[cleanKey] = nextValue;
    setSelectedOption(path, cleanKey);
  }

  setDirty(true);
  renderEditor();
}

function removeNestedValue(collection, path, selected) {
  if (selected === null) return;
  const label = readableCollectionName(path[path.length - 1]);
  if (!confirm(`Delete this ${label}?`)) return;

  if (Array.isArray(collection)) {
    collection.splice(Number(selected), 1);
    setSelectedOption(path, Math.max(0, Number(selected) - 1));
  } else {
    delete collection[selected];
    delete state.inlineSelections[selectionKey([...path, selected])];
  }
  setDirty(true);
  renderEditor();
}

function createSelectedValueEditor(collection, selected, childPath) {
  const selectedValue = collection[selected];
  const container = document.createElement("div");
  container.className = "nested-selected";
  markSearchHit(container, childPath);

  const header = document.createElement("div");
  header.className = "nested-selected-header";

  const title = document.createElement("strong");
  title.className = "nested-path";
  title.textContent = pathLabel(childPath);
  header.append(title);

  if (!selectedValue || typeof selectedValue !== "object") {
    const row = document.createElement("div");
    row.className = "nested-field-row";
    markSearchHit(row, childPath);

    const keyBlock = document.createElement("div");
    keyBlock.className = "field-key";
    keyBlock.innerHTML = `<strong>${selected}</strong><small>${pathLabel(childPath)}</small>`;

    const valueBlock = document.createElement("div");
    valueBlock.className = "field-value";
    valueBlock.append(createInlineScalar(collection, selected, selectedValue));

    row.append(keyBlock, valueBlock, createNestedFieldTools(collection, selected, childPath, selectedValue));
    container.append(header);
    container.append(row);
    return container;
  }

  if (isCollectionViewNode(childPath, selectedValue)) {
    header.append(document.createElement("span"));
    container.append(header);
    container.append(createNestedControl(collection, selected, selectedValue, childPath.slice(0, -1)));
    return container;
  }

  const addFieldButton = document.createElement("button");
  addFieldButton.type = "button";
  addFieldButton.textContent = "Add field";
  addFieldButton.addEventListener("click", () => {
    addObjectField(selectedValue);
    renderEditor();
  });
  header.append(addFieldButton);
  container.append(header);

  const entries = optionEntries(selectedValue);
  if (!entries.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state compact";
    empty.textContent = "No fields in this item yet.";
    container.append(empty);
    return container;
  }

  for (const [childKey, childValue] of entries) {
    const rowPath = [...childPath, childKey];
    const row = document.createElement("div");
    row.className = "nested-field-row";
    markSearchHit(row, rowPath);

    const keyBlock = document.createElement("div");
    keyBlock.className = "field-key";
    keyBlock.innerHTML = `<strong>${childKey}</strong><small>${pathLabel(rowPath)}</small>`;

    const valueBlock = document.createElement("div");
    valueBlock.className = "field-value";

    if (childValue && typeof childValue === "object") {
      row.classList.add("has-nested-object");
      valueBlock.append(createNestedControl(selectedValue, childKey, childValue, childPath));
    } else {
      valueBlock.append(createInlineScalar(selectedValue, childKey, childValue));
    }

    row.append(keyBlock, valueBlock, createNestedFieldTools(selectedValue, childKey, rowPath, childValue));
    container.append(row);
  }

  return container;
}

function createDirectObjectEditor(objectValue, childPath) {
  const container = document.createElement("div");
  container.className = "nested-selected direct-object";
  markSearchHit(container, childPath);

  const header = document.createElement("div");
  header.className = "nested-selected-header";

  const title = document.createElement("strong");
  title.className = "nested-path";
  title.textContent = pathLabel(childPath);
  header.append(title);

  const addFieldButton = document.createElement("button");
  addFieldButton.type = "button";
  addFieldButton.textContent = "Add field";
  addFieldButton.addEventListener("click", () => {
    addObjectField(objectValue);
    renderEditor();
  });
  header.append(addFieldButton);
  container.append(header);

  for (const [childKey, childValue] of Object.entries(objectValue)) {
    const rowPath = [...childPath, childKey];
    const row = document.createElement("div");
    row.className = "nested-field-row";
    markSearchHit(row, rowPath);

    const keyBlock = document.createElement("div");
    keyBlock.className = "field-key";
    keyBlock.innerHTML = `<strong>${childKey}</strong><small>${pathLabel(rowPath)}</small>`;

    const valueBlock = document.createElement("div");
    valueBlock.className = "field-value";
    valueBlock.append(createInlineScalar(objectValue, childKey, childValue));

    row.append(keyBlock, valueBlock, createNestedFieldTools(objectValue, childKey, rowPath, childValue));
    container.append(row);
  }

  return container;
}

function addObjectField(objectValue) {
  let index = 1;
  let key = "newField";
  while (Object.prototype.hasOwnProperty.call(objectValue, key)) {
    index += 1;
    key = `newField${index}`;
  }
  objectValue[key] = "";
  setDirty(true);
}

function createNestedFieldTools(parent, key, path, value) {
  const tools = document.createElement("div");
  tools.className = "field-tools nested-field-tools";

  const cloneButton = document.createElement("button");
  cloneButton.type = "button";
  cloneButton.title = "Clone field to missing language files";
  cloneButton.textContent = "Clone";
  cloneButton.hidden = !canCloneToLanguages();
  cloneButton.addEventListener("click", () => cloneToOtherLanguages(path, value, key));
  tools.append(cloneButton);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.title = "Delete field";
  deleteButton.textContent = "Del";
  deleteButton.addEventListener("click", () => {
    if (Array.isArray(parent)) parent.splice(Number(key), 1);
    else delete parent[key];
    setDirty(true);
    renderEditor();
  });
  tools.append(deleteButton);

  return tools;
}

function createNestedControl(parent, key, value, basePath = state.path) {
  const path = [...basePath, key];
  const wrapper = document.createElement("div");
  wrapper.className = "field-value nested-value";

  if (key === "translations") {
    wrapper.append(createSelectedValueEditor(parent, key, path));
    return wrapper;
  }

  if (hasOnlyScalarChildren(value)) {
    wrapper.append(createDirectObjectEditor(value, path));
    return wrapper;
  }

  const entries = optionEntries(value);
  const selected = selectedOptionKey(path, value);
  if (!entries.length || selected === null) return wrapper;

  const selectedIndex = entries.findIndex(([entryKey]) => String(entryKey) === String(selected));
  const card = document.createElement("div");
  card.className = "nested-card";

  const heading = document.createElement("div");
  heading.className = "nested-heading";

  const label = document.createElement("div");
  label.className = "nested-label";
  label.textContent = `${key} (${entries.length})`;

  const addItemButton = document.createElement("button");
  addItemButton.type = "button";
  addItemButton.textContent = `Add ${readableCollectionName(key)}`;
  addItemButton.addEventListener("click", () => addCollectionItem(value, path, selected));

  const cloneItemButton = document.createElement("button");
  cloneItemButton.type = "button";
  cloneItemButton.textContent = `Clone ${readableCollectionName(key)}`;
  cloneItemButton.hidden = !canCloneToLanguages();
  cloneItemButton.addEventListener("click", () => cloneToOtherLanguages([...path, selected], value[selected], readableCollectionName(key)));

  const deleteItemButton = document.createElement("button");
  deleteItemButton.type = "button";
  deleteItemButton.className = "danger";
  deleteItemButton.textContent = `Delete ${readableCollectionName(key)}`;
  deleteItemButton.addEventListener("click", () => removeNestedValue(value, path, selected));

  const headingActions = document.createElement("div");
  headingActions.className = "nested-heading-actions";
  headingActions.append(addItemButton, cloneItemButton, deleteItemButton);

  heading.append(label, headingActions);

  const nav = document.createElement("div");
  nav.className = "option-nav";

  const previousButton = document.createElement("button");
  previousButton.type = "button";
  previousButton.textContent = "Previous";
  previousButton.disabled = selectedIndex <= 0;
  previousButton.addEventListener("click", () => {
    setSelectedOption(path, entries[selectedIndex - 1][0]);
    renderEditor();
  });

  const select = document.createElement("select");
  select.ariaLabel = `Select ${key} item`;
  for (const [entryKey, entryValue] of entries) {
    const option = document.createElement("option");
    option.value = String(entryKey);
    option.textContent = `${Number.isInteger(entryKey) ? Number(entryKey) + 1 : entryKey}. ${summaryLabel(entryKey, entryValue)}`;
    option.selected = String(entryKey) === String(selected);
    select.append(option);
  }
  select.addEventListener("change", () => {
    setSelectedOption(path, select.value);
    renderEditor();
  });

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = "Next";
  nextButton.disabled = selectedIndex >= entries.length - 1;
  nextButton.addEventListener("click", () => {
    setSelectedOption(path, entries[selectedIndex + 1][0]);
    renderEditor();
  });

  const counter = document.createElement("strong");
  counter.className = "option-counter";
  counter.textContent = `${selectedIndex + 1} / ${entries.length}`;

  nav.append(previousButton, select, nextButton, counter);

  card.append(heading, nav, createSelectedValueEditor(value, selected, [...path, selected]));
  wrapper.append(card);
  return wrapper;
}

function summaryLabel(key, value) {
  if (typeof value === "string") return value.slice(0, 80);
  if (value && typeof value === "object") {
    if (value.insightTitle || (value.source && value.mirror)) {
      const source = legendName(value.source);
      const mirror = legendName(value.mirror);
      const pair = source && mirror ? `${source} / ${mirror}` : [value.source, value.mirror].filter(Boolean).join(" / ");
      return [value.insightTitle, pair].filter(Boolean).join(" - ");
    }
    return value.name || value.title || value.institution || `${typeOf(value)} - ${itemCount(value)} items`;
  }
  return String(value ?? key);
}

function legendName(key) {
  if (!key) return "";
  return state.json?.translations?.mapLegends?.[key]?.name || key;
}

function createValueControl(parent, key, value) {
  if (value && typeof value === "object") {
    return createNestedControl(parent, key, value);
  }

  return createScalarControl(parent, key, value);
}

function renderEditor() {
  renderBreadcrumbs();
  const node = getAtPath();
  const kind = typeOf(node);
  els.nodeMeta.textContent = `${kind} - ${itemCount(node)} items`;
  els.addFieldButton.disabled = !(node && typeof node === "object");
  els.addEventButton.hidden = !canAddEvent(node);
  els.fieldList.innerHTML = "";

  if (!node || typeof node !== "object") {
    els.fieldList.innerHTML = '<div class="empty-state">This value can be edited from the parent or raw JSON view.</div>';
    return;
  }

  if (state.path.length && isCollectionViewNode(state.path, node)) {
    const parentPath = state.path.slice(0, -1);
    const collectionKey = state.path[state.path.length - 1];
    const parent = getAtPath(parentPath);
    const row = document.createElement("div");
    row.className = "field-row collection-view";
    row.append(createNestedControl(parent, collectionKey, node, parentPath));
    els.fieldList.append(row);
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
    const rowPath = state.path.concat(key);
    const row = document.createElement("div");
    row.className = "field-row";
    markSearchHit(row, rowPath);

    const keyBlock = document.createElement("div");
    keyBlock.className = "field-key";

    if (Array.isArray(node)) {
      keyBlock.innerHTML = `<strong>${key}</strong><small>${pathLabel(rowPath)}</small>`;
    } else {
      const keyInput = document.createElement("input");
      keyInput.value = key;
      keyInput.ariaLabel = "Field key";
      keyInput.addEventListener("change", () => updateObjectKey(node, key, keyInput.value.trim()));
      keyBlock.append(keyInput);
      const small = document.createElement("small");
      small.textContent = pathLabel(rowPath);
      keyBlock.append(small);
    }

    const tools = document.createElement("div");
    tools.className = "field-tools";

    const cloneButton = document.createElement("button");
    cloneButton.type = "button";
    cloneButton.title = "Clone field to missing language files";
    cloneButton.textContent = "Clone";
    cloneButton.hidden = !canCloneToLanguages();
    cloneButton.addEventListener("click", () => cloneToOtherLanguages(rowPath, value, key));
    tools.append(cloneButton);

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
  const changedFile = JSON.stringify(state.current) !== JSON.stringify(target);
  state.current = target;
  state.json = result.json;
  state.path = shouldOpenTranslations(target, result.json) ? ["translations"] : [];
  if (changedFile) clearSearch();
  setDirty(false);
  renderSidebar();
  renderHeader(result);
  renderEditor();
}

async function jumpToResult(result) {
  const target = result.type === "i18n"
    ? { type: "i18n", lang: result.lang }
    : result.type === "memory"
      ? { type: "memory", lang: result.lang }
    : { type: "data", file: result.file };
  await loadFile(target);

  const jump = findCollectionJump(result.path || []);
  state.activeSearchPath = result.path || null;
  state.path = jump.editorPath;
  if (jump.selectionPath && jump.selected !== null) setSelectedOption(jump.selectionPath, jump.selected);
  renderEditor();
  scrollToSearchHit();
  els.searchResults.hidden = true;
  toast(`Found ${result.pathText}.`);
}

function renderSearchResults(results, query) {
  els.searchResults.innerHTML = "";
  if (!query.trim()) {
    els.searchResults.hidden = true;
    return;
  }

  els.searchResults.hidden = false;
  if (!results.length) {
    els.searchResults.innerHTML = '<div class="search-empty">No matches</div>';
    return;
  }

  for (const result of results) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    button.innerHTML = `
      <strong>${result.file}</strong>
      <span>${result.pathText}</span>
      <small>${result.value}</small>
    `;
    button.addEventListener("click", () => jumpToResult(result));
    els.searchResults.append(button);
  }
}

function clearSearch() {
  els.searchInput.value = "";
  els.searchResults.innerHTML = "";
  els.searchResults.hidden = true;
  state.activeSearchPath = null;
}

const runSearch = debounce(async () => {
  const query = els.searchInput.value.trim();
  if (query.length < 2) {
    renderSearchResults([], "");
    return;
  }

  try {
    const params = new URLSearchParams({ q: query });
    if (els.searchAllFiles.checked || !state.current) {
      params.set("all", "1");
    } else {
      Object.entries(state.current).forEach(([key, value]) => params.set(key, value));
    }
    const response = await api(`/api/search?${params}`);
    renderSearchResults(response.results, query);
  } catch (error) {
    toast(error.message, true);
  }
}, 180);

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

function addEvent() {
  const node = getAtPath();
  if (!canAddEvent(node)) return;

  const nextNumber = Math.max(...eventNumbers(node)) + 1;
  const key = `event${nextNumber}`;
  node[key] = {
    institution: "",
    title: "",
  };
  setDirty(true);
  toast(`Added ${key}.`);
  renderEditor();
}

els.refreshButton.addEventListener("click", () => refreshFiles().then(() => toast("File list refreshed.")));
els.searchInput.addEventListener("input", runSearch);
els.searchAllFiles.addEventListener("change", runSearch);
els.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    els.searchInput.value = "";
    els.searchResults.hidden = true;
  }
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".search")) els.searchResults.hidden = true;
});

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
    state.path = shouldOpenTranslations(state.current, state.json) ? ["translations"] : [];
    setDirty(true);
    renderEditor();
  } catch (error) {
    event.preventDefault();
    toast(error.message, true);
  }
});

els.validateButton.addEventListener("click", validateCurrent);
els.addFieldButton.addEventListener("click", addField);
els.addEventButton.addEventListener("click", addEvent);
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
    const firstMemoryLanguage = state.files.memoryLanguages[0]?.lang;
    if (firstMemoryLanguage) return loadFile({ type: "memory", lang: firstMemoryLanguage });
    const firstData = state.files.data[0]?.file;
    if (firstData) return loadFile({ type: "data", file: firstData });
    return undefined;
  })
  .catch((error) => toast(error.message, true));
