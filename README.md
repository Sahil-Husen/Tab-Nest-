# Nest — Tab Keeper

A Chrome extension that pulls every open tab — pinned and unpinned, across all windows — into one clean list, plus a safety net of recently closed tabs so an accidental close never means losing your place.

## Install (unpacked, for now)
1. Unzip `nest-tab-keeper.zip` somewhere permanent (don't delete the folder after installing — Chrome loads it live from there).
2. Go to `chrome://extensions`.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped `tab-nest` folder.
5. Pin the Nest icon to your toolbar for one-click access.

## What it does
- **Pinned list** at the top — click the pin icon on any tab to add it here permanently. Unpinning or closing that tab in Chrome does **not** remove it. Only the × on the chip does.
- **Auto-capture**: any tab you pin using Chrome's own pin feature is automatically added to this list too — even if the popup isn't open, since it's handled in the background.
- **Already-pinned tabs get imported** the moment you install the extension, so tabs you pinned before installing Nest show up right away.
- **Pin all open tabs** — one click to add every currently open tab to the permanent list, useful when you've got a big session going and don't want to click through each one.
- **All open tabs**, grouped by window, with favicon, title, and domain, plus a search box.
- **Recently closed**, lower down — restores a tab or a whole closed window with one click (this one's powered by Chrome's own session history, separate from your pinned list).
- **Toolbar badge** shows your live tab count at a glance.

## Notes
- The pinned list is saved with `chrome.storage.local` and managed partly by a background script — it survives closing tabs, unpinning them, and restarting Chrome. It only shrinks when you explicitly remove an item.
- "Recently closed" is separate and temporary — it typically holds the last ~25 closed tabs/windows for the current browsing session (cleared on restart). Your pinned list is not affected by this limit.
- Everything runs locally; nothing is sent anywhere.
