importScripts("nest-storage.js");

// Keeps the toolbar badge in sync with how many tabs are open.
async function refreshBadge() {
  const tabs = await chrome.tabs.query({});
  const count = tabs.length;
  await chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#2A9D8F" });
}

// Any tab that becomes pinned in Chrome is captured into Nest's permanent
// list immediately -- this runs in the background, so it works even if the
// popup is never opened. Unpinning or closing that tab later never removes
// it; only the user removing it from Nest does.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.pinned === true) {
    nestAddToNest(tab);
  }
  refreshBadge();
});

chrome.tabs.onCreated.addListener(refreshBadge);
chrome.tabs.onRemoved.addListener(refreshBadge);
chrome.tabs.onAttached.addListener(refreshBadge);
chrome.tabs.onDetached.addListener(refreshBadge);

chrome.runtime.onInstalled.addListener(() => {
  nestImportAlreadyPinned();
  refreshBadge();
});
chrome.runtime.onStartup.addListener(() => {
  nestImportAlreadyPinned();
  refreshBadge();
});
