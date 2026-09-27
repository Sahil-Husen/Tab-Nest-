const PIN_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M14.7 2.3a1 1 0 0 0-1.4 0l-1 1a1 1 0 0 0 0 1.4l.3.3-3.6 3.6-2.6-.6a1 1 0 0 0-1 .3L4 9.7a1 1 0 0 0 0 1.4l4 4-5 5a1 1 0 1 0 1.4 1.4l5-5 4 4a1 1 0 0 0 1.4 0l1.4-1.4a1 1 0 0 0 .3-1l-.6-2.6 3.6-3.6.3.3a1 1 0 0 0 1.4 0l1-1a1 1 0 0 0 0-1.4z"/></svg>`;
const PIN_OUTLINE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M14.7 2.3a1 1 0 0 0-1.4 0l-1 1a1 1 0 0 0 0 1.4l.3.3-3.6 3.6-2.6-.6a1 1 0 0 0-1 .3L4 9.7a1 1 0 0 0 0 1.4l4 4-5 5a1 1 0 1 0 1.4 1.4l5-5 4 4a1 1 0 0 0 1.4 0l1.4-1.4a1 1 0 0 0 .3-1l-.6-2.6 3.6-3.6.3.3a1 1 0 0 0 1.4 0l1-1a1 1 0 0 0 0-1.4z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>`;
const CLOSE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
const RESTORE_ICON = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none"><path d="M4 4v6h6M4.5 15a8 8 0 1 0 1.8-8.3L4 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const CHIP_REMOVE_ICON = `<svg viewBox="0 0 24 24" width="10" height="10" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`;

// nestGetKept / nestAddToNest / nestRemoveFromNest come from nest-storage.js,
// shared with the background service worker so pinned tabs are captured
// even when this popup isn't open.

const windowsSection = document.getElementById("windowsSection");
const pinnedRow = document.getElementById("pinnedRow");
const pinnedCount = document.getElementById("pinnedCount");
const pinnedEmpty = document.getElementById("pinnedEmpty");
const closedSection = document.getElementById("closedSection");
const closedToggle = document.getElementById("closedToggle");
const closedList = document.getElementById("closedList");
const closedCount = document.getElementById("closedCount");
const searchInput = document.getElementById("search");
const tabCountEl = document.getElementById("tabCount");
const emptyState = document.getElementById("emptyState");
const emptyQuery = document.getElementById("emptyQuery");
const pinAllBtn = document.getElementById("pinAllBtn");

let allTabs = [];
let closedSessions = [];
let keptItems = [];
let query = "";

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "";
  }
}

function faviconFor(tab) {
  if (tab.favIconUrl) return tab.favIconUrl;
  return `chrome://favicon/size/16@1x/${tab.url || ""}`;
}

function matches(tab) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (tab.title || "").toLowerCase().includes(q) || (tab.url || "").toLowerCase().includes(q);
}

async function loadTabs() {
  allTabs = await chrome.tabs.query({});
  render();
}

async function loadKept() {
  keptItems = await nestGetKept();
  render();
}

async function loadClosed() {
  try {
    closedSessions = await chrome.sessions.getRecentlyClosed({ maxResults: 20 });
  } catch {
    closedSessions = [];
  }
  renderClosed();
}

function activateTab(tab) {
  chrome.tabs.update(tab.id, { active: true });
  chrome.windows.update(tab.windowId, { focused: true });
}

async function togglePinned(tabOrItem) {
  const kept = await nestGetKept();
  const already = kept.some((k) => k.url === tabOrItem.url);
  if (already) {
    await nestRemoveFromNest(tabOrItem.url);
  } else {
    await nestAddToNest(tabOrItem);
  }
  await loadKept();
}

function makeKeptChip(item) {
  const liveTab = allTabs.find((t) => t.url === item.url);
  const chip = document.createElement("div");
  chip.className = "pinned-chip" + (liveTab ? "" : " is-closed");
  chip.title = liveTab ? item.title : `${item.title} — closed, click to reopen`;

  const dot = document.createElement("span");
  dot.className = "status-dot";

  const img = document.createElement("img");
  img.src = liveTab ? faviconFor(liveTab) : item.favIconUrl || "";
  img.onerror = () => (img.style.visibility = "hidden");

  const span = document.createElement("span");
  span.textContent = item.title || domainOf(item.url);

  const removeBtn = document.createElement("button");
  removeBtn.className = "chip-remove";
  removeBtn.innerHTML = CHIP_REMOVE_ICON;
  removeBtn.title = "Remove from pinned list";
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    nestRemoveFromNest(item.url).then(loadKept);
  });

  chip.append(dot, img, span, removeBtn);
  chip.addEventListener("click", () => {
    if (liveTab) activateTab(liveTab);
    else chrome.tabs.create({ url: item.url });
  });
  return chip;
}

function makeTabRow(tab) {
  const row = document.createElement("div");
  row.className = "tab-row" + (tab.active ? " active" : "");

  const img = document.createElement("img");
  img.className = "favicon";
  img.src = faviconFor(tab);
  img.onerror = () => (img.style.visibility = "hidden");

  const textWrap = document.createElement("div");
  textWrap.className = "tab-text";
  const title = document.createElement("div");
  title.className = "tab-title";
  title.textContent = tab.title || tab.url || "Untitled tab";
  const domain = document.createElement("div");
  domain.className = "tab-domain";
  domain.textContent = domainOf(tab.url);
  textWrap.append(title, domain);

  const actions = document.createElement("div");
  actions.className = "row-actions";

  const isPinned = keptItems.some((k) => k.url === tab.url);
  const pinBtn = document.createElement("button");
  pinBtn.className = "icon-btn" + (isPinned ? " pinned" : "");
  pinBtn.innerHTML = isPinned ? PIN_ICON : PIN_OUTLINE_ICON;
  pinBtn.title = isPinned
    ? "Remove from pinned list"
    : "Pin — stays in this list even after you close or unpin the tab";
  pinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePinned(tab);
  });

  const closeBtn = document.createElement("button");
  closeBtn.className = "icon-btn close-btn";
  closeBtn.innerHTML = CLOSE_ICON;
  closeBtn.title = "Close tab";
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    chrome.tabs.remove(tab.id).then(loadTabs);
  });

  actions.append(pinBtn, closeBtn);
  row.append(img, textWrap, actions);
  row.addEventListener("click", () => activateTab(tab));
  return row;
}

function render() {
  const filtered = allTabs.filter(matches);
  tabCountEl.textContent = `${allTabs.length} tab${allTabs.length === 1 ? "" : "s"}`;

  windowsSection.innerHTML = "";
  pinnedRow.innerHTML = "";

  const q = query.toLowerCase();
  const keptFiltered = query
    ? keptItems.filter((k) => k.title.toLowerCase().includes(q) || k.url.toLowerCase().includes(q))
    : keptItems;
  pinnedCount.textContent = keptFiltered.length ? `· ${keptFiltered.length}` : "";
  pinnedEmpty.hidden = keptItems.length !== 0;
  keptFiltered.forEach((item) => pinnedRow.appendChild(makeKeptChip(item)));

  const byWindow = new Map();
  filtered.forEach((tab) => {
    if (!byWindow.has(tab.windowId)) byWindow.set(tab.windowId, []);
    byWindow.get(tab.windowId).push(tab);
  });

  const multiWindow = byWindow.size > 1;
  let i = 0;
  for (const [windowId, tabs] of byWindow) {
    i++;
    const group = document.createElement("div");
    group.className = "window-group";
    if (multiWindow) {
      const label = document.createElement("div");
      label.className = "window-title";
      label.textContent = `Window ${i} · ${tabs.length} tab${tabs.length === 1 ? "" : "s"}`;
      group.appendChild(label);
    }
    tabs.sort((a, b) => a.index - b.index).forEach((tab) => group.appendChild(makeTabRow(tab)));
    windowsSection.appendChild(group);
  }

  const hasAnything = filtered.length > 0;
  emptyState.hidden = hasAnything || !query;
  emptyQuery.textContent = query;
  windowsSection.hidden = !hasAnything;

  const unpinnedOpenCount = allTabs.filter((t) => !keptItems.some((k) => k.url === t.url)).length;
  pinAllBtn.disabled = unpinnedOpenCount === 0;
  pinAllBtn.textContent = "";
  pinAllBtn.innerHTML = `<svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M14.7 2.3a1 1 0 0 0-1.4 0l-1 1a1 1 0 0 0 0 1.4l.3.3-3.6 3.6-2.6-.6a1 1 0 0 0-1 .3L4 9.7a1 1 0 0 0 0 1.4l4 4-5 5a1 1 0 1 0 1.4 1.4l5-5 4 4a1 1 0 0 0 1.4 0l1.4-1.4a1 1 0 0 0 .3-1l-.6-2.6 3.6-3.6.3.3a1 1 0 0 0 1.4 0l1-1a1 1 0 0 0 0-1.4z"/></svg>` +
    (unpinnedOpenCount === 0 ? " All open tabs pinned" : ` Pin all open tabs (${unpinnedOpenCount})`);
}

function renderClosed() {
  closedList.innerHTML = "";
  const entries = closedSessions.filter((s) => s.tab || s.window);
  closedCount.textContent = entries.length ? `· ${entries.length}` : "";
  closedSection.hidden = entries.length === 0;

  entries.forEach((session) => {
    const item = session.tab || (session.window && session.window.tabs && session.window.tabs[0]);
    if (!item) return;
    const row = document.createElement("div");
    row.className = "closed-row";
    row.title = "Restore";

    const img = document.createElement("img");
    img.className = "favicon";
    img.src = faviconFor(item);
    img.onerror = () => (img.style.visibility = "hidden");

    const textWrap = document.createElement("div");
    textWrap.className = "tab-text";
    const title = document.createElement("div");
    title.className = "tab-title";
    const isWindow = !!session.window;
    title.textContent = isWindow
      ? `Window with ${session.window.tabs.length} tabs`
      : item.title || item.url || "Closed tab";
    const domain = document.createElement("div");
    domain.className = "tab-domain";
    domain.textContent = isWindow ? "" : domainOf(item.url);
    textWrap.append(title, domain);

    const restoreIcon = document.createElement("div");
    restoreIcon.className = "restore-icon";
    restoreIcon.innerHTML = RESTORE_ICON;

    row.append(img, textWrap, restoreIcon);
    row.addEventListener("click", () => {
      chrome.sessions.restore(session.tab ? session.tab.sessionId : session.window.sessionId).then(() => {
        loadTabs();
        loadClosed();
      });
    });
    closedList.appendChild(row);
  });
}

closedToggle.addEventListener("click", () => {
  const open = !closedList.hidden;
  closedList.hidden = open;
  closedToggle.classList.toggle("open", !open);
});

searchInput.addEventListener("input", (e) => {
  query = e.target.value.trim();
  render();
});

pinAllBtn.addEventListener("click", async () => {
  for (const tab of allTabs) {
    await nestAddToNest(tab);
  }
  await loadKept();
});

// Any tab-list change re-renders the live sections; the pinned list only
// changes through nest-storage.js calls (explicit pin/unpin/remove), never
// as a side effect of a tab closing.
chrome.tabs.onCreated.addListener(loadTabs);
chrome.tabs.onRemoved.addListener(() => {
  loadTabs();
  loadClosed();
});
chrome.tabs.onUpdated.addListener(loadTabs);
chrome.tabs.onMoved.addListener(loadTabs);

// The background worker can also capture newly-pinned tabs, so listen for
// storage changes to stay in sync even if that happened while this popup
// was closed.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.nestKept) {
    keptItems = changes.nestKept.newValue || [];
    render();
  }
});

loadTabs();
loadKept();
loadClosed();
