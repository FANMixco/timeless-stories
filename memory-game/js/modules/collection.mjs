// Collection presentation reads a snapshot; round and dialog transitions stay in the app.
export function createCollectionView({ document, getState, getMirrorCatalogue, getMirrorId,
  getPairComparison, getPairIcon, getOriginFlag, setElementText, setElementHidden,
  openRarityPanel, onOpenPair }) {
  const contributionPanel = document.getElementById("contributionPanel");
  const contributionFrame = document.getElementById("contributionFrame");
  const closeContributionButton = document.getElementById("closeContributionButton");
  function render() {
    const { memoryGame, discoveries, currentLanguage, linkRegistry } = getState();
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
      const icon = document.createElement("i");
      icon.className = "icon collection-info-icon icon-information-outline";
      icon.setAttribute("aria-hidden", "true");
      info.replaceChildren(icon);
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
          icon.className = `icon character-icon icon-${pair.icon || getPairIcon(pair.source, pair.mirror)}`;
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
            onOpenPair(pair, card);
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
    contributionPanel.setAttribute("aria-label", submit.textContent);
    contributionFrame.title = submit.textContent;
    closeContributionButton.setAttribute("aria-label", memoryGame.close);
  }
  return { render };
}
