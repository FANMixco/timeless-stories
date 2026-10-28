// The start screen owns presentation; the application owns round transitions.
export function createHomeScreen({ document, modes, onChoose, onSettings, onRecords, onCollection, onReturn, reduceMotion = () => false }) {
  const shell = document.querySelector(".game-shell");
  const home = document.getElementById("gameHome");
  let visible = true;
  let selection = 0;
  let choosing = false;
  let pressAnimation = null;
  const text = (id, value) => { document.getElementById(id).textContent = value; };

  function animateEntrance(element) {
    if (reduceMotion()) return;
    element.animate?.([
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "translateY(0)" }
    ], { duration: 240, easing: "ease-out" });
  }

  function choose(mode) {
    if (choosing || !visible) return;
    const card = document.getElementById(`home-${mode}`);
    if (reduceMotion() || !card.animate) { onChoose(mode); return; }
    const currentSelection = ++selection;
    choosing = true;
    home.inert = true;
    const enterGame = () => {
      if (currentSelection !== selection || !visible) return;
      choosing = false;
      pressAnimation = null;
      home.inert = false;
      onChoose(mode);
      animateEntrance(document.querySelector(".game-layout"));
    };
    pressAnimation = card.animate([
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(0.97)", opacity: 0.8 }
    ], { duration: 160, easing: "ease-in" });
    pressAnimation.finished.then(enterGame, enterGame);
  }
  return {
    get visible() { return visible; },
    show(mode) {
      const returning = !visible;
      selection++;
      choosing = false;
      pressAnimation?.cancel();
      pressAnimation = null;
      home.inert = false;
      visible = true;
      shell.classList.add("is-home");
      home.hidden = false;
      document.querySelector(".game-layout").hidden = true;
      document.getElementById(`home-${mode}`).focus({ preventScroll: true });
      if (returning) animateEntrance(home);
    },
    hide() {
      visible = false;
      shell.classList.remove("is-home");
      home.hidden = true;
      document.querySelector(".game-layout").hidden = false;
    },
    render(copy, options = {}) {
      const hardMode = Boolean(options.hardMode);
      document.getElementById("homeTitle").innerHTML = copy.title.replace(": ", ": <br>");
      text("homeSubtitle", hardMode ? copy.settings.hardMode : copy.subtitle);
      text("homeSettingsLabel", copy.settings.title);
      text("homeRecordsLabel", copy.progress.records);
      text("homeCollectionLabel", copy.collection.title);
      document.getElementById("homeButton").setAttribute("aria-label", copy.home.chooseMode);
      document.getElementById("homeButton").title = copy.home.chooseMode;
      for (const mode of Object.keys(modes)) {
        const modeConfig = modes[mode];
        let name = copy.modes[mode].name;
        let description = copy.modes[mode].description;
        if (hardMode) {
          if (mode === "timeAttack") description = `Match all pairs in ${modeConfig.seconds} seconds.`;
          else if (mode === "limitedMoves") {
            name = `${modeConfig.moves}-Move Challenge`;
            description = `Match all pairs within ${modeConfig.moves} moves.`;
          }
        }
        text(`home-${mode}-name`, name);
        text(`home-${mode}-description`, description);
      }
      if (hardMode && modes.limitedMoves) {
        document.getElementById("home-limitedMoves-icon").textContent = modes.limitedMoves.moves;
      }
    },
    bind() {
      for (const mode of Object.keys(modes)) {
        document.getElementById(`home-${mode}`).addEventListener("click", () => choose(mode));
      }
      document.getElementById("homeSettings").addEventListener("click", onSettings);
      document.getElementById("homeRecords").addEventListener("click", onRecords);
      document.getElementById("homeCollection").addEventListener("click", onCollection);
      document.getElementById("homeButton").addEventListener("click", onReturn);
    }
  };
}
