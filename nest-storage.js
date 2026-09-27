// Shared storage layer for Nest's permanent pinned list.
// Loaded by both background.js (importScripts) and popup.html (<script>),
// so a tab can be captured even if the popup is never opened.
// Keyed by URL. Survives tab close, tab unpin, and browser restart —
// only an explicit removeFromNest() call takes an entry out.

async function nestGetKept() {
  const { nestKept } = await chrome.storage.local.get("nestKept");
  return Array.isArray(nestKept) ? nestKept : [];
}

async function nestSaveKept(items) {
  await chrome.storage.local.set({ nestKept: items });
}

async function nestAddToNest(tab) {
  if (!tab || !tab.url) return;
  const kept = await nestGetKept();
  if (kept.some((k) => k.url === tab.url)) return;
  kept.unshift({
    url: tab.url,
    title: tab.title || tab.url,
    favIconUrl: tab.favIconUrl || "",
    addedAt: Date.now(),
  });
  await nestSaveKept(kept);
}

async function nestRemoveFromNest(url) {
  const kept = await nestGetKept();
  await nestSaveKept(kept.filter((k) => k.url !== url));
}

async function nestImportAlreadyPinned() {
  const pinnedTabs = await chrome.tabs.query({ pinned: true });
  for (const tab of pinnedTabs) {
    await nestAddToNest(tab);
  }
}
