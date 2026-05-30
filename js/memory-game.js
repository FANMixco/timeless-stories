const supportedLanguages = ["en", "es", "fr", "zh"];
const languageStorageKey = "timelessStoriesOfficialLanguage";
const themeStorageKey = "timelessStoriesColorMode";
const introStorageKey = "timelessMemoryIntroSeen";
const supportedThemes = ["system", "light", "dark"];
const previewRewardThresholdSeconds = 30;
const mismatchFlipBackDelayMs = 1200;
const i18nCacheVersion = "20260530-refresh-warning-native";
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
const gameFooter = document.getElementById("gameFooter");
const newGameButton = document.getElementById("newGameButton");
const languageControl = document.getElementById("languageControl");
const languageButton = document.getElementById("languageButton");
const languageMenu = document.getElementById("languageMenu");
const themeButton = document.getElementById("themeButton");
const shareButton = document.getElementById("shareButton");
const hintButton = document.getElementById("hintButton");
const topViewLegendsButton = document.getElementById("topViewLegendsButton");
const playAgainButton = document.getElementById("playAgainButton");
const viewLegendsButton = document.getElementById("viewLegendsButton");
const winShareButton = document.getElementById("winShareButton");
const closeWinButton = document.getElementById("closeWinButton");
const closeLegendsButton = document.getElementById("closeLegendsButton");
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
let translations = null;
let deck = [];
let activePairs = [];
let currentLanguage = "en";
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

function applyTheme() {
  const theme = getStoredTheme();
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
  const resolvedTheme =
    theme === "dark" || (theme === "system" && prefersDark) ? "dark" : "light";
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

  applyTheme();
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
  const hasOpenPanel =
    winPanel.classList.contains("is-visible") || legendsPanel?.classList.contains("is-visible");

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
  const link = document.createElement("a");
  link.href = "https://federiconavarrete.com";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Federico Navarrete";

  gameFooter.replaceChildren();
  const parts = text.split("{author}");
  gameFooter.append(document.createTextNode(parts[0] || ""), link);

  if (parts.length > 1) {
    gameFooter.append(document.createTextNode(parts.slice(1).join("{author}")));
  }
}

function applyUiCopy() {
  document.title = memoryGame.title || document.title;
  document.querySelector("meta[name='description']").content = memoryGame.subtitle || "";
  document.querySelector("meta[property='og:title']").content = memoryGame.title || "";
  document.querySelector("meta[property='og:description']").content = memoryGame.subtitle || "";
  document.querySelector("meta[property='og:url']").content = getShareUrl();
  document.querySelector("meta[property='twitter:title']").content = memoryGame.title || "";
  document.querySelector("meta[property='twitter:description']").content = memoryGame.subtitle || "";
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
  setElementText(topViewLegendsButton, memoryGame.viewLegends || "View all legends");
  playAgainButton.textContent = memoryGame.playAgain || "";
  setElementText(viewLegendsButton, memoryGame.viewLegends || "View all legends");
  winShareButton.textContent = memoryGame.share || "";
  closeWinButton.setAttribute("aria-label", memoryGame.close || "Close");
  closeLegendsButton?.setAttribute("aria-label", memoryGame.close || "Close");
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
    "olomegaLagoonSiren|xana": "waves",
    "aishaKandisha|siguanaba": "masks",
  };

  return pairIcons[pairKey] || "masks";
}

function getPairCount() {
  return activePairs.length || (Array.isArray(memoryGame.pairs) ? memoryGame.pairs.length : 0);
}

function chooseActivePairs() {
  const pairs = Array.isArray(memoryGame.pairs) ? memoryGame.pairs.map((pair) => ({ ...pair })) : [];
  const variants = Array.isArray(memoryGame.rarePairs) ? memoryGame.rarePairs : [];
  const roll = Math.random();
  let threshold = 0;
  const selectedVariant = variants.find((variant) => {
    threshold += Number(variant.chance) || 0;
    return roll < threshold;
  });

  if (!selectedVariant?.pair || !pairs.length) {
    return pairs;
  }

  const replacement = { ...selectedVariant.pair };
  const targetIndex =
    selectedVariant.replaceSource &&
    pairs.findIndex((pair) => pair.source === selectedVariant.replaceSource);

  if (Number.isInteger(targetIndex) && targetIndex >= 0) {
    pairs[targetIndex] = replacement;
    return pairs;
  }

  pairs[Math.floor(Math.random() * pairs.length)] = replacement;
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
          <span class="character-name">${character.name}</span>
        </span>
        <span class="character-origin">${getOriginLabel(character.side)}</span>
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

function renderLegendsList() {
  const pairs = activePairs.length ? activePairs : chooseActivePairs();
  const rows = pairs.map((pair) => {
    const { source, mirror, insightTitle, insight } = pair;
    const row = document.createElement("section");
    const icon = pair.icon || getPairIcon(source, mirror);
    row.className = "legend-row";
    const category = document.createElement("header");
    category.className = "legend-category";
    category.innerHTML = `
      <strong>${insightTitle || ""}</strong>
      <span>${insight || ""}</span>
      <span class="legend-mark">
        <i class="character-icon icon-${icon}" aria-hidden="true"></i>
      </span>
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

function hideLegendToast() {
  legendToast.hidden = true;
  if (toastTimer) {
    window.clearTimeout(toastTimer);
    toastTimer = null;
  }
}

function showToast(title, text) {
  if (!text) {
    hideLegendToast();
    return;
  }

  legendToastTitle.textContent = title || "";
  legendToastText.textContent = text;
  legendToast.hidden = false;

  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(hideLegendToast, 5200);
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
  winPanel.classList.remove("is-visible");
  legendsPanel?.classList.remove("is-visible");
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

async function runIntroTutorial() {
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
  showToast(memoryGame.hint || "Hint", memoryGame.hintText || "Pay attention to the icons.");

  await wait(520);
  cards[0]?.classList.add("is-flipped");
  cards[0]?.setAttribute("aria-label", tutorialCards[0].name);
  await wait(780);
  cards[1]?.classList.add("is-flipped");
  cards[1]?.setAttribute("aria-label", tutorialCards[1].name);
  await wait(520);
  cards.forEach((card) => card.classList.add("is-matched"));
  await wait(1500);

  setIntroSeen();
  introRunning = false;
  lockBoard = false;
  newGame();
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

newGameButton.addEventListener("click", newGame);
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
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLanguageMenu();
  }
});
window.addEventListener("beforeunload", warnBeforeLeaving);
shareButton.addEventListener("click", () => {
  shareGame(shareButton).catch(() => {});
});
hintButton.addEventListener("click", () => {
  showToast(memoryGame.hint || "Hint", memoryGame.hintText || "Pay attention to the icons.");
});
winShareButton.addEventListener("click", () => {
  shareGame(winShareButton).catch(() => {});
});
closeWinButton.addEventListener("click", () => {
  winPanel.classList.remove("is-visible");
  syncModalScrollLock();
});
viewLegendsButton?.addEventListener("click", openLegendsPanel);
topViewLegendsButton?.addEventListener("click", openLegendsPanel);
closeLegendsButton?.addEventListener("click", () => {
  legendsPanel?.classList.remove("is-visible");
  syncModalScrollLock();
});
legendToastClose.addEventListener("click", hideLegendToast);
playAgainButton.addEventListener("click", newGame);
applyTheme();
document.documentElement.dataset.embed = String(isEmbedded);
window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener("change", applyTheme);
loadTranslations().finally(() => {
  applyUiCopy();
  startGame();
});
