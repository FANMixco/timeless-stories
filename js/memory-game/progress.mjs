import { validRecordNumber } from "./storage.mjs";

// Render records and unlocks without owning gameplay or persistence.
export function createProgressView({ document, getState, readPersonalRecords, readChallengeStats,
  getPairCount, getRecordConfiguration, formatTime, setElementText, setElementHidden, achievementDefinitions, onTabChange, gameModes }) {
  const achievementsPanel = document.getElementById("achievementsPanel");
  let progressTab = "records";
  let memoryGame, achievements, completedPerformance, currentLanguage, personalRecords;
  function refresh() { ({ memoryGame, achievements, completedPerformance, currentLanguage } = getState()); }
  function createRecordCards(stats) {
    return stats.map(([label, value, icon]) => {
      const card = document.createElement("div");
      card.className = "record-stat";
      const mark = document.createElement("i");
      mark.className = `icon-${icon}`;
      mark.setAttribute("aria-hidden", "true");
      if (icon === "target") {
        mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" focusable="false"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>';
      }
      if (icon === "defeat") {
        mark.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" focusable="false"><path d="m6 6 12 12M18 6 6 18"/></svg>';
      }
      const name = document.createElement("dt");
      name.append(mark, document.createTextNode(label));
      const number = document.createElement("dd");
      number.textContent = typeof value === "number" ? value.toLocaleString(currentLanguage) : value;
      card.append(name, number);
      return card;
    });
  }

  function renderChallengeStats() {
    const stats = readChallengeStats();
    const copy = memoryGame.modes;
    const sections = Object.keys(gameModes).filter(id => gameModes[id].record).map(mode => {
      const section = document.createElement("section");
      section.className = "mode-records";
      const heading = document.createElement("h4");
      heading.id = `records-${mode}-title`;
      section.setAttribute("aria-labelledby", heading.id);
      heading.textContent = copy[mode].name;
      const list = document.createElement("dl");
      list.className = "records-grid";
      const entry = stats[mode];
      const record = gameModes[mode].record;
      const best = entry[record.key];
      list.append(...createRecordCards([
        [memoryGame.records[record.key],
          best == null ? "—" : record.field === "time" ? formatTime(best) : best, "power"],
        [copy.attempts, entry.attempts, "target"],
        [copy.victories, entry.victories, "trophy"],
        [copy.defeats, entry.defeats, "defeat"],
        [copy.winPercentage, `${entry.attempts ? Math.round(entry.victories / entry.attempts * 100) : 0}%`, "star-full"],
      ]));
      section.append(heading, list);
      return section;
    });
    document.getElementById("challengeRecordsStats").replaceChildren(...sections);
    setElementText(document.getElementById("challengeAttemptPolicy"), copy.attemptPolicy);
  }

  function renderPersonalRecords() {
    renderChallengeStats();
    setElementText(document.getElementById("personalRecordsMode"), memoryGame.modes.classic.name);
    personalRecords = readPersonalRecords();
    const copy = memoryGame.records;
    const entry = personalRecords.configurations[getRecordConfiguration()] || {};
    setElementText(document.getElementById("personalRecordsTitle"), copy.title);
    setElementText(document.getElementById("personalRecordsConfiguration"), copy.configuration.replace("{pairs}", getPairCount()));
    setElementText(document.getElementById("personalRecordsEmpty"), copy.empty);
    setElementHidden(document.getElementById("personalRecordsEmpty"), validRecordNumber(entry.bestTime) || validRecordNumber(entry.fewestMoves));
    const stats = [
      [copy.bestTime, validRecordNumber(entry.bestTime) ? formatTime(entry.bestTime) : "—", "power"],
      [copy.fewestMoves, entry.fewestMoves ?? "—", "power"],
      [copy.gamesCompleted, personalRecords.gamesCompleted, "trophy"],
      [copy.totalPairsMatched, personalRecords.totalPairsMatched, "mirror"],
    ];
    document.getElementById("personalRecordsStats").replaceChildren(...createRecordCards(stats));
  }

  function performanceDifference(current, best, metric) {
    const copy = memoryGame.records;
    if (current === best) return copy.same;
    const key = metric === "time" ? (current < best ? "faster" : "slower") : (current < best ? "fewer" : "more");
    return copy[key].replace("{count}", Math.abs(current - best).toLocaleString(currentLanguage));
  }

  function renderCompletedPerformance() {
    const result = completedPerformance;
    const panel = document.getElementById("winPerformance");
    panel.replaceChildren();
    if (!result) return;
    const copy = memoryGame.records;
    const metrics = document.createElement("dl");
    metrics.className = "performance-metrics";
    for (const [metric, label, value] of [["time", copy.time, formatTime(result.time)], ["moves", copy.moves, result.moves.toLocaleString(currentLanguage)]]) {
      const row = document.createElement("div");
      const name = document.createElement("dt");
      name.textContent = label;
      const number = document.createElement("dd");
      number.textContent = value;
      const best = result.bestBefore[metric];
      if (validRecordNumber(best)) {
        const difference = document.createElement("small");
        const bestValue = metric === "time" ? formatTime(best) : best.toLocaleString(currentLanguage);
        difference.textContent = (result[metric] < best ? copy.previousBest : copy.personalBest).replace("{value}", bestValue);
        const delta = document.createElement("span");
        delta.className = "performance-delta";
        delta.textContent = performanceDifference(result[metric], best, metric);
        difference.append(delta);
        number.append(difference);
      }
      row.append(name, number);
      metrics.append(row);
    }
    panel.append(metrics);
    const notification = result.newBestTime && result.newFewestMoves ? copy.twoRecords
      : result.newBestTime ? copy.newBestTime : result.newFewestMoves ? copy.newFewestMoves
        : !validRecordNumber(result.bestBefore.time) && !validRecordNumber(result.bestBefore.moves) ? copy.initial : "";
    if (notification) {
      const message = document.createElement("p");
      message.className = "performance-notification";
      message.textContent = notification;
      panel.append(message);
    }
  }

  function renderAchievements() {
    renderPersonalRecords();
    const copy = memoryGame.achievements;
    setElementText(document.getElementById("achievementsTitle"), memoryGame.progress.title);
    setElementText(document.getElementById("progressRecordsTab"), memoryGame.progress.records);
    setElementText(document.getElementById("progressAchievementsTab"), copy.title);
    const count = document.createElement("span");
    count.className = "progress-tab-count";
    count.textContent = `${achievementDefinitions.filter(({ id }) => achievements[id]).length}/${achievementDefinitions.length}`;
    count.setAttribute("aria-hidden", "true");
    document.getElementById("progressAchievementsTab").append(count);
    setElementText(document.getElementById("achievementsProgress"), copy.progress
      .replace("{found}", achievementDefinitions.filter(({ id }) => achievements[id]).length)
      .replace("{total}", achievementDefinitions.length));
    // Show the first win before collection milestones without changing reward priority.
    const displayDefinitions = [
      achievementDefinitions.find(({ id }) => id === "victory"),
      ...achievementDefinitions.filter(({ id }) => id !== "victory"),
    ];
    const rows = displayDefinitions.map(({ id, icon, color }) => {
      const row = document.createElement("article");
      row.className = `achievement-row${achievements[id] ? " is-unlocked" : ""}`;
      row.style.setProperty("--achievement-color", color);
      const mark = document.createElement("i");
      mark.className = `achievement-icon icon-${icon}`;
      mark.setAttribute("aria-hidden", "true");
      const body = document.createElement("div");
      const name = document.createElement("h3");
      name.textContent = copy.items[id].name;
      const description = document.createElement("p");
      description.textContent = copy.items[id].description;
      const status = document.createElement("p");
      status.className = "achievement-status";
      status.textContent = achievements[id] ? copy.unlocked : copy.locked;
      if (achievements[id]) {
        const date = document.createElement("time");
        date.setAttribute("datetime", achievements[id]);
        date.textContent = new Date(achievements[id]).toLocaleDateString(currentLanguage, { year: "numeric", month: "short", day: "numeric" });
        status.append(document.createTextNode(" · "), date);
      }
      body.append(name, description, status);
      row.append(mark, body);
      return row;
    });
    document.getElementById("achievementsList").replaceChildren(...rows);
  }

  function selectProgressTab(tab = "records", focus = false) {
    progressTab = tab === "achievements" ? "achievements" : "records";
    for (const [name, id] of [["records", "Records"], ["achievements", "Achievements"]]) {
      const selected = progressTab === name;
      const button = document.getElementById(`progress${id}Tab`);
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      setElementHidden(document.getElementById(`progress${id}Panel`), !selected);
      if (selected && focus) button.focus({ preventScroll: true });
    }
    achievementsPanel.scrollTop = 0;
    achievementsPanel.querySelector(".legends-card").scrollTop = 0;
    if (achievementsPanel.classList.contains("is-visible")) onTabChange();
  }
  return {
    get tab() { return progressTab; },
    renderRecords() { refresh(); renderPersonalRecords(); },
    renderChallenges() { refresh(); renderChallengeStats(); },
    renderCompleted() { refresh(); renderCompletedPerformance(); },
    render() { refresh(); renderAchievements(); },
    selectTab: selectProgressTab,
    bind() {
    for (const [tab, id] of [["records", "Records"], ["achievements", "Achievements"]]) {
      document.getElementById(`progress${id}Tab`).addEventListener("click", () => selectProgressTab(tab));
      document.getElementById(`progress${id}Tab`).addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        selectProgressTab(event.key === "Home" ? "records" : event.key === "End" ? "achievements"
          : progressTab === "records" ? "achievements" : "records", true);
      });
    }
    },
  };
}
