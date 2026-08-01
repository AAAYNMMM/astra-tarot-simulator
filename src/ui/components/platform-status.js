function formatBytes(value) {
  const amount = Number(value || 0);
  if (amount < 1024) return `${amount} B`;
  if (amount < 1024 ** 2) return `${(amount / 1024).toFixed(1)} KB`;
  return `${(amount / 1024 ** 2).toFixed(1)} MB`;
}

export function createPlatformStatusController({
  windowRef = globalThis.window,
  dom,
  offlineStatus,
  getSelectedDeckId,
  getClientState,
  showToast = () => {},
} = {}) {
  let coordinator = null;

  function render(status = offlineStatus.getStatus()) {
    if (!dom.platformStatus) return;
    const states = status?.states || {};
    const deckId = getSelectedDeckId();
    const selected = new Set(states["SELECTED-DECKS-READY"] || []);
    const deckReady = selected.has(deckId);
    dom.platformStatus.hidden = false;
    dom.offlineState.textContent = states["APP-SHELL-READY"]
      ? (deckReady ? "应用与当前牌组可离线使用" : "应用可离线启动，当前牌组尚未完整缓存")
      : "正在准备离线应用壳";
    dom.releaseState.textContent = status?.activeReleaseId || status?.releaseId || "尚未激活";
    dom.cacheDeckButton.textContent = deckReady ? "重新校验当前牌组" : "缓存当前牌组";
    dom.deleteDeckButton.disabled = !deckReady;
  }

  async function refreshStorage() {
    const estimate = await offlineStatus.estimateStorage();
    dom.storageState.textContent = estimate.quota
      ? `${formatBytes(estimate.usage)} / ${formatBytes(estimate.quota)}`
      : "浏览器未提供空间估算";
  }

  async function cacheCurrentDeck() {
    const deckId = getSelectedDeckId();
    dom.deckCacheProgress.hidden = false;
    const result = await offlineStatus.cacheDeck(deckId, {
      onProgress(progress) {
        const ratio = progress.total ? progress.completed / progress.total : 0;
        dom.deckCacheProgress.value = Math.round(ratio * 100);
        dom.deckCacheText.textContent = `${progress.completed} / ${progress.total}`;
      },
    });
    dom.deckCacheProgress.hidden = true;
    showToast(result.ready ? "当前牌组已可离线使用" : "牌组缓存未完成，可稍后重试", result.ready ? "✦" : "!");
    render();
    void refreshStorage();
  }

  async function deleteCurrentDeck() {
    const deleted = await offlineStatus.deleteDeck(getSelectedDeckId());
    showToast(deleted ? "已删除当前牌组离线副本" : "未找到可删除的牌组缓存", deleted ? "✓" : "!");
    render();
    void refreshStorage();
  }

  function bind(nextCoordinator) {
    coordinator = nextCoordinator;
    dom.cacheDeckButton?.addEventListener("click", cacheCurrentDeck);
    dom.deleteDeckButton?.addEventListener("click", deleteCurrentDeck);
    dom.updateAppButton?.addEventListener("click", async () => {
      if (!coordinator) return;
      const decision = await coordinator.requestActivation({ force: false });
      showToast(
        decision.allowed ? "更新已获准，页面将在新版本激活后刷新" : "当前占卜或其他标签页尚未完成，更新保持等待",
        decision.allowed ? "✓" : "!",
      );
    });
    windowRef?.addEventListener?.("astra:offline-status", (event) => render(event.detail));
    windowRef?.addEventListener?.("beforeunload", () => coordinator?.reportState?.());
    render();
    void refreshStorage();
  }

  function updateAvailable() {
    dom.updateAppButton.hidden = false;
    dom.updateState.textContent = "新版本已完整下载，等待安全切换";
    coordinator?.reportState?.();
  }

  function activated() {
    dom.updateState.textContent = "新版本已激活，正在重新载入";
    windowRef?.location?.reload?.();
  }

  function reportState() {
    coordinator?.reportState?.();
    dom.clientState.textContent = getClientState();
  }

  return Object.freeze({ bind, render, updateAvailable, activated, reportState });
}
