// Scrapes your Tabelog visited-restaurants list and marks matching entries
// as visited:true in restaurants.json.
//
// Usage:
//   node sync_visited.js
//   node sync_visited.js https://tabelog.com/rvwr/teomunjoon/rvwr_list/  (custom URL)
//
// The script does NOT remove visited:true from entries that are no longer
// in the visited list — it only adds. To mark a restaurant as unvisited,
// edit it manually in the app.

import { writeFileSync, readFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { launchBrowser, collectRestaurantUrls } from './utils.js';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const rl = createInterface({ input: process.stdin, output: process.stdout });
const waitForEnter = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const OUT_PATH = `${SCRIPT_DIR}/restaurants.json`;

// Tabelog visited list URL — adjust if yours differs
const DEFAULT_VISITED_URL = 'https://tabelog.com/rvwr/teomunjoon/visited_restaurants/list/';

async function main() {
  const visitedListUrl = process.argv[2] || DEFAULT_VISITED_URL;

  const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
  console.log(`Loaded ${existing.length} restaurants from ${OUT_PATH}`);

  // Build a map of tabelog_url → index for fast lookup
  const urlIndex = new Map(existing.map((r, i) => [r.tabelog_url.replace(/\/$/, ''), i]));

  const { browser, page } = await launchBrowser();

  await page.goto('https://tabelog.com/account/login/', { waitUntil: 'domcontentloaded' });
  console.log(`\nSign in to Tabelog, then navigate to your visited list if needed.`);
  console.log(`Target URL: ${visitedListUrl}\n`);
  await waitForEnter('Press Enter when ready > ');

  console.log('\nCollecting visited restaurant URLs...');
  const visitedSet = await collectRestaurantUrls(page, visitedListUrl, 'visited restaurants');
  console.log(`\nFound ${visitedSet.size} visited restaurants total.\n`);

  if (visitedSet.size === 0) {
    console.log('Nothing to update. Check the URL and try again.');
    rl.close();
    await browser.close();
    return;
  }

  let matched = 0;
  let alreadyMarked = 0;
  let notInList = 0;

  const updated = existing.map((r) => {
    const key = r.tabelog_url.replace(/\/$/, '');
    if (visitedSet.has(key)) {
      if (r.visited) {
        alreadyMarked++;
        return r;
      }
      matched++;
      return { ...r, visited: true };
    }
    notInList++;
    return r;
  });

  writeFileSync(OUT_PATH, JSON.stringify(updated, null, 2));

  console.log(`Done.`);
  console.log(`  Newly marked visited: ${matched}`);
  console.log(`  Already visited:      ${alreadyMarked}`);
  console.log(`  Not in visited list:  ${notInList}`);
  console.log(`  Written to:           ${OUT_PATH}`);

  if (notInList > 0) {
    console.log(
      `\nNote: ${[...visitedSet].filter((u) => !urlIndex.has(u)).length} visited URLs were not found in restaurants.json`,
    );
    console.log('(These are restaurants you visited but did not save to your list)');
  }

  rl.close();
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
