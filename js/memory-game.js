const supportedLanguages = ["en", "es", "fr", "zh"];
const languageStorageKey = "timelessStoriesOfficialLanguage";
const themeStorageKey = "timelessStoriesColorMode";
const introStorageKey = "timelessMemoryIntroSeen";
const collectionStorageKey = "timelessMemoryCollection";
const supportedThemes = ["system", "light", "dark"];
const previewRewardThresholdSeconds = 30;
const mismatchFlipBackDelayMs = 1200;
const i18nCacheVersion = "20261022-about-website-label";
let linkRegistry = null;
let localizedLinks = null;
const board = document.getElementById("board");
const movesValue = document.getElementById("movesValue");
const matchesValue = document.getElementById("matchesValue");
const timeValue = document.getElementById("timeValue");
const matchInsight = document.getElementById("matchInsight");
const matchInsightTitle = document.getElementById("matchInsightTitle");
const matchInsightText = document.getElementById("matchInsightText");
const legendToast = document.getElementById("legendToast");
const legendToastTitle = document.getElementById("legendToastTitle");
const legendToastText = document.getElementById("legendToastText");
const legendToastClose = document.getElementById("legendToastClose");
const winPanel = document.getElementById("winPanel");
const winTitle = document.getElementById("winTitle");
const winMessage = document.getElementById("winMessage");
const legendsPanel = document.getElementById("legendsPanel");
const legendsPanelTitle = document.getElementById("legendsPanelTitle");
const legendsList = document.getElementById("legendsList");
const legendsRarityNote = document.getElementById("legendsRarityNote");
const rarityPanel = document.getElementById("rarityPanel");
const rarityPanelTitle = document.getElementById("rarityPanelTitle");
const rarityPreviewList = document.getElementById("rarityPreviewList");
const gameFooter = document.getElementById("gameFooter");
const gameLayout = document.querySelector(".game-layout");
const aboutPanel = document.getElementById("aboutPanel");
const closeAboutButton = document.getElementById("closeAboutButton");
let aboutReturnFocus = null;
const newGameButton = document.getElementById("newGameButton");
const languageControl = document.getElementById("languageControl");
const languageButton = document.getElementById("languageButton");
const languageMenu = document.getElementById("languageMenu");
const themeButton = document.getElementById("themeButton");
const shareButton = document.getElementById("shareButton");
const hintButton = document.getElementById("hintButton");
const topViewLegendsButton = document.getElementById("topViewLegendsButton");
const collectionButton = document.getElementById("collectionButton");
const collectionPanel = document.getElementById("collectionPanel");
const closeCollectionButton = document.getElementById("closeCollectionButton");
let discoveries = readDiscoveries();
let collectionDetailTrigger = null;
let collectionRarityTrigger = null;
const playAgainButton = document.getElementById("playAgainButton");
const viewLegendsButton = document.getElementById("viewLegendsButton");
const winShareButton = document.getElementById("winShareButton");
const closeWinButton = document.getElementById("closeWinButton");
const closeLegendsButton = document.getElementById("closeLegendsButton");
const closeRarityButton = document.getElementById("closeRarityButton");
const previewRewardButton = document.getElementById("previewRewardButton");
const getCopyButton = document.getElementById("getCopyButton");
const legendsGetCopyButton = document.getElementById("legendsGetCopyButton");
const searchParams = new URLSearchParams(window.location.search);
const isEmbedded = searchParams.get("embed") === "1";
let memoryGame = { pairs: [] };

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let elapsedSeconds = 0;
let timer = null;
let toastTimer = null;
let gameCompleted = false;
let introRunning = false;
let hintPressCount = 0;
let tutorialRunId = 0;
let translations = null;
let deck = [];
let activePairs = [];
let currentLanguage = "en";
let modalDetailPair = null;
let modalRarity = null;
let restoringModalHistory = false;
let pendingModalNavigation = false;
const modalHistorySession = `${Date.now()}-${Math.random()}`;
const modalHistoryKey = "timelessMemoryModals";
const modalPanels = [winPanel, collectionPanel, legendsPanel, rarityPanel, aboutPanel];
const modalHistory = !isEmbedded ? window.history : null;

function getModalSnapshot() {
  return {
    panels: modalPanels.filter(panel => panel?.classList.contains("is-visible")).map(panel => panel.id),
    detail: modalDetailPair,
    rarity: modalRarity
  };
}

function writeModalHistory(snapshot, push = false) {
  const state = { ...modalHistory.state, [modalHistoryKey]: { session: modalHistorySession, ...snapshot } };
  modalHistory[push ? "pushState" : "replaceState"](state, "");
}

function syncModalHistory() {
  if (!modalHistory || restoringModalHistory || pendingModalNavigation) return;
  const snapshot = getModalSnapshot();
  const previous = modalHistory.state?.[modalHistoryKey];
  if (previous?.session !== modalHistorySession) {
    writeModalHistory({ panels: [], detail: null, rarity: null });
  }
  const depth = previous?.session === modalHistorySession ? previous.panels.length : 0;
  if (snapshot.panels.length < depth) {
    // Keep close buttons immediate; consume their history entries asynchronously.
    pendingModalNavigation = true;
    modalHistory.go(snapshot.panels.length - depth);
  } else if (snapshot.panels.length > depth) {
    writeModalHistory(snapshot, true);
  } else {
    writeModalHistory(snapshot);
  }
}

function restoreModalSnapshot(snapshot) {
  restoringModalHistory = true;
  try {
    const visible = new Set(snapshot.panels.filter(id => {
      // Forward must not resurrect a previous round's completion dialogs.
      if (id === "winPanel" || (id === "legendsPanel" && !snapshot.detail)) return gameCompleted;
      return true;
    }));
    if (!visible.has("rarityPanel")) closeRarityPanel();
    if (!visible.has("legendsPanel")) closeLegendsPanel();
    if (!visible.has("collectionPanel") && collectionPanel.classList.contains("is-visible")) closeCollection();
    if (!visible.has("aboutPanel") && aboutPanel.classList.contains("is-visible")) closeAboutPanel();
    modalPanels.forEach(panel => panel?.classList.toggle("is-visible", visible.has(panel.id)));
    modalDetailPair = snapshot.detail;
    modalRarity = snapshot.rarity;
    if (visible.has("legendsPanel")) {
      renderLegendsList(snapshot.detail ? [snapshot.detail] : undefined, snapshot.detail);
      legendsPanel.classList.toggle("is-collection-detail", Boolean(snapshot.detail));
      if (snapshot.detail && !collectionDetailTrigger) collectionDetailTrigger = collectionButton;
    }
    if (visible.has("rarityPanel")) {
      renderRarityPreviewList(snapshot.rarity);
      if (visible.has("collectionPanel") && !collectionRarityTrigger) collectionRarityTrigger = collectionButton;
    }
    const coveredCollection = visible.has("collectionPanel") && (visible.has("rarityPanel") || Boolean(snapshot.detail));
    collectionPanel.inert = coveredCollection;
    collectionPanel.setAttribute("aria-modal", String(!coveredCollection));
    // Move focus into the newly active layer (including after Forward).
    if (visible.has("aboutPanel")) closeAboutButton.focus();
    else if (visible.has("rarityPanel")) closeRarityButton.focus();
    else if (visible.has("legendsPanel")) closeLegendsButton.focus();
    else if (visible.has("collectionPanel")) closeCollectionButton.focus();
    else if (visible.has("winPanel")) closeWinButton.focus();
    syncModalScrollLock();
  } finally {
    restoringModalHistory = false;
  }
}

window.addEventListener("popstate", event => {
  if (!modalHistory) return;
  if (pendingModalNavigation) {
    pendingModalNavigation = false;
    // A user may have opened or closed another layer while history was moving.
    syncModalHistory();
    return;
  }
  const snapshot = event.state?.[modalHistoryKey];
  restoreModalSnapshot(snapshot?.session === modalHistorySession ? snapshot : { panels: [], detail: null, rarity: null });
});
const languageLabels = {
  en: "English",
  es: "Español",
  fr: "Français",
  zh: "中文",
};

function getStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(themeStorageKey);
    return supportedThemes.includes(storedTheme) ? storedTheme : "system";
  } catch (error) {
    return "system";
  }
}

function readDiscoveries() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(collectionStorageKey));
    return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
  } catch (error) {
    return new Set();
  }
}

function getMirrorId(pair) {
  return `${pair.source}|${pair.mirror}`;
}

function getMirrorCatalogue() {
  const pairs = [...(memoryGame.pairs || []), ...(memoryGame.rarePairs || []).map((item) => item.pair)];
  return [...new Map(pairs.filter(Boolean).map((pair) => [getMirrorId(pair), pair])).values()];
}

function saveCompletedDiscoveries() {
  // Merge other tabs' progress; only the completed game's results grant discoveries.
  discoveries = new Set([...readDiscoveries(), ...discoveries, ...activePairs.map(getMirrorId)]);
  try {
    window.localStorage.setItem(collectionStorageKey, JSON.stringify([...discoveries]));
  } catch (error) {}
  setElementHidden(collectionButton, discoveries.size === 0);
}

function renderCollection() {
  const copy = memoryGame.collection || {};
  const catalogue = getMirrorCatalogue();
  const found = catalogue.filter((pair) => discoveries.has(getMirrorId(pair))).length;
  setElementText(document.getElementById("collectionTitle"), copy.title || "My Collection");
  setElementText(document.getElementById("collectionProgressText"), (copy.progress || "Discovered mirrors: {found} / {total}")
    .replace("{found}", found).replace("{total}", catalogue.length));
  const progress = document.getElementById("collectionProgress");
  progress.max = catalogue.length || 1;
  progress.value = found;
  const groups = [
    { rarity: "", title: copy.original || "Original Mirrors" },
    { rarity: "rare", title: copy.directorsCut || "Director's Cut" },
    { rarity: "ultra-rare", title: copy.other || "Online exclusive mirrors" },
  ].map(({ rarity, title }) => {
    const section = document.createElement("section");
    section.className = "collection-group";
    section.dataset.rarity = rarity;
    const heading = document.createElement("h3");
    heading.textContent = title;
    const info = document.createElement("button");
    info.type = "button";
    info.className = "collection-info";
    const rarityInfo = memoryGame.rarityInfoCards?.find((item) => (item.rarity || "") === rarity);
    const infoLabel = `${title}: ${rarityInfo?.title || memoryGame.rarityInfoTitle || "Hidden Rarities"}`;
    info.setAttribute("aria-label", infoLabel);
    info.setAttribute("aria-haspopup", "dialog");
    info.title = infoLabel;
    info.innerHTML = `<svg class="collection-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v6"></path><circle cx="12" cy="7" r="1" fill="currentColor" stroke="none"></circle></svg>`;
    info.addEventListener("click", () => openRarityPanel(rarity, info));
    heading.append(info);
    const grid = document.createElement("div");
    grid.className = "collection-grid";
    catalogue.filter((pair) => (pair.rarity || "") === rarity).forEach((pair) => {
      const discovered = discoveries.has(getMirrorId(pair));
      const card = document.createElement("button");
      card.type = "button";
      card.className = "collection-mirror rarity-preview-card";
      card.dataset.rarity = rarity;
      card.disabled = !discovered;
      const mark = document.createElement("span");
      mark.className = "character-mark";
      mark.setAttribute("aria-hidden", "true");
      if (discovered) {
        const icon = document.createElement("i");
        icon.className = `character-icon icon-${pair.icon || getPairIcon(pair.source, pair.mirror)}`;
        mark.append(icon);
      } else {
        mark.textContent = "?";
      }
      const name = document.createElement("strong");
      name.textContent = discovered ? pair.insightTitle || "" : "???";
      const flags = document.createElement("span");
      flags.textContent = discovered
        ? `${getOriginFlag(pair.sourceOrigin || "source")} · ${getOriginFlag(pair.mirrorOrigin || "mirror")}`
        : rarity === "" ? "🇸🇻 · 🇪🇸" : "🇸🇻 · ❓";
      card.append(mark, name, flags);
      if (discovered) {
        card.addEventListener("click", () => {
          collectionDetailTrigger = card;
          modalDetailPair = pair;
          renderLegendsList([pair], pair);
          legendsPanel.classList.add("is-visible", "is-collection-detail");
          collectionPanel.inert = true;
          collectionPanel.setAttribute("aria-modal", "false");
          closeLegendsButton.focus();
          syncModalScrollLock();
        });
      }
      grid.append(card);
    });
    section.append(heading, grid);
    return section;
  });
  document.getElementById("collectionGroups").replaceChildren(...groups);
  setElementText(document.getElementById("collectionContribution"), copy.contribute || "Know another mirror? Share a new comparison through our contact form.");
  const submit = document.getElementById("collectionSubmit");
  submit.textContent = copy.submit || "Submit a comparison";
  const formKey = currentLanguage === "es" ? "spanishContactForm" : "englishContactForm";
  submit.href = linkRegistry?.shared?.contact?.[formKey] || "";
  setElementHidden(submit, !submit.getAttribute("href"));
}

function openCollection() {
  if (!discoveries.size) return;
  renderCollection();
  collectionPanel.classList.add("is-visible");
  closeCollectionButton.focus();
  syncModalScrollLock();
}

function closeCollection() {
  collectionPanel.classList.remove("is-visible");
  collectionButton.focus();
  syncModalScrollLock();
}

function closeLegendsPanel() {
  modalDetailPair = null;
  legendsPanel.classList.remove("is-visible", "is-collection-detail");
  if (collectionDetailTrigger) {
    collectionPanel.inert = false;
    collectionPanel.setAttribute("aria-modal", "true");
    collectionDetailTrigger.focus({ preventScroll: true });
    collectionDetailTrigger = null;
    renderLegendsList();
  }
  syncModalScrollLock();
}

function resolveTheme(theme) {
  return supportedThemes.includes(theme) ? theme : "system";
}

function applyTheme(theme = getStoredTheme()) {
  const selectedTheme = resolveTheme(theme);
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const resolvedTheme =
    selectedTheme === "dark" || (selectedTheme === "system" && prefersDark) ? "dark" : "light";
  document.documentElement.dataset.theme = resolvedTheme;
  document.querySelector("meta[name='theme-color']").content =
    resolvedTheme === "dark" ? "#111820" : "#fffaf0";
  themeButton?.setAttribute("aria-pressed", String(resolvedTheme === "dark"));
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";

  try {
    window.localStorage.setItem(themeStorageKey, nextTheme);
  } catch (error) {}

  applyTheme(nextTheme);
}

function getShareUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("embed");
  return url.href;
}

function getStoredLanguage() {
  try {
    return window.localStorage.getItem(languageStorageKey);
  } catch (error) {
    return null;
  }
}

function hasSeenIntro() {
  try {
    return window.localStorage.getItem(introStorageKey) !== null;
  } catch (error) {
    return true;
  }
}

function setIntroSeen() {
  try {
    window.localStorage.setItem(introStorageKey, "true");
  } catch (error) {}
}

function getLanguage() {
  const storedLanguage = getStoredLanguage();
  const browserLanguage = (
    navigator.languages ? navigator.languages[0] : navigator.language || "en"
  ).split("-")[0];

  if (supportedLanguages.includes(storedLanguage)) {
    return storedLanguage;
  }

  return supportedLanguages.includes(browserLanguage) ? browserLanguage : "en";
}

function getTranslationValue(obj, path) {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function mergeLinkConfig(defaults, overrides = {}) {
  const merged = { ...defaults };

  Object.entries(overrides || {}).forEach(([key, value]) => {
    const defaultValue = merged[key];
    const shouldMerge =
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue);

    merged[key] = shouldMerge ? mergeLinkConfig(defaultValue, value) : value;
  });

  return merged;
}

function resolveGameHref(href) {
  if (!href) {
    return "";
  }

  if (/^https?:\/\//i.test(href)) {
    return href;
  }

  return getTranslationValue(localizedLinks, href) || "";
}

async function loadTranslations() {
  const language = getLanguage();
  currentLanguage = language;
  document.documentElement.lang = language;

  try {
    const [gameResponse, linksResponse] = await Promise.all([
      fetch(`js/i18n/memory-game/lang-${language}.min.json?v=${i18nCacheVersion}`),
      fetch("js/data/links.min.json"),
    ]);
    const gameData = await gameResponse.json();
    linkRegistry = await linksResponse.json();
    localizedLinks = mergeLinkConfig(
      linkRegistry.localized.default,
      linkRegistry.localized[language],
    );
    translations = gameData.translations;
    memoryGame = translations.memoryGame || { pairs: [] };
  } catch (error) {
    translations = { mapLegends: {}, memoryGame: { pairs: [] } };
    memoryGame = translations.memoryGame;
    localizedLinks = {};
  }
}

function setText(selector, value) {
  const element = document.querySelector(selector);
  if (element && value !== undefined) {
    element.textContent = value;
  }
}

function setElementText(element, value) {
  if (element && value !== undefined) {
    element.textContent = value;
  }
}

function setElementHref(element, value) {
  if (element) {
    element.href = value || "";
  }
}

function setElementHidden(element, shouldHide) {
  if (element) {
    element.hidden = shouldHide;
    element.toggleAttribute("hidden", shouldHide);
  }
}

function lockPageScroll() {
  document.documentElement.classList.add("is-modal-open");
}

function unlockPageScroll() {
  document.documentElement.classList.remove("is-modal-open");
}

function syncModalScrollLock() {
  syncModalHistory();
  refreshModalScrollLock();
}

function refreshModalScrollLock() {
  const hasOpenPanel = modalPanels.some(panel => panel?.classList.contains("is-visible"));
  const aboutOpen = aboutPanel.classList.contains("is-visible");
  if (gameLayout) gameLayout.inert = aboutOpen;
  if (gameFooter) gameFooter.inert = aboutOpen;

  if (hasOpenPanel) {
    lockPageScroll();
    return;
  }

  unlockPageScroll();
}

function setActionButtonContent(button, label, iconClass) {
  if (!button) {
    return;
  }

  button.dataset.label = label || "";
  button.setAttribute("aria-label", label || "");
  button.title = label || "";

  if (!iconClass) {
    button.textContent = label || "";
    return;
  }

  button.innerHTML = `
    <i class="action-icon ${iconClass}" aria-hidden="true"></i>
  `;
}

function getShareIconClass() {
  const userAgent = navigator.userAgent || "";
  const platform = navigator.userAgentData?.platform || navigator.platform || "";

  if (
    /iphone|ipad|ipod/i.test(userAgent) ||
    /iphone|ipad|ipod|mac/i.test(platform)
  ) {
    return "icon-share-apple";
  }

  if (/win/i.test(platform)) {
    return "icon-share-windows";
  }

  return "icon-share-generic";
}

function closeLanguageMenu() {
  languageMenu.hidden = true;
  languageButton.setAttribute("aria-expanded", "false");
}

function toggleLanguageMenu() {
  const shouldOpen = languageMenu.hidden;
  languageMenu.hidden = !shouldOpen;
  languageButton.setAttribute("aria-expanded", String(shouldOpen));
}

function setLanguage(language) {
  if (!supportedLanguages.includes(language) || language === currentLanguage) {
    closeLanguageMenu();
    return;
  }

  try {
    window.localStorage.setItem(languageStorageKey, language);
  } catch (error) {}

  window.location.reload();
}

function renderLanguageMenu() {
  const options = supportedLanguages.map((language) => {
    const option = document.createElement("button");
    option.type = "button";
    option.className = "language-option";
    option.dataset.language = language;
    option.textContent = languageLabels[language] || language;
    option.setAttribute("role", "menuitemradio");
    option.setAttribute("aria-checked", String(language === currentLanguage));
    option.addEventListener("click", () => setLanguage(language));
    return option;
  });

  languageMenu.replaceChildren(...options);
}

function renderFooter() {
  if (!gameFooter) {
    return;
  }

  const text = memoryGame.footer || "";
  const link = document.createElement("button");
  link.type = "button";
  link.id = "aboutAuthorButton";
  link.setAttribute("aria-haspopup", "dialog");
  link.setAttribute("aria-controls", "aboutPanel");
  link.setAttribute("aria-label", memoryGame.about?.open || "About Federico Navarrete");
  link.addEventListener("click", openAboutPanel);
  link.textContent = "Federico Navarrete";

  gameFooter.replaceChildren();
  const parts = text.split("{author}");
  const author = document.createElement("span");
  author.className = "footer-author";
  author.append(link);

  if (parts.length > 1) {
    author.append(document.createTextNode(parts.slice(1).join("{author}")));
  }
  gameFooter.append(document.createTextNode(parts[0] || ""), author);
}

function renderAbout() {
  const copy = memoryGame.about || {};
  setElementText(document.getElementById("aboutLabel"), copy.label || "About the author");
  closeAboutButton.setAttribute("aria-label", memoryGame.close || "Close");
  const paragraphs = (copy.biography || []).map(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    return paragraph;
  });
  document.getElementById("aboutBiography").replaceChildren(...paragraphs);
  const previews = {
    en: "img/previews/mirrors_medium.webp",
    es: "img/previews/mirrors_es_medium.webp",
    fr: "img/previews/mirrors_fr_medium.webp"
  };
  const preview = document.getElementById("aboutBookImage");
  preview.src = previews[currentLanguage] || previews.en;
  preview.alt = copy.previewAlt || "Spanish Mirrors book preview";
  setElementText(document.getElementById("aboutEdition"), copy.edition || "English edition");
  setElementText(document.getElementById("aboutBookTitle"), copy.bookTitle || "Spanish Mirrors");
  setElementText(document.getElementById("aboutBookDescription"), copy.bookDescription || "");
  const bookUrl = resolveGameHref(memoryGame.getCopyHref);
  document.getElementById("aboutPreviewLink").href = bookUrl;
  document.getElementById("aboutBookLink").href = bookUrl;
  setElementText(document.getElementById("aboutBookLink"), copy.amazon || "View on Amazon");
  document.getElementById("aboutWebsites").setAttribute("aria-label", copy.websites || "Official websites");
  setElementText(document.getElementById("aboutStoriesWebsite"), copy.storiesWebsite || "Timeless Stories");
}

function openAboutPanel() {
  aboutReturnFocus = document.getElementById("aboutAuthorButton");
  renderAbout();
  aboutPanel.classList.add("is-visible");
  closeAboutButton.focus({ preventScroll: true });
  syncModalScrollLock();
}

function closeAboutPanel() {
  aboutPanel.classList.remove("is-visible");
  syncModalScrollLock();
  aboutReturnFocus?.focus({ preventScroll: true });
}

function applyUiCopy() {
  renderAbout();
  const seoTitle = memoryGame.seoTitle || memoryGame.title || document.title;
  const seoDescription = memoryGame.seoDescription || memoryGame.subtitle || "";
  document.title = seoTitle;
  document.querySelector("meta[name='description']").content = seoDescription;
  document.querySelector("meta[property='og:title']").content = seoTitle;
  document.querySelector("meta[property='og:description']").content = seoDescription;
  document.querySelector("meta[property='og:url']").content = getShareUrl();
  document.querySelector("meta[property='twitter:title']").content = seoTitle;
  document.querySelector("meta[property='twitter:description']").content = seoDescription;
  document.querySelector("link[rel='canonical']").href = getShareUrl();
  document.getElementById("gameTitle").textContent = memoryGame.title || "";
  document.querySelector(".game-shell").setAttribute("aria-label", memoryGame.title || "");
  setText(".game-subtitle", memoryGame.subtitle);
  renderFooter();
  newGameButton.textContent = memoryGame.newGame || "";
  setActionButtonContent(languageButton, memoryGame.language || "Language", "icon-translate");
  renderLanguageMenu();
  setActionButtonContent(themeButton, memoryGame.theme || "Color mode", "icon-yin-yang");
  setActionButtonContent(shareButton, memoryGame.share || "", getShareIconClass());
  setActionButtonContent(hintButton, memoryGame.hint || "Hint", "icon-bulb");
  setActionButtonContent(topViewLegendsButton, memoryGame.viewLegends || "View all legends", "icon-table-eye");
  setActionButtonContent(collectionButton, memoryGame.collection?.title || "My Collection", "icon-book-open");
  setElementHidden(collectionButton, discoveries.size === 0);
  closeCollectionButton.setAttribute("aria-label", memoryGame.close || "Close");
  playAgainButton.textContent = memoryGame.playAgain || "";
  setElementText(viewLegendsButton, memoryGame.viewLegends || "View all legends");
  winShareButton.textContent = memoryGame.share || "";
  closeWinButton.setAttribute("aria-label", memoryGame.close || "Close");
  closeLegendsButton?.setAttribute("aria-label", memoryGame.close || "Close");
  closeRarityButton?.setAttribute("aria-label", memoryGame.close || "Close");
  legendToastClose.setAttribute("aria-label", memoryGame.close || "Close");
  previewRewardButton.textContent = memoryGame.previewReward || "Preview the book";
  previewRewardButton.href =
    resolveGameHref(memoryGame.previewRewardHref) || "https://bit.ly/4dyjiZz";
  getCopyButton.textContent = memoryGame.getCopy || "Get a copy of the book";
  getCopyButton.href = resolveGameHref(memoryGame.getCopyHref);
  setElementText(legendsGetCopyButton, memoryGame.getCopy || "Get a copy of the book");
  setElementHref(legendsGetCopyButton, resolveGameHref(memoryGame.getCopyHref));
  winTitle.textContent = memoryGame.winTitle || "";
  setElementText(legendsPanelTitle, memoryGame.legendsTitle || "");
  setElementText(legendsRarityNote, memoryGame.legendsRarityNote || "");
  setElementText(rarityPanelTitle, memoryGame.rarityInfoTitle || "Hidden Rarities");
  renderRarityPreviewList();
  document.querySelector(".status-grid").setAttribute("aria-label", memoryGame.statusLabel || "");
  setText('[data-ui-label="moves"]', memoryGame.moves);
  setText('[data-ui-label="matches"]', memoryGame.matches);
  setText('[data-ui-label="time"]', memoryGame.time);
  board.setAttribute("aria-label", memoryGame.boardLabel || "");
}

function getLegendName(key) {
  return translations?.mapLegends?.[key]?.name || key;
}

function getLegendDescription(key) {
  return translations?.mapLegends?.[key]?.desc || "";
}

function getOriginLabel(side) {
  const originLabels = {
    source: translations?.country1 || "",
    mirror: translations?.country2 || "",
    morocco: translations?.country3 || "",
    poland: translations?.country4 || "",
    ecuador: translations?.country5 || "",
    luxembourg: translations?.country6 || "",
    usa: translations?.country7 || "",
    estonia: translations?.country8 || "",
    sweden: translations?.country9 || "",
    belgium: translations?.country10 || "",
    iceland: translations?.country11 || "",
    italy: translations?.country12 || "",
    austria: translations?.country13 || "",
    turkey: translations?.country14 || "",
    india: translations?.country15 || "",
  };

  return originLabels[side] || "";
}

function getOriginFlag(side) {
  const label = getOriginLabel(side);
  return label.match(/[\u{1F1E6}-\u{1F1FF}]{2}/u)?.[0] || "";
}

function getPairIcon(source, mirror) {
  const pairKey = [source, mirror].sort().join("|");
  const pairIcons = {
    "blackKnight|caveOfSalamanca": "devil",
    "midnightWasherwomen|siguanaba": "masks",
    "dip|goodAndBadCadejo": "paw",
    "ghostOfSanGines|headlessPriest": "cross",
    "fleshlessWoman|girlOnTheCurve": "routes",
    "funeralCortegeOfChalchuapa|holyCompany": "candle",
    "fairJudgeOfTheNight|gaueko": "night",
    "ploranera|weepingWoman": "cry",
    "dwarf|trasgu": "wizard",
    "mulus|urco": "tomb",
    "olomegaLagoonSiren|xana": "music",
    "aishaKandisha|siguanaba": "masks",
  };

  return pairIcons[pairKey] || "masks";
}

function getPairCount() {
  return activePairs.length || (Array.isArray(memoryGame.pairs) ? memoryGame.pairs.length : 0);
}

function chooseWeightedVariant(variants) {
  const total = variants.reduce((sum, variant) => sum + (Number(variant.chance) || 0), 0);
  const roll = Math.random() * total;
  let threshold = 0;
  return variants.find(variant => {
    threshold += Number(variant.chance) || 0;
    return roll < threshold;
  });
}

function chooseActivePairs() {
  const pairs = Array.isArray(memoryGame.pairs) ? memoryGame.pairs.map((pair) => ({ ...pair })) : [];
  const variants = Array.isArray(memoryGame.rarePairs) ? memoryGame.rarePairs : [];
  let selectedVariants;
  // One percent of rounds have two specials. The remaining rounds use the
  // configured 65/20/15 distribution, with at most one special pair.
  if (Math.random() < 0.01 && pairs.length >= 2) {
    const superRare = variants.filter(variant => variant.pair?.rarity === "ultra-rare");
    const directorsCut = variants.filter(variant => variant.pair?.rarity === "rare");
    const first = chooseWeightedVariant(Math.random() < 0.5 ? directorsCut : superRare);
    // A source legend must occur only once on the board. Two variants of the
    // same original would otherwise overwrite each other or duplicate a source.
    const compatible = superRare.filter(variant => first &&
      variant.pair.source !== first.pair.source &&
      variant.pair.mirror !== first.pair.mirror);
    selectedVariants = [first, chooseWeightedVariant(compatible)].filter(Boolean);
  } else {
    const roll = Math.random();
    let threshold = 0;
    const selected = variants.find(variant => {
      threshold += Number(variant.chance) || 0;
      return roll < threshold;
    });
    selectedVariants = selected?.pair ? [selected] : [];
  }

  const replaced = new Set();
  for (const variant of selectedVariants) {
    const available = pairs.map((_, index) => index).filter(index => !replaced.has(index));
    if (!available.length) break;
    const target = variant.replaceSource
      ? pairs.findIndex(pair => pair.source === variant.replaceSource) : -1;
    const index = target >= 0 && !replaced.has(target)
      ? target : available[Math.floor(Math.random() * available.length)];
    pairs[index] = { ...variant.pair };
    replaced.add(index);
  }
  return pairs;
}

function buildDeck() {
  const pairs = activePairs.length ? activePairs : chooseActivePairs();

  return pairs.flatMap((pair, pairIndex) => {
    const { source, mirror, insightTitle, insight } = pair;
    const icon = pair.icon || getPairIcon(source, mirror);

    return [
      {
        key: source,
        pairId: `pair-${pairIndex}`,
        side: pair.sourceOrigin || "source",
        rarity: pair.rarity || "",
        name: getLegendName(source),
        shortName: translations?.mapLegends?.[source]?.shortName,
        desc: getLegendDescription(source),
        icon,
        insightTitle,
        insight,
      },
      {
        key: mirror,
        pairId: `pair-${pairIndex}`,
        side: pair.mirrorOrigin || "mirror",
        rarity: pair.rarity || "",
        name: getLegendName(mirror),
        shortName: translations?.mapLegends?.[mirror]?.shortName,
        desc: getLegendDescription(mirror),
        icon,
        insightTitle,
        insight,
      },
    ];
  });
}

function shuffle(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getInitials(name) {
  return name
    .replace(/^The /, "")
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function updateStatus() {
  movesValue.textContent = moves;
  matchesValue.textContent = `${matches}/${getPairCount()}`;
  timeValue.textContent = formatTime(elapsedSeconds);
}

function startTimer() {
  if (timer) {
    return;
  }

  timer = window.setInterval(() => {
    elapsedSeconds += 1;
    updateStatus();
  }, 1000);
}

function stopTimer() {
  if (!timer) {
    return;
  }

  window.clearInterval(timer);
  timer = null;
}

function hasGameInProgress() {
  return !introRunning && !gameCompleted && (elapsedSeconds > 0 || moves > 0 || matches > 0);
}

function warnBeforeLeaving(event) {
  if (!hasGameInProgress()) {
    return;
  }

  event.preventDefault();
  event.returnValue = "";
}

function createCard(character, index) {
  const card = document.createElement("button");
  card.className = "card";
  card.type = "button";
  card.dataset.pairId = character.pairId;
  card.dataset.character = character.name;
  card.dataset.description = character.desc || "";
  card.dataset.insightTitle = character.insightTitle || "";
  card.dataset.insight = character.insight || "";
  card.dataset.rarity = character.rarity || "";
  card.setAttribute("aria-label", memoryGame.hiddenCard || "");
  const nameContent = character.shortName
    ? `<span class="character-name-full">${character.name}</span><span class="character-name-short">${character.shortName}</span>`
    : character.name;

  card.innerHTML = `
    <span class="card-inner">
      <span class="card-face card-back" aria-hidden="true">
        <span>TS</span>
      </span>
      <span class="card-face card-front">
        <span class="character-mark">
          <i class="character-icon icon-${character.icon}" aria-hidden="true"></i>
          <span class="character-flag" aria-hidden="true">${getOriginFlag(character.side)}</span>
        </span>
        <span class="character-title">
          <span class="character-name">${nameContent}</span>
        </span>
        <span class="character-origin"><span class="character-origin-text">${getOriginLabel(character.side).replace(getOriginFlag(character.side), "").trim()}</span> <span class="character-origin-flag">${getOriginFlag(character.side)}</span></span>
      </span>
    </span>
  `;

  card.addEventListener("click", () => flipCard(card));
  card.dataset.index = index;
  return card;
}

function resetTurn() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function hideOpenCards() {
  firstCard.classList.remove("is-flipped");
  secondCard.classList.remove("is-flipped");
  firstCard.setAttribute("aria-label", memoryGame.hiddenCard || "");
  secondCard.setAttribute("aria-label", memoryGame.hiddenCard || "");
  resetTurn();
}

function markMatch() {
  firstCard.classList.add("is-matched");
  secondCard.classList.add("is-matched");
  matches += 1;
  showMatchInsight(firstCard);
  updateStatus();

  if (matches === getPairCount()) {
    stopTimer();
    gameCompleted = true;
    saveCompletedDiscoveries();
    board.classList.add("is-complete");
    setTopLegendActionVisibility(true);
    setPreviewRewardVisibility(elapsedSeconds < previewRewardThresholdSeconds);
    winMessage.textContent = (memoryGame.win || "")
      .replace("{pairs}", getPairCount())
      .replace("{moves}", moves)
      .replace("{time}", formatTime(elapsedSeconds));
    winPanel.classList.add("is-visible");
    syncModalScrollLock();
  }

  resetTurn();
}

function showMatchInsight(card) {
  matchInsightTitle.textContent = card.dataset.insightTitle || "";
  matchInsightText.textContent = card.dataset.insight || "";
  matchInsight.classList.toggle(
    "is-visible",
    Boolean(card.dataset.insightTitle || card.dataset.insight),
  );
}

function createLegendCell(characterKey, side) {
  const cell = document.createElement("article");
  cell.className = "legend-cell";
  const name = getLegendName(characterKey);
  const description = getLegendDescription(characterKey);

  cell.innerHTML = `
    <span class="legend-copy">
      <strong>${name}</strong>
      <span>${getOriginLabel(side)}</span>
      <p>${description}</p>
    </span>
  `;

  return cell;
}

function renderLegendsList(pairs = activePairs.length ? activePairs : chooseActivePairs(), detailPair = null) {
  setElementText(legendsPanelTitle, detailPair ? getLegendName(detailPair.mirror) : memoryGame.legendsTitle || "");
  setElementHidden(legendsPanelTitle, Boolean(detailPair));
  setElementHidden(document.getElementById("legendsFooter"), false);
  setElementHidden(legendsRarityNote, Boolean(detailPair));
  const rows = pairs.map((pair) => {
    const { source, mirror, insightTitle, insight } = pair;
    const row = document.createElement("section");
    const icon = pair.icon || getPairIcon(source, mirror);
    row.className = "legend-row";
    row.dataset.rarity = pair.rarity || "";
    const category = document.createElement("header");
    category.className = "legend-category";
    category.innerHTML = `
      <span class="legend-mark">
        <i class="character-icon icon-${icon}" aria-hidden="true"></i>
      </span>
      <strong>${insightTitle || ""}</strong>
      <span>${insight || ""}</span>
    `;
    row.append(
      category,
      createLegendCell(source, pair.sourceOrigin || "source"),
      createLegendCell(mirror, pair.mirrorOrigin || "mirror"),
    );
    return row;
  });

  legendsList?.replaceChildren(...rows);
}

function renderRarityPreviewList(rarity = null) {
  if (!rarityPreviewList) {
    return;
  }

  const items = Array.isArray(memoryGame.rarityInfoCards) ? memoryGame.rarityInfoCards : [];
  const cards = items.filter((item) => rarity === null || (item.rarity || "") === rarity).map((item) => {
    const card = document.createElement("article");
    card.className = "rarity-preview-card";
    card.dataset.rarity = item.rarity || "";
    card.setAttribute("aria-label", [item.title, item.label].filter(Boolean).join(". "));
    card.innerHTML = `
      <span class="character-mark">
        <i class="character-icon icon-${item.icon || "book"}" aria-hidden="true"></i>
      </span>
      <h3>${item.title || ""}</h3>
      <strong>${item.label || ""}</strong>
      <p>${item.description || ""}</p>
    `;
    return card;
  });

  rarityPreviewList.replaceChildren(...cards);
  rarityPreviewList.classList.toggle("is-single", rarity !== null);
}

function openRarityPanel(rarity = null, trigger = null) {
  modalRarity = rarity;
  renderRarityPreviewList(rarity);
  collectionRarityTrigger = trigger;
  if (trigger) {
    collectionPanel.inert = true;
    collectionPanel.setAttribute("aria-modal", "false");
  }
  rarityPanel?.classList.add("is-visible");
  closeRarityButton?.focus();
  syncModalScrollLock();
}

function closeRarityPanel() {
  modalRarity = null;
  rarityPanel?.classList.remove("is-visible");
  if (collectionRarityTrigger) {
    collectionPanel.inert = false;
    collectionPanel.setAttribute("aria-modal", "true");
    collectionRarityTrigger.focus({ preventScroll: true });
    collectionRarityTrigger = null;
  }
  syncModalScrollLock();
}

function hideLegendToast() {
  legendToast.hidden = true;
  legendToast.dataset.tutorial = "false";
  legendToastClose.hidden = false;
  if (toastTimer) {
    window.clearTimeout(toastTimer);
    toastTimer = null;
  }
}

function showToast(title, text, emphasis = "", underline = "") {
  if (!text) {
    hideLegendToast();
    return;
  }

  legendToastTitle.textContent = title || "";
  const content = [];
  let remaining = text;
  if (emphasis && remaining.startsWith(emphasis)) {
    const opening = document.createElement("b");
    opening.textContent = emphasis;
    content.push(opening);
    remaining = remaining.slice(emphasis.length);
  }
  if (underline && remaining.endsWith(underline)) {
    content.push(document.createTextNode(remaining.slice(0, -underline.length)));
    const ending = document.createElement("u");
    ending.textContent = underline;
    content.push(ending);
  } else {
    content.push(document.createTextNode(remaining));
  }
  legendToastText.replaceChildren(...content);
  legendToast.hidden = false;
  legendToast.dataset.tutorial = String(introRunning);
  legendToastClose.hidden = introRunning;

  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  // The tutorial owns its hint until the demonstration finishes or is reset.
  toastTimer = introRunning ? null : window.setTimeout(hideLegendToast, 5200);
}

function showLegendToast(card) {
  showToast(card.dataset.character || "", card.dataset.description || "");
}

function setPreviewRewardVisibility(shouldShow) {
  previewRewardButton.hidden = !shouldShow;
  previewRewardButton.toggleAttribute("hidden", !shouldShow);
}

function setTopLegendActionVisibility(shouldShow) {
  setElementHidden(hintButton, shouldShow);
  setElementHidden(topViewLegendsButton, !shouldShow);
}

function flipCard(card) {
  if (introRunning) {
    return;
  }

  if (card.classList.contains("is-matched")) {
    showMatchInsight(card);
    if (gameCompleted) {
      showLegendToast(card);
    }
    return;
  }

  if (lockBoard || card === firstCard) {
    return;
  }

  startTimer();
  card.classList.add("is-flipped");
  card.setAttribute("aria-label", card.dataset.character);

  if (!firstCard) {
    firstCard = card;
    return;
  }

  secondCard = card;
  lockBoard = true;
  moves += 1;
  updateStatus();

  if (firstCard.dataset.pairId === secondCard.dataset.pairId) {
    markMatch();
    return;
  }

  window.setTimeout(hideOpenCards, mismatchFlipBackDelayMs);
}

function newGame() {
  tutorialRunId += 1;
  hintPressCount = 0;
  stopTimer();
  introRunning = false;
  firstCard = null;
  secondCard = null;
  lockBoard = false;
  moves = 0;
  matches = 0;
  elapsedSeconds = 0;
  gameCompleted = false;
  activePairs = chooseActivePairs();
  board.classList.remove("is-complete", "is-intro");
  matchInsight.classList.remove("is-visible");
  matchInsightTitle.textContent = "";
  matchInsightText.textContent = "";
  modalPanels.forEach(panel => panel?.classList.remove("is-visible", "is-collection-detail"));
  collectionPanel.inert = false;
  collectionPanel.setAttribute("aria-modal", "true");
  collectionDetailTrigger = null;
  collectionRarityTrigger = null;
  modalDetailPair = null;
  modalRarity = null;
  syncModalScrollLock();
  setTopLegendActionVisibility(false);
  setPreviewRewardVisibility(false);
  hideLegendToast();
  winMessage.textContent = "";
  updateStatus();

  deck = shuffle(buildDeck());
  renderLegendsList();
  board.replaceChildren(...deck.map(createCard));
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function restartGame() {
  newGame();
  // Reset an already-scrolled board after its previous match description and
  // dialogs disappear. Preserve the user's scroll position on ordinary resume.
  newGameButton.focus({ preventScroll: true });
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

async function runIntroTutorial() {
  if (introRunning) return;
  const runId = ++tutorialRunId;
  hintPressCount = 0;
  stopTimer();
  introRunning = true;
  firstCard = null;
  secondCard = null;
  lockBoard = true;
  moves = 0;
  matches = 0;
  elapsedSeconds = 0;
  gameCompleted = false;
  activePairs = [];
  board.classList.remove("is-complete");
  board.classList.add("is-intro");
  matchInsight.classList.remove("is-visible");
  matchInsightTitle.textContent = "";
  matchInsightText.textContent = "";
  winPanel.classList.remove("is-visible");
  legendsPanel?.classList.remove("is-visible");
  rarityPanel?.classList.remove("is-visible");
  syncModalScrollLock();
  setTopLegendActionVisibility(false);
  setPreviewRewardVisibility(false);
  winMessage.textContent = "";
  updateStatus();

  const tutorialCards = [
    {
      key: "introLegend1",
      pairId: "intro-pair",
      side: "source",
      name: memoryGame.introLegend1 || "Legend 1",
      desc: "",
      icon: "book",
      rarity: "tutorial",
    },
    {
      key: "introLegend2",
      pairId: "intro-pair",
      side: "mirror",
      name: memoryGame.introLegend2 || "Legend 2",
      desc: "",
      icon: "book",
      rarity: "tutorial",
    },
  ];

  board.replaceChildren(...tutorialCards.map(createCard));
  const cards = [...board.querySelectorAll(".card")];
  showToast(memoryGame.hint || "Hint", memoryGame.hintText || "Pay attention to the icons.", memoryGame.hintEmphasis, memoryGame.hintUnderline);

  await wait(1000);
  if (runId !== tutorialRunId) return;
  cards[0]?.classList.add("is-flipped");
  cards[0]?.setAttribute("aria-label", tutorialCards[0].name);
  await wait(1200);
  if (runId !== tutorialRunId) return;
  cards[1]?.classList.add("is-flipped");
  cards[1]?.setAttribute("aria-label", tutorialCards[1].name);
  await wait(800);
  if (runId !== tutorialRunId) return;
  cards.forEach((card) => card.classList.add("is-matched"));
  // Leave the matched cards visible while the player finishes reading.
  await wait(3500);
  if (runId !== tutorialRunId) return;

  setIntroSeen();
  introRunning = false;
  lockBoard = false;
  newGame();
}

function handleHint() {
  if (introRunning) return;
  // The first flip starts play before either the move count or timer ticks.
  const canReplayTutorial = !gameCompleted && !firstCard &&
    moves === 0 && matches === 0 && elapsedSeconds === 0;
  hintPressCount = canReplayTutorial ? hintPressCount + 1 : 0;
  if (hintPressCount === 3) {
    runIntroTutorial();
    if (!isEmbedded) window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    return;
  }
  showToast(memoryGame.hint || "Hint", memoryGame.hintText || "Pay attention to the icons.", memoryGame.hintEmphasis, memoryGame.hintUnderline);
}

function startGame() {
  if (hasSeenIntro()) {
    newGame();
    return;
  }

  runIntroTutorial();
}

function openLegendsPanel() {
  if (!gameCompleted) {
    return;
  }

  legendsPanel?.classList.add("is-visible");
  syncModalScrollLock();
}

async function shareGame(button = shareButton) {
  const shareData = {
    title: memoryGame.title || document.title,
    text: memoryGame.shareText || memoryGame.subtitle || "",
    url: getShareUrl(),
  };

  if (navigator.share) {
    await navigator.share(shareData);
    return;
  }

  await navigator.clipboard?.writeText(shareData.url);
  const originalLabel = button.textContent || memoryGame.share || "";
  button.textContent = memoryGame.shareCopied || originalLabel;
  window.setTimeout(() => {
    if (button === shareButton) {
      setActionButtonContent(button, button.dataset.label || originalLabel, getShareIconClass());
      return;
    }

    button.textContent = originalLabel;
  }, 1600);
}

newGameButton.addEventListener("click", restartGame);
languageButton.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleLanguageMenu();
});
languageMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});
themeButton?.addEventListener("click", toggleTheme);
document.addEventListener("click", (event) => {
  if (!languageControl.contains(event.target)) {
    closeLanguageMenu();
  }

  if (event.target.closest?.("#legendsRarityNote")) {
    event.preventDefault();
    openRarityPanel();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && (aboutPanel.classList.contains("is-visible") || collectionPanel.classList.contains("is-visible"))) {
    const panel = aboutPanel.classList.contains("is-visible") ? aboutPanel
      : rarityPanel.classList.contains("is-visible") ? rarityPanel
      : collectionDetailTrigger ? legendsPanel : collectionPanel;
    const controls = [...panel.querySelectorAll("button:not(:disabled), a[href]")]
      .filter((element) => !element.hidden && element.getClientRects().length);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
      event.preventDefault();
      first?.focus();
    }
  }
  if (event.key === "Escape") {
    closeLanguageMenu();
    if (aboutPanel.classList.contains("is-visible")) {
      closeAboutPanel();
    } else if (rarityPanel?.classList.contains("is-visible")) {
      closeRarityPanel();
    } else if (legendsPanel.classList.contains("is-visible") && collectionDetailTrigger) {
      closeLegendsPanel();
    } else if (collectionPanel.classList.contains("is-visible")) {
      closeCollection();
    } else if (legendsPanel.classList.contains("is-visible")) {
      closeLegendsPanel();
    } else if (winPanel.classList.contains("is-visible")) {
      winPanel.classList.remove("is-visible");
      syncModalScrollLock();
    }
  }
});
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  const data = event.data || {};
  if (data.source === "timelessStories" && data.type === "themeChanged") {
    applyTheme(data.theme);
  }
});
window.addEventListener("storage", (event) => {
  if (event.key === themeStorageKey) {
    applyTheme();
  }
});
window.addEventListener("beforeunload", warnBeforeLeaving);
// Android may resume the existing page after an external link, or restore it
// from the back/forward cache. Derive the lock from the visible dialogs without
// creating or traversing history entries during those lifecycle events.
window.addEventListener("pageshow", refreshModalScrollLock);
window.addEventListener("focus", refreshModalScrollLock);
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshModalScrollLock();
});
shareButton.addEventListener("click", () => {
  shareGame(shareButton).catch(() => {});
});
hintButton.addEventListener("click", handleHint);
winShareButton.addEventListener("click", () => {
  shareGame(winShareButton).catch(() => {});
});
closeWinButton.addEventListener("click", () => {
  winPanel.classList.remove("is-visible");
  syncModalScrollLock();
});
viewLegendsButton?.addEventListener("click", openLegendsPanel);
topViewLegendsButton?.addEventListener("click", openLegendsPanel);
closeLegendsButton?.addEventListener("click", closeLegendsPanel);
closeAboutButton.addEventListener("click", closeAboutPanel);
aboutPanel.addEventListener("click", event => {
  if (event.target === aboutPanel) closeAboutPanel();
});
collectionButton.addEventListener("click", openCollection);
closeCollectionButton.addEventListener("click", closeCollection);
collectionPanel.addEventListener("click", (event) => {
  if (event.target === collectionPanel) closeCollection();
});
closeRarityButton?.addEventListener("click", closeRarityPanel);
rarityPanel?.addEventListener("click", (event) => {
  if (event.target === rarityPanel) {
    closeRarityPanel();
  }
});
legendToastClose.addEventListener("click", () => {
  if (!introRunning) hideLegendToast();
});
playAgainButton.addEventListener("click", restartGame);
applyTheme();
document.documentElement.dataset.embed = String(isEmbedded);
window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener("change", applyTheme);
loadTranslations().finally(() => {
  applyUiCopy();
  startGame();
});
