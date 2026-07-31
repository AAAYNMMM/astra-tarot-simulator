function enabledTabs(container) {
  return [...container.querySelectorAll('[role="tab"], [data-tab]')].filter((item) => !item.disabled);
}

export function moveRovingFocus(items, currentIndex, key) {
  if (!items.length) return -1;
  if (key === "Home") return 0;
  if (key === "End") return items.length - 1;
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1) % items.length;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex - 1 + items.length) % items.length;
  return -1;
}

function installTablist(tablist, panel) {
  tablist.setAttribute("role", "tablist");
  const tabs = enabledTabs(tablist);
  tabs.forEach((tab, index) => {
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    tab.tabIndex = tab.classList.contains("is-active") || index === 0 ? 0 : -1;
  });
  panel.setAttribute("role", "tabpanel");
  panel.tabIndex = 0;
  tablist.addEventListener("click", (event) => {
    const selected = event.target.closest?.('[role="tab"], [data-tab]');
    if (!selected) return;
    enabledTabs(tablist).forEach((item) => {
      const active = item === selected;
      item.tabIndex = active ? 0 : -1;
      item.setAttribute("aria-selected", String(active));
    });
    if (selected.id) panel.setAttribute("aria-labelledby", selected.id);
  });
  tablist.addEventListener("keydown", (event) => {
    const items = enabledTabs(tablist);
    const current = items.indexOf(event.target);
    const targetIndex = moveRovingFocus(items, current, event.key);
    if (targetIndex < 0) return;
    event.preventDefault();
    items.forEach((item, index) => { item.tabIndex = index === targetIndex ? 0 : -1; });
    items[targetIndex].focus();
  });
}

function installCardTable(cardTable) {
  cardTable.setAttribute("role", "list");
  cardTable.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const buttons = [...cardTable.querySelectorAll(".card-hitbox:not(:disabled)")];
    const current = buttons.indexOf(event.target);
    if (current < 0) return;
    const targetIndex = moveRovingFocus(buttons, current, event.key);
    if (targetIndex < 0) return;
    event.preventDefault();
    buttons[targetIndex].focus();
  });
}

export function installAccessibility({ dom } = {}) {
  if (!dom) throw new TypeError("Accessibility controller requires DOM bindings.");
  installTablist(dom.insightTabs, dom.insightContent);
  installCardTable(dom.cardTable);
  dom.statusText.setAttribute("role", "status");
  dom.statusText.setAttribute("aria-live", "polite");
  dom.guidanceText.setAttribute("aria-live", "polite");
  return Object.freeze({ installed: true });
}
