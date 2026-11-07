// Result snapshots and platform sharing are independent of the active board.
export function createSharing({ window, document, getNavigator, getState, shareButton,
  formatTime, getShareUrl, setActionButtonContent, getShareIconClass }) {
  function getResultShareText(outcome) {
    const { memoryGame, shareResult, currentLanguage } = getState();
    if (!shareResult || shareResult.outcome !== outcome) return memoryGame.shareText;
    const result = shareResult;
    let mode = memoryGame.modes[result.mode].name;
    if (result.mode === "limitedMoves") mode = mode.replace(/\d+/, result.moveLimit);
    const stats = [`${memoryGame.matches}: ${result.matches}/${result.pairs}`];
    if (result.tracksTime) stats.push(`${memoryGame.time}: ${formatTime(result.seconds)}`);
    stats.push(`${memoryGame.moves}: ${result.moves.toLocaleString(currentLanguage)}`);
    const values = { title: memoryGame.title, mode,
      difficulty: result.hard ? ` (${memoryGame.settings.hardMode})` : "",
      reason: memoryGame.modes[result.reason] || "", stats: stats.join(" · ") };
    return memoryGame.shareResults[outcome].replace(/\{(\w+)\}/g, (_, key) => values[key]);
  }

  async function shareGame(button = shareButton, outcome = null) {
    const { memoryGame, shareResult, ratingUrl } = getState();
    const navigator = getNavigator();
    const isResult = Boolean(outcome && shareResult?.outcome === outcome);
    const shareData = {
      title: memoryGame.title || document.title,
      text: isResult ? getResultShareText(outcome) : memoryGame.shareText || memoryGame.subtitle || "",
      url: ratingUrl || getShareUrl(),
    };

    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }

    if (!navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(isResult ? `${shareData.text}\n${shareData.url}` : shareData.url);
    const originalLabel = button.textContent || memoryGame.share || "";
    button.textContent = (isResult ? memoryGame.shareResults.copied : memoryGame.shareCopied) || originalLabel;
    window.setTimeout(() => {
      if (button === shareButton) {
        setActionButtonContent(button, button.dataset.label || originalLabel, getShareIconClass());
        return;
      }

      button.textContent = originalLabel;
    }, 1600);
  }
  return { getResultShareText, shareGame };
}
