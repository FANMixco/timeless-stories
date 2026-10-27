import { createGameAudio } from "./memory-game/audio.mjs";
import { createProgressStore } from "./memory-game/storage.mjs";
import { createProgressView } from "./memory-game/progress.mjs";
import { gameModes, createRoundClock, selectActivePairs, getDefeatReason, getModeStatus, normalizeElapsedSeconds } from "./memory-game/rules.mjs";
import { createModalNavigation } from "./memory-game/dialogs.mjs";
import { createHomeScreen } from "./memory-game/home.mjs";

const supportedLanguages = ["en", "es", "fr", "zh"];
const languageStorageKey = "timelessStoriesOfficialLanguage";
const themeStorageKey = "timelessStoriesColorMode";
const introStorageKey = "timelessMemoryIntroSeen";
const collectionStorageKey = "timelessMemoryCollection";
const soundStorageKey = "timelessMemorySoundEnabled";
const matchToastsStorageKey = "timelessMemoryMatchToastsEnabled";
const tipsStorageKey = "timelessMemoryTipsEnabled";
const shortNamesStorageKey = "timelessMemoryShortNamesEnabled";
const modeStorageKey = "timelessMemoryMode";
const challengeStatsStorageKey = "timelessMemoryChallenges:v1";
const recordsStorageKey = "timelessMemoryRecords:v1";
const progressStore = createProgressStore({ getStorage: () => window.localStorage,
  recordsStorageKey, challengeStatsStorageKey, modeStorageKey, gameModes });
let gameMode = readGameMode();
let pendingHome = false;
let gameDefeated = false;
let attemptStarted = false;
let attemptFinished = false;
let mismatchTimer = null;
let matchToastsEnabled = readMatchToastsEnabled();
let tipsEnabled = readTipsEnabled();
let shortNamesEnabled = readShortNamesEnabled();
const soundEffectCreators = ["ALEXIS_GAMING_CAM", "freesound_community", "Yodguard", "Game Studio"];
let soundEnabled = readSoundEnabled();
const audio = createGameAudio({
  getAudioContext: () => window.AudioContext || window.webkitAudioContext,
  fetch: (...args) => fetch(...args),
  isEnabled: () => soundEnabled,
  isHidden: () => document.visibilityState === "hidden",
});
function prepareGameAudio() { audio.prepare(); }
function playGameSound(name, rate) { return audio.play(name, rate); }
function stopGameSounds() { audio.stopAll(); }
const achievementsStorageKey = "timelessMemoryAchievements";
let completedPerformance = null;
const achievementDefinitions = [
  { id: "legendary", icon: "trophy", color: "#c49118" },
  { id: "victory", icon: "star-full", color: "#a57a10" },
  { id: "lightning", icon: "power", color: "#1484bd" },
  { id: "scenes", icon: "video-camera", color: "#9c64cf" },
  { id: "directorsMaster", icon: "movie-filter", color: "#9c64cf" },
  { id: "golden", icon: "mirror", color: "#c49118" },
  { id: "goldenCollector", icon: "gold", color: "#c49118" },
  { id: "master", icon: "crown", color: "#c45f87" },
];
const supportedThemes = ["system", "light", "dark"];
const previewRewardThresholdSeconds = 30;
const mismatchFlipBackDelayMs = 1200;
const i18nCacheVersion = "__MEMORY_ASSET_VERSION__";
let linkRegistry = null;
let localizedLinks = null;
let selectionRules = null;
const board = document.getElementById("board");
const movesValue = document.getElementById("movesValue");
const matchesValue = document.getElementById("matchesValue");
const timeValue = document.getElementById("timeValue");
const matchInsight = document.getElementById("matchInsight");
const matchInsightTitle = document.getElementById("matchInsightTitle");
const matchInsightText = document.getElementById("matchInsightText");
const selectedStory = document.getElementById("selectedStory");
const selectedStoryTitle = document.getElementById("selectedStoryTitle");
const selectedStoryText = document.getElementById("selectedStoryText");
const legendToast = document.getElementById("legendToast");
const legendToastTitle = document.getElementById("legendToastTitle");
const legendToastText = document.getElementById("legendToastText");
const legendToastClose = document.getElementById("legendToastClose");
const winPanel = document.getElementById("winPanel");
const gameOverPanel = document.getElementById("gameOverPanel");
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
const restartPanel = document.getElementById("restartPanel");
const cancelRestartButton = document.getElementById("cancelRestartButton");
let aboutReturnFocus = null;
const newGameButton = document.getElementById("newGameButton");
const languageControl = document.getElementById("languageControl");
const languageButton = document.getElementById("languageButton");
const languageMenu = document.getElementById("languageMenu");
const settingsButton = document.getElementById("settingsButton");
const settingsPanel = document.getElementById("settingsPanel");
const closeSettingsButton = document.getElementById("closeSettingsButton");
const soundToggle = document.getElementById("soundToggle");
const matchToastsToggle = document.getElementById("matchToastsToggle");
const tipsToggle = document.getElementById("tipsToggle");
const shortNamesToggle = document.getElementById("shortNamesToggle");
const shareButton = document.getElementById("shareButton");
const hintButton = document.getElementById("hintButton");
const topViewLegendsButton = document.getElementById("topViewLegendsButton");
const collectionButton = document.getElementById("collectionButton");
const collectionPanel = document.getElementById("collectionPanel");
const closeCollectionButton = document.getElementById("closeCollectionButton");
const achievementsButton = document.getElementById("achievementsButton");
const achievementsPanel = document.getElementById("achievementsPanel");
const achievementPanel = document.getElementById("achievementPanel");
const closeAchievementsButton = document.getElementById("closeAchievementsButton");
const closeAchievementButton = document.getElementById("closeAchievementButton");
let achievements = readAchievements();
let achievementQueue = [];
let currentAchievement = null;
let achievementReturnFocus = null;
let discoveries = readDiscoveries();
let collectionDetailTrigger = null;
let collectionRarityTrigger = null;
const playAgainButton = document.getElementById("playAgainButton");
const winRecordsButton = document.getElementById("winRecordsButton");
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
if (isEmbedded) gameMode = "classic";
let memoryGame = { pairs: [] };

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matches = 0;
let elapsedSeconds = 0;
let toastTimer = null;
let gameCompleted = false;
let introRunning = false;
let hintPressCount = 0;
let tutorialRunId = 0;
let translations = null;
let deck = [];
let activePairs = [];
let currentLanguage = "en";
let pendingLanguage = null;
let pendingDataReset = false;
let confirmedLanguageReload = false;
let modalDetailPair = null;
let modalRarity = null;
const modalPanels = [winPanel, gameOverPanel, collectionPanel, legendsPanel, rarityPanel, aboutPanel, restartPanel, achievementsPanel, achievementPanel, settingsPanel];

const homeScreen = createHomeScreen({ document, modes: gameModes,
  reduceMotion: () => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches),
  onChoose: applyGameMode,
  onSettings: openSettings, onRecords: openAchievements, onCollection: openCollection, onReturn: requestHome
});
homeScreen.bind();

function showHome() {
  pendingHome = false;
  newGame();
  homeScreen.show(gameMode);
  syncModalHistory();
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
}

function requestHome() {
  if (isEmbedded) return;
  if (!hasGameInProgress()) { showHome(); return; }
  pendingLanguage = null;
  pendingDataReset = false;
  pendingHome = true;
  renderRestartConfirmation();
  restartPanel.classList.add("is-visible");
  cancelRestartButton.focus({ preventScroll: true });
  syncModalScrollLock();
}

const progressView = createProgressView({ document,
  getState: () => ({ memoryGame, achievements, completedPerformance, currentLanguage }),
  readPersonalRecords, readChallengeStats, getPairCount, getRecordConfiguration, formatTime,
  setElementText, setElementHidden, achievementDefinitions, onTabChange: syncModalHistory,
});
const roundClock = createRoundClock({ now: () => Date.now(),
  schedule: (callback, delay) => window.setInterval(callback, delay),
  cancel: id => window.clearInterval(id),
  onTick(seconds) {
    elapsedSeconds = normalizeElapsedSeconds(gameMode, seconds);
    updateStatus();
    endChallengeIfNeeded(false);
  },
});
const modalNavigation = createModalNavigation({ history: !isEmbedded ? window.history : null,
  getSnapshot: getModalSnapshot, restoreSnapshot: restoreModalSnapshot,
  onBackToHome: requestHome,
});

function getModalSnapshot() {
  return {
    screen: homeScreen.visible ? "home" : "game",
    panels: modalPanels.filter(panel => panel?.classList.contains("is-visible")).map(panel => panel.id),
    detail: modalDetailPair,
    rarity: modalRarity,
    achievement: currentAchievement,
    language: pendingLanguage,
    reset: pendingDataReset,
    home: pendingHome,
    progressTab: progressView.tab
  };
}


function syncModalHistory() { modalNavigation.sync(); }
function restoreModalSnapshot(snapshot) {
  if (snapshot.screen === "home" && !homeScreen.visible) showHome();
  else if (snapshot.screen === "game" && homeScreen.visible) homeScreen.hide();
  const visible = new Set(snapshot.panels.filter(id => {
    // Forward must not resurrect a previous round's completion dialogs.
    if (id === "winPanel" || (id === "legendsPanel" && !snapshot.detail)) return gameCompleted;
    if (id === "gameOverPanel") return gameDefeated;
    if (id === "restartPanel") return snapshot.reset === true || hasGameInProgress();
    if (id === "achievementPanel") return Boolean(currentAchievement && snapshot.achievement === currentAchievement);
    return true;
  }));
  if (!visible.has("rarityPanel")) closeRarityPanel();
  if (!visible.has("legendsPanel")) closeLegendsPanel();
  if (!visible.has("collectionPanel") && collectionPanel.classList.contains("is-visible")) closeCollection();
  if (!visible.has("aboutPanel") && aboutPanel.classList.contains("is-visible")) closeAboutPanel();
  if (!visible.has("restartPanel") && restartPanel.classList.contains("is-visible")) closeRestartPanel();
  if (!visible.has("achievementsPanel") && achievementsPanel.classList.contains("is-visible")) closeAchievements();
  if (!visible.has("settingsPanel") && settingsPanel.classList.contains("is-visible")) closeSettings();
  modalPanels.forEach(panel => panel?.classList.toggle("is-visible", visible.has(panel.id)));
  pendingLanguage = visible.has("restartPanel") && supportedLanguages.includes(snapshot.language) ? snapshot.language : null;
  pendingDataReset = visible.has("restartPanel") && snapshot.reset === true;
  pendingHome = visible.has("restartPanel") && snapshot.home === true;
  renderRestartConfirmation();
  if (currentAchievement && !visible.has("achievementPanel")) {
    currentAchievement = null;
    showNextAchievement();
  }
  if (visible.has("achievementsPanel")) {
    renderAchievements();
    selectProgressTab(snapshot.progressTab);
  }
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
  if (achievementPanel.classList.contains("is-visible")) closeAchievementButton.focus();
  else if (visible.has("restartPanel")) cancelRestartButton.focus();
  else if (visible.has("settingsPanel")) closeSettingsButton.focus();
  else if (visible.has("achievementsPanel")) closeAchievementsButton.focus();
  else if (visible.has("aboutPanel")) closeAboutButton.focus();
  else if (visible.has("rarityPanel")) closeRarityButton.focus();
  else if (visible.has("legendsPanel")) closeLegendsButton.focus();
  else if (visible.has("collectionPanel")) closeCollectionButton.focus();
  else if (visible.has("winPanel")) closeWinButton.focus();
  else if (visible.has("gameOverPanel")) document.getElementById("tryAgainButton").focus();
  syncModalScrollLock();
  // Back can advance the notification queue; record the newly active award.
  syncModalScrollLock();
  if (!currentAchievement && achievementReturnFocus) {
    if (!modalPanels.some(panel => panel.classList.contains("is-visible"))) achievementReturnFocus.focus?.({ preventScroll: true });
    achievementReturnFocus = null;
  }
}

window.addEventListener("popstate", event => modalNavigation.handlePopState(event));

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

function readAchievements() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(achievementsStorageKey));
    return Object.fromEntries(achievementDefinitions
      .filter(({ id }) => typeof saved?.[id] === "string" && Number.isFinite(Date.parse(saved[id])))
      .map(({ id }) => [id, saved[id]]));
  } catch { return {}; }
}

function evaluateAchievements(completed = false) {
  achievements = { ...readAchievements(), ...achievements };
  const catalogue = getMirrorCatalogue();
  const found = catalogue.filter(pair => discoveries.has(getMirrorId(pair)));
  const regularLegends = catalogue.filter(pair => !pair.rarity);
  const directorsCut = catalogue.filter(pair => pair.rarity === "rare");
  const goldenMirrors = catalogue.filter(pair => pair.rarity === "ultra-rare");
  const conditions = {
    legendary: regularLegends.length > 0 && regularLegends.every(pair => discoveries.has(getMirrorId(pair))),
    victory: completed || found.length > 0,
    lightning: completed && elapsedSeconds < 30,
    golden: found.some(pair => pair.rarity === "ultra-rare"),
    scenes: found.some(pair => pair.rarity === "rare"),
    directorsMaster: directorsCut.length > 0 && directorsCut.every(pair => discoveries.has(getMirrorId(pair))),
    goldenCollector: goldenMirrors.length > 0 && goldenMirrors.every(pair => discoveries.has(getMirrorId(pair))),
    master: catalogue.length > 0 && found.length === catalogue.length,
  };
  for (const { id } of achievementDefinitions) {
    if (!conditions[id] || achievements[id]) continue;
    achievements[id] = new Date().toISOString();
    achievementQueue.push(id);
  }
  try { window.localStorage.setItem(achievementsStorageKey, JSON.stringify(achievements)); } catch {}
  updateAchievementsVisibility();
}

// Records are independent of achievements and discoveries. Only completed boards
// enter this store; previous results and all-time bests serve different comparisons.


function readPersonalRecords() { return progressStore.readPersonalRecords(); }
function getRecordConfiguration(pairCount = getPairCount()) {
  // This legacy store remains exclusively Classic; challenges have their own store.
  return `standard:${pairCount}`;
}

function readGameMode() { return progressStore.readGameMode(); }
function readChallengeStats() { return progressStore.readChallengeStats(); }

function beginAttempt() {
  if (attemptStarted) return;
  attemptStarted = true;
  if (!gameModes[gameMode].record) return;
  progressStore.beginChallenge(gameMode);
  updateAchievementsVisibility();
}
function finishChallenge(won) {
  if (!gameModes[gameMode].record || !attemptStarted || attemptFinished) return;
  attemptFinished = true;
  completedPerformance = progressStore.completeChallenge(gameMode, won, { time: elapsedSeconds, moves });
}
function updateAchievementsVisibility() {
  const stats = readChallengeStats();
  const hasProgress = achievementDefinitions.some(({ id }) => achievements[id]) ||
    Object.keys(gameModes).some(mode => gameModes[mode].record && stats[mode].attempts > 0);
  setElementHidden(achievementsButton, !hasProgress);
}


function renderChallengeStats() { progressView.renderChallenges(); }
function renderGameModes() {
  setElementText(document.getElementById("activeGameMode"), memoryGame.modes[gameMode].name);
  setElementHidden(document.getElementById("activeGameMode"), !gameModes[gameMode].record);
}

function applyGameMode(mode) {
  if (!Object.hasOwn(gameModes, mode)) return;
  gameMode = mode;
  try { window.localStorage.setItem(modeStorageKey, mode); } catch {}
  homeScreen.hide();
  renderGameModes();
  startGame();
  newGameButton.focus({ preventScroll: true });
}

function endChallengeIfNeeded(attemptResolved) {
  if (gameCompleted || gameDefeated) return;
  const reason = getDefeatReason({ mode: gameMode, seconds: elapsedSeconds, moves, matches,
    pairCount: getPairCount(), attemptResolved });
  if (reason) endGame(reason);
}

function endGame(reason) {
  if (gameCompleted || gameDefeated || introRunning) return;
  gameDefeated = true;
  lockBoard = true;
  stopTimer();
  window.clearTimeout(mismatchTimer);
  mismatchTimer = null;
  finishChallenge(false);
  stopGameSounds();
  playGameSound("gameover");
  hideLegendToast();
  setElementHidden(hintButton, true);
  const copy = memoryGame.modes;
  setElementText(document.getElementById("gameOverTitle"), copy.gameOver);
  setElementText(document.getElementById("gameOverReason"), copy[reason]);
  setElementText(document.getElementById("gameOverSummary"), copy.summary
    .replace("{matches}", matches).replace("{pairs}", getPairCount()).replace("{moves}", moves));
  gameOverPanel.classList.add("is-visible");
  syncModalScrollLock();
  if (!gameOverPanel.inert) document.getElementById("tryAgainButton").focus({ preventScroll: true });
  if (achievementsPanel.classList.contains("is-visible")) renderChallengeStats();
}

function saveCompletedPerformance() {
  if (gameModes[gameMode].record) return completedPerformance;
  if (completedPerformance || !gameCompleted || matches !== getPairCount()) return completedPerformance;
  completedPerformance = progressStore.completeClassic({ pairCount: getPairCount(), time: elapsedSeconds, moves });
  return completedPerformance;
}
function renderPersonalRecords() { progressView.renderRecords(); }

function renderCompletedPerformance() { progressView.renderCompleted(); }
function renderAchievements() { progressView.render(); }
function selectProgressTab(tab, focus) { progressView.selectTab(tab, focus); }
function openAchievements() {
  renderAchievements();
  selectProgressTab("records");
  achievementsPanel.classList.add("is-visible");
  achievementsPanel.scrollTop = 0;
  achievementsPanel.querySelector(".legends-card").scrollTop = 0;
  closeAchievementsButton.focus();
  syncModalScrollLock();
}

function closeAchievements() {
  achievementsPanel.classList.remove("is-visible");
  syncModalScrollLock();
  (gameOverPanel.classList.contains("is-visible") ? document.getElementById("gameOverRecordsButton")
    : winPanel.classList.contains("is-visible") ? winRecordsButton : homeScreen.visible ? document.getElementById("homeRecords") : achievementsButton).focus({ preventScroll: true });
}

function showNextAchievement() {
  if (currentAchievement || !achievementQueue.length || introRunning) return;
  if (!achievementReturnFocus) achievementReturnFocus = document.activeElement;
  currentAchievement = achievementQueue.shift();
  const definition = achievementDefinitions.find(item => item.id === currentAchievement);
  const copy = memoryGame.achievements;
  const legendary = currentAchievement === "legendary";
  achievementPanel.style.setProperty("--achievement-color", definition.color);
  achievementPanel.classList.toggle("is-legendary", legendary);
  document.getElementById("achievementIcon").className = `achievement-icon icon-${definition.icon}`;
  setElementText(document.getElementById("achievementTitle"), legendary ? copy.legendaryTitle : copy.notification);
  setElementText(document.getElementById("achievementName"), copy.items[currentAchievement].name);
  setElementHidden(document.getElementById("achievementName"), legendary);
  setElementText(document.getElementById("achievementDescription"), legendary ? copy.legendaryDescription : copy.items[currentAchievement].description);
  setElementText(document.getElementById("achievementCelebration"), legendary ? copy.celebration : copy.items[currentAchievement].bonus || "");
  setElementText(document.getElementById("achievementCompletion"), legendary ? copy.completion : "");
  setElementText(document.getElementById("achievementMotto"), legendary ? copy.motto : "");
  const explore = document.getElementById("achievementExplore");
  explore.textContent = copy.explore;
  setElementHidden(explore, !legendary);
  achievementPanel.classList.add("is-visible");
  playGameSound("achievement");
  // Restart the brief celebration for each queued achievement.
  const card = achievementPanel.querySelector?.(".achievement-card");
  card?.getAnimations?.().forEach(animation => { animation.cancel(); animation.play(); });
  closeAchievementButton.focus();
  syncModalScrollLock();
}

function closeAchievement() {
  achievementPanel.classList.remove("is-visible");
  currentAchievement = null;
  if (achievementQueue.length) showNextAchievement();
  else {
    syncModalScrollLock();
    if (winPanel.classList.contains("is-visible")) closeWinButton.focus();
    else achievementReturnFocus?.focus({ preventScroll: true });
    achievementReturnFocus = null;
  }
}

function getMirrorCatalogue() {
  const pairs = [...(memoryGame.pairs || []), ...(memoryGame.rarePairs || []).map((item) => item.pair)];
  return [...new Map(pairs.filter(Boolean).map((pair) => [getMirrorId(pair), pair])).values()];
}

function getPairComparison(pair) {
  return memoryGame.comparisons?.[pair.comparison] || {};
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
    { rarity: "ultra-rare", title: copy.other || "Online Exclusive Mirrors" },
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
      if (discovered) card.dataset.category = pair.comparison;
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
      name.textContent = discovered ? getPairComparison(pair).title || "" : "???";
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
  submit.textContent = copy.submit || "Submit a Mirror";
  const formKey = currentLanguage === "es" ? "spanishContactForm" : "englishContactForm";
  submit.href = linkRegistry?.shared?.contact?.[formKey] || "";
  setElementHidden(submit, !submit.getAttribute("href"));
}

function openCollection() {
  renderCollection();
  collectionPanel.classList.add("is-visible");
  closeCollectionButton.focus();
  syncModalScrollLock();
}

function closeCollection() {
  collectionPanel.classList.remove("is-visible");
  (homeScreen.visible ? document.getElementById("homeCollection") : collectionButton).focus({ preventScroll: true });
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
  for (const mode of supportedThemes) document.getElementById(`theme-${mode}`).checked = mode === selectedTheme;
}

function setTheme(theme) {
  const nextTheme = resolveTheme(theme);
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

async function loadGameLanguage(language) {
  const response = await fetch(`js/i18n/memory-game/lang-${language}.min.json?v=${i18nCacheVersion}`);
  if (response.ok === false) throw new Error(`Unable to load game language: ${language}`);
  const data = await response.json();
  const game = data.translations?.memoryGame;
  if (!game?.settings?.title || !game.settings.sounds || !game.settings.resetConfirmation || !game.home?.chooseMode || !game.home.confirmReturn || !game.records?.title || !game.modes?.title || !game.progress?.title || !game.progress.records || !game.about?.musicCredit || !achievementDefinitions.every(({ id }) => game.achievements?.items?.[id])) {
    throw new Error(`Incomplete game language: ${language}`);
  }
  const pairs = [...(game.pairs || []), ...(game.rarePairs || []).map(variant => variant.pair)];
  if (!pairs.every(pair => game.comparisons?.[pair.comparison]?.title && game.comparisons[pair.comparison].description)) {
    throw new Error(`Missing comparison translation: ${language}`);
  }
  return { language, translations: data.translations };
}

async function loadTranslations() {
  const language = getLanguage();
  const [gameData, links, rules] = await Promise.all([
    loadGameLanguage(language).catch(error => {
      if (language === "en") throw error;
      return loadGameLanguage("en");
    }),
    fetch("js/data/links.min.json").then(response => response.json()).catch(() => null),
    loadSelectionRules(),
  ]);
  currentLanguage = gameData.language;
  document.documentElement.lang = currentLanguage;
  translations = gameData.translations;
  memoryGame = translations.memoryGame;
  selectionRules = rules;
  linkRegistry = links;
  localizedLinks = mergeLinkConfig(
    links?.localized?.default || {},
    links?.localized?.[currentLanguage],
  );
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
  const achievementVisible = achievementPanel.classList.contains("is-visible");
  for (const panel of modalPanels) {
    if (panel !== achievementPanel && panel !== collectionPanel) panel.inert = achievementVisible;
  }
  winPanel.inert = achievementVisible || achievementsPanel.classList.contains("is-visible");
  gameOverPanel.inert = achievementVisible || [settingsPanel, restartPanel, achievementsPanel, aboutPanel, collectionPanel, legendsPanel, rarityPanel]
    .some(panel => panel.classList.contains("is-visible"));
  if (!collectionDetailTrigger && !collectionRarityTrigger) collectionPanel.inert = achievementVisible;
  const restartVisible = restartPanel.classList.contains("is-visible");
  settingsPanel.inert = achievementVisible || restartVisible;
  settingsPanel.setAttribute("aria-modal", String(!restartVisible));
  const backgroundCovered = achievementVisible || gameOverPanel.classList.contains("is-visible") || settingsPanel.classList.contains("is-visible") || achievementsPanel.classList.contains("is-visible") || aboutPanel.classList.contains("is-visible") || restartPanel.classList.contains("is-visible");
  if (gameLayout) gameLayout.inert = backgroundCovered;
  if (gameFooter) gameFooter.inert = backgroundCovered;

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

function readSoundEnabled() {
  try { return window.localStorage.getItem(soundStorageKey) !== "false"; }
  catch { return true; }
}

function readMatchToastsEnabled() {
  try { return window.localStorage.getItem(matchToastsStorageKey) !== "false"; }
  catch { return true; }
}

function applyMatchToastsPreference() {
  matchToastsToggle.checked = matchToastsEnabled;
  if (!matchToastsEnabled && !gameCompleted &&
      window.matchMedia?.("(max-width: 640px)")?.matches &&
      legendToast.dataset.comparison === "true") {
    hideLegendToast();
  }
}

function setMatchToastsEnabled(enabled) {
  matchToastsEnabled = enabled;
  applyMatchToastsPreference();
  try { window.localStorage.setItem(matchToastsStorageKey, String(enabled)); } catch {}
}

function readTipsEnabled() {
  try { return window.localStorage.getItem(tipsStorageKey) !== "false"; }
  catch { return true; }
}

function setTipsEnabled(enabled) {
  tipsEnabled = enabled;
  tipsToggle.checked = enabled;
  hintPressCount = 0;
  try { window.localStorage.setItem(tipsStorageKey, String(enabled)); } catch {}
  setElementHidden(hintButton, gameCompleted || !enabled);
}

function readShortNamesEnabled() {
  try { return window.localStorage.getItem(shortNamesStorageKey) === "true"; }
  catch { return false; }
}

function applyShortNamesPreference() {
  document.documentElement.classList.toggle("use-short-card-names", shortNamesEnabled);
  shortNamesToggle.checked = shortNamesEnabled;
}

function setShortNamesEnabled(enabled) {
  shortNamesEnabled = enabled;
  applyShortNamesPreference();
  try { window.localStorage.setItem(shortNamesStorageKey, String(enabled)); } catch {}
}

function setSoundEnabled(enabled) {
  soundEnabled = enabled;
  soundToggle.checked = enabled;
  try { window.localStorage.setItem(soundStorageKey, String(enabled)); } catch {}
  if (enabled) prepareGameAudio();
  else stopGameSounds();
}

function openSettings() {
  renderGameModes();
  applyMatchToastsPreference();
  applyShortNamesPreference();
  closeLanguageMenu();
  setElementHidden(document.getElementById("resetGameError"), true);
  settingsPanel.classList.add("is-visible");
  soundToggle.checked = soundEnabled;
  tipsToggle.checked = tipsEnabled;
  closeSettingsButton.focus();
  syncModalScrollLock();
}

function reloadAfterDataReset() {
  // Other open game tabs must discard in-memory progress too, or a later win
  // could restore achievements and discoveries that the player just erased.
  stopTimer();
  stopGameSounds();
  window.removeEventListener("beforeunload", warnBeforeLeaving);
  window.location.reload();
}

function openDataResetConfirmation() {
  pendingLanguage = null;
  pendingDataReset = true;
  renderRestartConfirmation();
  restartPanel.classList.add("is-visible");
  cancelRestartButton.focus({ preventScroll: true });
  syncModalScrollLock();
}

function resetGameData() {
  if (!pendingDataReset || !restartPanel.classList.contains("is-visible")) return;
  try {
    window.sessionStorage.clear();
    window.localStorage.clear();
  } catch {
    closeRestartPanel();
    setElementText(document.getElementById("resetGameError"), memoryGame.settings.resetError);
    setElementHidden(document.getElementById("resetGameError"), false);
    return;
  }
  reloadAfterDataReset();
}

function closeSettings() {
  closeLanguageMenu();
  settingsPanel.classList.remove("is-visible");
  syncModalScrollLock();
  (gameOverPanel.classList.contains("is-visible") ? document.getElementById("tryAgainButton") : homeScreen.visible ? document.getElementById("homeSettings") : settingsButton).focus({ preventScroll: true });
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

  closeLanguageMenu();
  if (hasGameInProgress()) {
    pendingDataReset = false;
    pendingLanguage = language;
    renderRestartConfirmation();
    restartPanel.classList.add("is-visible");
    cancelRestartButton.focus({ preventScroll: true });
    syncModalScrollLock();
    return;
  }
  applyLanguageChange(language);
}

function applyLanguageChange(language) {
  // Persist only after explicit confirmation, and avoid asking again in the
  // browser's beforeunload prompt for this already-approved reload.
  confirmedLanguageReload = true;
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
  document.getElementById("aboutBookLink").href = bookUrl;
  setElementText(document.getElementById("aboutBookLink"), copy.amazon || "View on Amazon");
  document.getElementById("aboutWebsites").setAttribute("aria-label", copy.websites || "Official websites");
  setElementText(document.getElementById("aboutStoriesWebsite"), copy.storiesWebsite || "Timeless Stories");
  setElementText(document.getElementById("aboutSoundCreditsTitle"), copy.soundCreditsTitle);
  const credits = soundEffectCreators.map(author => {
    const item = document.createElement("li");
    item.textContent = copy.soundCredit.replace("{author}", author);
    return item;
  });
  document.getElementById("aboutSoundCreditsList").replaceChildren(...credits);
  const musicCredit = document.createElement("li");
  const authorLink = document.createElement("a");
  authorLink.textContent = "ejah_music";
  authorLink.href = "https://pixabay.com/users/ejah_music-32986949/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=422478";
  const pixabayLink = document.createElement("a");
  pixabayLink.textContent = "Pixabay";
  pixabayLink.href = "https://pixabay.com/music//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=422478";
  for (const link of [authorLink, pixabayLink]) { link.target = "_blank"; link.rel = "noopener noreferrer"; }
  for (const part of copy.musicCredit.split(/(\{author\}|\{source\})/)) {
    musicCredit.append(part === "{author}" ? authorLink : part === "{source}" ? pixabayLink : document.createTextNode(part));
  }
  document.getElementById("aboutSoundCreditsList").append(musicCredit);
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
  setElementHidden(document.getElementById("homeButton"), isEmbedded);
  homeScreen.render(memoryGame);
  renderGameModes();
  setElementText(document.getElementById("tryAgainButton"), memoryGame.modes.tryAgain);
  setElementText(document.getElementById("gameOverRecordsButton"), memoryGame.records.viewRecords);
  document.getElementById("closeGameOverButton").setAttribute("aria-label", memoryGame.close);
  applyShortNamesPreference();
  setElementText(document.getElementById("winRecordsLabel"), memoryGame.records.viewRecords);
  const settingsCopy = memoryGame.settings;
  settingsButton.setAttribute("aria-label", settingsCopy.title);
  settingsButton.title = settingsCopy.title;
  setElementText(document.getElementById("settingsTitle"), settingsCopy.title);
  setElementText(document.getElementById("settingsLanguageLabel"), memoryGame.language);
  setElementText(document.getElementById("settingsSoundLabel"), settingsCopy.sounds);
  setElementText(document.getElementById("settingsTipsLabel"), settingsCopy.tips);
  setElementText(document.getElementById("settingsMatchToastsLabel"), settingsCopy.matchToasts);
  applyMatchToastsPreference();
  setElementText(document.getElementById("settingsShortNamesLabel"), settingsCopy.shortNames);
  setElementText(document.getElementById("resetGameButton"), settingsCopy.reset);
  setElementText(document.getElementById("resetGameWarning"), settingsCopy.resetWarning);
  setElementText(document.getElementById("settingsThemeLabel"), memoryGame.theme);
  setElementText(document.getElementById("themeSystemLabel"), settingsCopy.system);
  setElementText(document.getElementById("themeLightLabel"), settingsCopy.light);
  setElementText(document.getElementById("themeDarkLabel"), settingsCopy.dark);
  closeSettingsButton.setAttribute("aria-label", memoryGame.close || "Close");
  soundToggle.checked = soundEnabled;
  tipsToggle.checked = tipsEnabled;
  setElementHidden(hintButton, gameCompleted || !tipsEnabled);
  setActionButtonContent(achievementsButton, memoryGame.progress.title, "icon-trophy");
  closeAchievementsButton.setAttribute("aria-label", memoryGame.close || "Close");
  closeAchievementButton.setAttribute("aria-label", memoryGame.close || "Close");
  renderAbout();
  renderRestartConfirmation();
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
  setElementText(document.getElementById("newGameLabel"), memoryGame.newGame || "");
  newGameButton.setAttribute("aria-label", memoryGame.newGame || "");
  newGameButton.title = memoryGame.newGame || "";
  setActionButtonContent(languageButton, memoryGame.language || "Language", "icon-translate");
  const selectedLanguage = document.createElement("span");
  selectedLanguage.textContent = languageLabels[currentLanguage];
  languageButton.append(selectedLanguage);
  renderLanguageMenu();
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
    australia: translations?.country16 || "",
    germany: translations?.country17 || "",
    uk: translations?.country18 || "",
    china: translations?.country19 || "",
    canada: translations?.country20 || "",
    japan: translations?.country21 || "",
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

async function loadSelectionRules() {
  const response = await fetch(`js/data/memory-game.min.json?v=${i18nCacheVersion}`);
  if (response.ok === false) throw new Error("Unable to load Memory Game selection rules");
  const rules = await response.json();
  const chances = [rules.normalChances?.rare, rules.normalChances?.["ultra-rare"], rules.bonusRoundChance, rules.bonusDirectorChance, rules.directorUpgradeChance];
  if (!chances.every(value => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1) || chances[0] + chances[1] > 1) {
    throw new Error("Invalid Memory Game selection probabilities");
  }
  return rules;
}

function chooseActivePairs() {
  // Saved progress from other tabs also qualifies for Director's Cut upgrades.
  discoveries = new Set([...readDiscoveries(), ...discoveries]);
  return selectActivePairs({ memoryGame, selectionRules, discoveries, random: () => Math.random() });
}

function buildDeck() {
  const pairs = activePairs.length ? activePairs : chooseActivePairs();

  return pairs.flatMap((pair, pairIndex) => {
    const { source, mirror } = pair;
    const { title: insightTitle, description: insight } = getPairComparison(pair);
    const icon = pair.icon || getPairIcon(source, mirror);

    return [
      {
        key: source,
        pairId: `pair-${pairIndex}`,
        discoveryId: getMirrorId(pair),
        side: pair.sourceOrigin || "source",
        rarity: pair.rarity || "",
        category: pair.comparison,
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
        discoveryId: getMirrorId(pair),
        side: pair.mirrorOrigin || "mirror",
        rarity: pair.rarity || "",
        category: pair.comparison,
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
  const status = getModeStatus(gameMode, { seconds: elapsedSeconds, moves, completed: gameCompleted });
  movesValue.textContent = status.moves;
  matchesValue.textContent = `${matches}/${getPairCount()}`;
  timeValue.textContent = formatTime(status.seconds);
  timeValue.classList.toggle("is-running-low", status.timeLow);
  movesValue.classList.toggle("is-running-low", status.movesLow);
}

function refreshGameTime() {
  if (!gameCompleted && !gameDefeated && !introRunning) roundClock.refresh();
}
function startTimer() {
  if (roundClock.running) return;
  beginAttempt();
  roundClock.start();
}
function stopTimer() { roundClock.stop(); }
function hasGameInProgress() {
  return !introRunning && !gameCompleted && !gameDefeated && (Boolean(firstCard) || elapsedSeconds > 0 || moves > 0 || matches > 0);
}

function warnBeforeLeaving(event) {
  if (confirmedLanguageReload || !hasGameInProgress()) {
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
  card.dataset.discoveryId = character.discoveryId || "";
  card.dataset.character = character.name;
  card.dataset.revealedLabel = [character.name, getOriginLabel(character.side)].filter(Boolean).join(". ");
  card.dataset.description = character.desc || "";
  card.dataset.insightTitle = character.insightTitle || "";
  card.dataset.insight = character.insight || "";
  card.dataset.rarity = character.rarity || "";
  if (character.category) card.dataset.category = character.category;
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
  mismatchTimer = null;
  if (gameCompleted || gameDefeated || !firstCard || !secondCard) return;
  refreshGameTime();
  if (gameDefeated) return;
  firstCard.classList.remove("is-flipped");
  secondCard.classList.remove("is-flipped");
  firstCard.setAttribute("aria-label", memoryGame.hiddenCard || "");
  secondCard.setAttribute("aria-label", memoryGame.hiddenCard || "");
  resetTurn();
  endChallengeIfNeeded(true);
}

function markMatch() {
  if (gameCompleted || gameDefeated) return;
  const specialDiscovery = firstCard.dataset.discoveryId && firstCard.dataset.rarity && !discoveries.has(firstCard.dataset.discoveryId);
  // The final pair gets immediate victory feedback instead of another effect.
  if (matches + 1 < getPairCount()) {
    if (specialDiscovery) playGameSound("discovery", firstCard.dataset.rarity === "ultra-rare" ? 1.25 : 1);
    else playGameSound("match");
  }
  firstCard.classList.add("is-matched");
  secondCard.classList.add("is-matched");
  matches += 1;
  updateStatus();

  if (matches === getPairCount()) {
    stopTimer();
    gameCompleted = true;
    updateStatus();
    finishChallenge(true);
    saveCompletedPerformance();
    renderCompletedPerformance();
    playGameSound("victory");
    if (window.matchMedia?.("(max-width: 640px)")?.matches) hideLegendToast();
    saveCompletedDiscoveries();
    board.classList.add("is-complete");
    setTopLegendActionVisibility(true);
    setPreviewRewardVisibility(elapsedSeconds < previewRewardThresholdSeconds);
    winMessage.textContent = (memoryGame.win || "")
      .replace("{pairs}", getPairCount());
    winPanel.classList.add("is-visible");
    evaluateAchievements(true);
    showNextAchievement();
    syncModalScrollLock();
  }

  showMatchInsight(firstCard);
  resetTurn();
  endChallengeIfNeeded(true);
}

function showMatchInsight(card, userSelected = false) {
  const isMobile = window.matchMedia?.("(max-width: 640px)")?.matches;
  const showComparison = !isMobile || matchToastsEnabled || userSelected;
  matchInsight.classList.toggle("is-in-progress", !gameCompleted);
  matchInsightTitle.textContent = card.dataset.insightTitle || "";
  matchInsightText.textContent = card.dataset.insight || "";
  matchInsight.classList.toggle(
    "is-visible",
    showComparison && Boolean(card.dataset.insightTitle || card.dataset.insight),
  );
  if (!gameCompleted && showComparison && isMobile) {
    showToast(card.dataset.insightTitle || "", card.dataset.insight || "");
    legendToast.dataset.comparison = "true";
  }
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
  setElementHidden(document.getElementById("legendsFooter"), detailPair?.rarity === "ultra-rare");
  setElementHidden(legendsRarityNote, Boolean(detailPair));
  const rows = pairs.map((pair) => {
    const { source, mirror } = pair;
    const { title: insightTitle, description: insight } = getPairComparison(pair);
    const row = document.createElement("section");
    const icon = pair.icon || getPairIcon(source, mirror);
    row.className = "legend-row";
    row.dataset.rarity = pair.rarity || "";
    row.dataset.category = pair.comparison;
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
  selectedStory.classList.remove("is-visible");
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
  legendToast.dataset.comparison = "false";
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
  if (window.matchMedia?.("(min-width: 1024px) and (min-height: 600px) and (orientation: landscape)")?.matches) {
    hideLegendToast();
    selectedStoryTitle.textContent = card.dataset.character || "";
    selectedStoryText.textContent = card.dataset.description || "";
    selectedStory.classList.toggle("is-visible", Boolean(card.dataset.description));
    return;
  }
  showToast(card.dataset.character || "", card.dataset.description || "");
}

function setPreviewRewardVisibility(shouldShow) {
  previewRewardButton.hidden = !shouldShow;
  previewRewardButton.toggleAttribute("hidden", !shouldShow);
}

function setTopLegendActionVisibility(shouldShow) {
  setElementHidden(hintButton, shouldShow || !tipsEnabled);
  setElementHidden(topViewLegendsButton, !shouldShow);
}

function flipCard(card) {
  refreshGameTime();
  if (gameDefeated) return;
  if (introRunning) {
    return;
  }

  if (card.classList.contains("is-matched")) {
    showMatchInsight(card, true);
    if (gameCompleted) {
      showLegendToast(card);
    }
    return;
  }

  if (gameCompleted || lockBoard || card === firstCard) {
    return;
  }

  prepareGameAudio();
  startTimer();
  card.classList.add("is-flipped");
  card.setAttribute("aria-label", card.dataset.revealedLabel);

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

  mismatchTimer = window.setTimeout(hideOpenCards, mismatchFlipBackDelayMs);
}

function newGame() {
  window.clearTimeout(mismatchTimer);
  mismatchTimer = null;
  gameDefeated = false;
  attemptStarted = false;
  attemptFinished = false;
  roundClock.reset();
  pendingDataReset = false;
  stopGameSounds();
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
  completedPerformance = null;
  renderCompletedPerformance();
  activePairs = chooseActivePairs();
  board.classList.remove("is-complete", "is-intro");
  matchInsight.classList.remove("is-visible");
  matchInsightTitle.textContent = "";
  matchInsightText.textContent = "";
  modalPanels.filter(panel => panel !== achievementPanel).forEach(panel => panel?.classList.remove("is-visible", "is-collection-detail"));
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
  showNextAchievement();
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function restartGame() {
  pendingHome = false;
  pendingLanguage = null;
  pendingDataReset = false;
  renderRestartConfirmation();
  if (hasGameInProgress()) {
    restartPanel.classList.add("is-visible");
    cancelRestartButton.focus({ preventScroll: true });
    syncModalScrollLock();
    return;
  }
  startFreshGame();
}

function closeRestartPanel() {
  const returnToHomeButton = pendingHome;
  pendingHome = false;
  const returnToLanguage = pendingLanguage !== null && settingsPanel.classList.contains("is-visible");
  const returnToReset = pendingDataReset && settingsPanel.classList.contains("is-visible");
  pendingLanguage = null;
  pendingDataReset = false;
  restartPanel.classList.remove("is-visible");
  syncModalScrollLock();
  (returnToHomeButton ? document.getElementById("homeButton") : returnToReset ? document.getElementById("resetGameButton") : returnToLanguage ? languageButton : newGameButton).focus({ preventScroll: true });
}

function renderRestartConfirmation() {
  if (pendingHome) {
    setElementText(document.getElementById("restartTitle"), memoryGame.home.chooseMode);
    setElementText(document.getElementById("restartMessage"), memoryGame.home.confirmReturn);
    setElementText(cancelRestartButton, memoryGame.keepPlaying);
    setElementText(document.getElementById("confirmRestartButton"), memoryGame.home.chooseMode);
    return;
  }
  if (pendingDataReset) {
    setElementText(document.getElementById("restartTitle"), memoryGame.settings.reset);
    setElementText(document.getElementById("restartMessage"), memoryGame.settings.resetConfirmation);
    setElementText(cancelRestartButton, memoryGame.settings.resetCancel);
    setElementText(document.getElementById("confirmRestartButton"), memoryGame.settings.reset);
    return;
  }
  setElementText(document.getElementById("restartTitle"), pendingLanguage ? memoryGame.language || "Language" : memoryGame.newGame || "New game");
  setElementText(document.getElementById("restartMessage"), pendingLanguage
    ? memoryGame.confirmLanguageChange || "Change language? Your progress in this round will be lost."
    : memoryGame.confirmRestart || "Start a new game? Your progress in this round will be lost.");
  setElementText(cancelRestartButton, memoryGame.keepPlaying || "Keep playing");
  setElementText(document.getElementById("confirmRestartButton"), pendingLanguage ? memoryGame.changeLanguage || "Change language" : memoryGame.newGame || "New game");
}

function confirmRestartAction() {
  if (pendingHome) showHome();
  else if (pendingDataReset) resetGameData();
  else if (pendingLanguage) applyLanguageChange(pendingLanguage);
  else startFreshGame();
}

function startFreshGame() {
  homeScreen.hide();
  pendingLanguage = null;
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
  cards[0]?.setAttribute("aria-label", cards[0].dataset.revealedLabel);
  await wait(1200);
  if (runId !== tutorialRunId) return;
  cards[1]?.classList.add("is-flipped");
  cards[1]?.setAttribute("aria-label", cards[1].dataset.revealedLabel);
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
  if (introRunning || !tipsEnabled) return;
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
for (const mode of supportedThemes) {
  document.getElementById(`theme-${mode}`).addEventListener("change", event => {
    if (event.target.checked) setTheme(mode);
  });
}
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
  if (event.key === "Tab" && (gameOverPanel.classList.contains("is-visible") || settingsPanel.classList.contains("is-visible") || achievementPanel.classList.contains("is-visible") || achievementsPanel.classList.contains("is-visible") || restartPanel.classList.contains("is-visible") || aboutPanel.classList.contains("is-visible") || collectionPanel.classList.contains("is-visible"))) {
    const panel = achievementPanel.classList.contains("is-visible") ? achievementPanel
      : restartPanel.classList.contains("is-visible") ? restartPanel
      : settingsPanel.classList.contains("is-visible") ? settingsPanel
      : achievementsPanel.classList.contains("is-visible") ? achievementsPanel
      : aboutPanel.classList.contains("is-visible") ? aboutPanel
      : rarityPanel.classList.contains("is-visible") ? rarityPanel
      : collectionDetailTrigger ? legendsPanel : collectionPanel.classList.contains("is-visible") ? collectionPanel : gameOverPanel;
    const controls = [...panel.querySelectorAll("button:not(:disabled), input:not(:disabled), a[href]")]
      .filter((element) => !element.hidden && element.getClientRects().length && (element.type !== "radio" || element.checked));
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
    if (!restartPanel.classList.contains("is-visible") && settingsPanel.classList.contains("is-visible") && !languageMenu.hidden) {
      closeLanguageMenu();
      languageButton.focus();
      return;
    }
    closeLanguageMenu();
    if (achievementPanel.classList.contains("is-visible")) {
      closeAchievement();
    } else if (restartPanel.classList.contains("is-visible")) {
      closeRestartPanel();
    } else if (settingsPanel.classList.contains("is-visible")) {
      closeSettings();
    } else if (achievementsPanel.classList.contains("is-visible")) {
      closeAchievements();
    } else if (aboutPanel.classList.contains("is-visible")) {
      closeAboutPanel();
    } else if (rarityPanel?.classList.contains("is-visible")) {
      closeRarityPanel();
    } else if (legendsPanel.classList.contains("is-visible") && collectionDetailTrigger) {
      closeLegendsPanel();
    } else if (collectionPanel.classList.contains("is-visible")) {
      closeCollection();
    } else if (legendsPanel.classList.contains("is-visible")) {
      closeLegendsPanel();
    } else if (gameOverPanel.classList.contains("is-visible")) {
      closeGameOver();
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
  if (event.key === null && event.storageArea === window.localStorage) {
    try { window.sessionStorage.clear(); } catch {}
    reloadAfterDataReset();
    return;
  }
  if (event.key === challengeStatsStorageKey) {
    updateAchievementsVisibility();
    if (achievementsPanel.classList.contains("is-visible")) renderChallengeStats();
  }
  if (event.key === recordsStorageKey && achievementsPanel.classList.contains("is-visible")) {
    renderPersonalRecords();
  }
  if (event.key === matchToastsStorageKey) {
    matchToastsEnabled = readMatchToastsEnabled();
    applyMatchToastsPreference();
  }
  if (event.key === shortNamesStorageKey) {
    shortNamesEnabled = readShortNamesEnabled();
    applyShortNamesPreference();
  }
  if (event.key === themeStorageKey) {
    applyTheme();
  }
  if (event.key === soundStorageKey) {
    soundEnabled = readSoundEnabled();
    soundToggle.checked = soundEnabled;
    if (!soundEnabled) stopGameSounds();
  }
  if (event.key === tipsStorageKey) {
    tipsEnabled = readTipsEnabled();
    tipsToggle.checked = tipsEnabled;
    hintPressCount = 0;
    setElementHidden(hintButton, gameCompleted || !tipsEnabled);
  }
});
window.addEventListener("beforeunload", warnBeforeLeaving);
// Android may resume the existing page after an external link, or restore it
// from the back/forward cache. Derive the lock from the visible dialogs without
// creating or traversing history entries during those lifecycle events.
function resumeGamePage() {
  refreshGameTime();
  refreshModalScrollLock();
}
window.addEventListener("pageshow", resumeGamePage);
window.addEventListener("focus", resumeGamePage);
document.addEventListener("visibilitychange", () => {
  refreshGameTime();
  if (document.visibilityState === "visible") refreshModalScrollLock();
  else stopGameSounds();
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
cancelRestartButton.addEventListener("click", closeRestartPanel);
document.getElementById("confirmRestartButton").addEventListener("click", confirmRestartAction);
restartPanel.addEventListener("click", event => {
  if (event.target === restartPanel) closeRestartPanel();
});
aboutPanel.addEventListener("click", event => {
  if (event.target === aboutPanel) closeAboutPanel();
});
collectionButton.addEventListener("click", openCollection);
settingsButton.addEventListener("click", openSettings);
function closeGameOver() {
  gameOverPanel.classList.remove("is-visible");
  syncModalScrollLock();
  newGameButton.focus({ preventScroll: true });
}
document.getElementById("closeGameOverButton").addEventListener("click", closeGameOver);
document.getElementById("tryAgainButton").addEventListener("click", restartGame);
document.getElementById("gameOverRecordsButton").addEventListener("click", openAchievements);
gameOverPanel.addEventListener("click", event => { if (event.target === gameOverPanel) closeGameOver(); });
document.getElementById("resetGameButton").addEventListener("click", openDataResetConfirmation);
closeSettingsButton.addEventListener("click", closeSettings);
settingsPanel.addEventListener("click", event => {
  if (event.target === settingsPanel) closeSettings();
});
soundToggle.addEventListener("change", () => setSoundEnabled(soundToggle.checked));
matchToastsToggle.addEventListener("change", () => setMatchToastsEnabled(matchToastsToggle.checked));
tipsToggle.addEventListener("change", () => setTipsEnabled(tipsToggle.checked));
shortNamesToggle.addEventListener("change", () => setShortNamesEnabled(shortNamesToggle.checked));
achievementsButton.addEventListener("click", openAchievements);
progressView.bind();
winRecordsButton.addEventListener("click", openAchievements);
closeAchievementsButton.addEventListener("click", closeAchievements);
closeAchievementButton.addEventListener("click", closeAchievement);
achievementsPanel.addEventListener("click", event => {
  if (event.target === achievementsPanel) closeAchievements();
});
achievementPanel.addEventListener("click", event => {
  if (event.target === achievementPanel) closeAchievement();
});
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
window.matchMedia?.("(prefers-color-scheme: dark)")?.addEventListener("change", () => applyTheme());
loadTranslations().then(() => {
  applyUiCopy();
  evaluateAchievements();
  if (isEmbedded) {
    homeScreen.hide();
    startGame();
  } else showHome();
}).catch(error => {
  console.error("Unable to initialize the memory game:", error);
});
