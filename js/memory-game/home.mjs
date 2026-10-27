// The start screen owns presentation; the application owns round transitions.
export function createHomeScreen({ document, modes, onChoose, onSettings, onRecords, onReturn }) {
  const shell = document.querySelector(".game-shell");
  const home = document.getElementById("gameHome");
  let visible = true;
  const text = (id, value) => { document.getElementById(id).textContent = value; };
  return {
    get visible() { return visible; },
    show(mode) {
      visible = true;
      shell.classList.add("is-home");
      home.hidden = false;
      document.querySelector(".game-layout").hidden = true;
      document.getElementById(`home-${mode}`).focus({ preventScroll: true });
    },
    hide() {
      visible = false;
      shell.classList.remove("is-home");
      home.hidden = true;
      document.querySelector(".game-layout").hidden = false;
    },
    render(copy) {
      text("homeTitle", copy.title);
      text("homeSubtitle", copy.subtitle);
      text("homeSettingsLabel", copy.settings.title);
      text("homeRecordsLabel", copy.progress.records);
      document.getElementById("homeButton").setAttribute("aria-label", copy.home.chooseMode);
      document.getElementById("homeButton").title = copy.home.chooseMode;
      for (const mode of Object.keys(modes)) {
        text(`home-${mode}-name`, copy.modes[mode].name);
        text(`home-${mode}-description`, copy.modes[mode].description);
      }
    },
    bind() {
      for (const mode of Object.keys(modes)) {
        document.getElementById(`home-${mode}`).addEventListener("click", () => onChoose(mode));
      }
      document.getElementById("homeSettings").addEventListener("click", onSettings);
      document.getElementById("homeRecords").addEventListener("click", onRecords);
      document.getElementById("homeButton").addEventListener("click", onReturn);
    }
  };
}
