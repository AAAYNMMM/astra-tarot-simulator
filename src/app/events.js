export function createEventBinder({
  windowRef, documentRef, state, dom, callbacks, loadHistory,
}) {
  const {
    onQuestionInput = () => {}, onSpreadClick, onDeckStyleClick,
    openDialog, closeDialog, startReading, revealCard, revealAllCards,
    requestNewReading, updateInsightTabs, renderSummary, renderCardInsight,
    showToast, renderHistory, toggleHistoryDetail, deleteHistoryRecord,
    resolveConfirmation, confirmAction, writeHistory, clearStructuredHistory = null,
  } = callbacks;

  return function bindEvents() {
    dom.questionInput.addEventListener("input", onQuestionInput);
    dom.spreadList.addEventListener("click", onSpreadClick);
    dom.deckStyleList.addEventListener("click", onDeckStyleClick);
    dom.startReading.addEventListener("click", startReading);
    dom.cardTable.addEventListener("click", (event) => {
      const button = event.target.closest(".card-hitbox");
      if (button) revealCard(Number(button.dataset.cardIndex));
    });
    dom.revealAllButton.addEventListener("click", revealAllCards);
    dom.newReadingButton.addEventListener("click", requestNewReading);
    dom.insightTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]");
      if (!button || !state.reading) return;
      const tab = button.dataset.tab;
      if (tab === "summary" && !state.reading.synthesis) {
        showToast("翻开全部牌面后会生成综合结论", "☾");
        return;
      }
      state.activeTab = tab;
      updateInsightTabs();
      if (tab === "summary") renderSummary();
      else {
        const index = state.selectedIndex ?? [...state.revealed].sort((a, b) => a - b)[0];
        if (index !== undefined) renderCardInsight(index);
      }
    });
    dom.historyButton.addEventListener("click", () => { renderHistory(); openDialog(dom.historyDialog); });
    dom.helpButton.addEventListener("click", () => openDialog(dom.helpDialog));
    dom.brandHome.addEventListener("click", async (event) => { event.preventDefault(); await requestNewReading(); });
    documentRef.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => {
      const dialog = button.closest("dialog");
      if (dialog) closeDialog(dialog);
    }));
    documentRef.querySelectorAll(".app-dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
      if (dialog !== dom.confirmDialog) {
        dialog.addEventListener("cancel", (event) => {
          event.preventDefault();
          closeDialog(dialog);
        });
      }
    });
    documentRef.querySelectorAll("[data-confirm-cancel]").forEach((button) => button.addEventListener("click", () => resolveConfirmation(false)));
    dom.confirmAccept.addEventListener("click", () => resolveConfirmation(true));
    dom.confirmDialog.addEventListener("cancel", (event) => { event.preventDefault(); resolveConfirmation(false); });
    dom.historyList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-history-action]");
      const item = event.target.closest("[data-history-id]");
      if (!button || !item) return;
      const record = loadHistory().find((entry) => entry.id === item.dataset.historyId);
      if (!record) return;
      if (button.dataset.historyAction === "view") toggleHistoryDetail(item, record);
      if (button.dataset.historyAction === "delete") deleteHistoryRecord(record.id);
    });
    dom.clearHistoryButton.addEventListener("click", async () => {
      const confirmed = await confirmAction("清空全部记录？", "这会删除保存在此浏览器中的所有占卜记录，且无法恢复。", "全部清空");
      if (!confirmed) return;
      writeHistory([]);
      if (typeof clearStructuredHistory === "function") await clearStructuredHistory();
      renderHistory();
      showToast("全部占卜记录已清空", "×");
    });
    windowRef.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPrompt = event;
      dom.installButton.hidden = false;
    });
    dom.installButton.addEventListener("click", async () => {
      if (!state.installPrompt) return;
      state.installPrompt.prompt();
      await state.installPrompt.userChoice;
      state.installPrompt = null;
      dom.installButton.hidden = true;
    });
    windowRef.addEventListener("appinstalled", () => {
      state.installPrompt = null;
      dom.installButton.hidden = true;
      showToast("星纱塔罗已安装到桌面", "✦");
    });
    documentRef.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && state.phase === "setup") {
        event.preventDefault();
        startReading();
      }
      if (event.key.toLowerCase() === "r" && state.phase === "revealing" && !event.ctrlKey && !event.metaKey) {
        const tagName = documentRef.activeElement?.tagName;
        if (!["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) {
          event.preventDefault();
          revealAllCards();
        }
      }
    });
  };
}
