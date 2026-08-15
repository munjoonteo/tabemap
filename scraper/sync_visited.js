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

import { chromium } from 'playwright';
import { writeFileSync, readFileSync } from 'fs';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });
const waitForEnter = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const OUT_PATH = './restaurants.json';
const RST_URL_RE = /tabelog\.com\/[a-z]+\/[A-Z]\d+\/[A-Z]\d+\/\d+\/$/;

// Tabelog visited list URL — adjust if yours differs
const DEFAULT_VISITED_URL = 'https://tabelog.com/rvwr/teomunjoon/visited_restaurants/list/';

async function collectVisitedUrls(page, startUrl) {
  const urls = [];
  let nextUrl = startUrl;
  let pageNum = 1;

  while (nextUrl) {
    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const links = await page.evaluate((re) => {
      return [
        ...new Set(
          Array.from(document.querySelectorAll('a[href]'))
            .map((a) => a.href)
            .filter((h) => new RegExp(re).test(h)),
        ),
      ];
    }, RST_URL_RE.source);

    if (links.length === 0) {
      console.log(`Page ${pageNum}: no restaurant links found — check the URL is correct`);
      break;
    }

    urls.push(...links);
    console.log(
      `Page ${pageNum}: found ${links.length} visited restaurants (total: ${urls.length})`,
    );

    nextUrl = await page.evaluate(
      () =>
        document.querySelector('.c-pagination__arrow--next:not([disabled]), a[rel="next"]')?.href ??
        null,
    );
    pageNum++;
  }

  return [...new Set(urls)];
}

async function main() {
  const visitedListUrl = process.argv[2] || DEFAULT_VISITED_URL;

  const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
  console.log(`Loaded ${existing.length} restaurants from ${OUT_PATH}`);

  // Build a map of tabelog_url → index for fast lookup
  const urlIndex = new Map(existing.map((r, i) => [r.tabelog_url.replace(/\/$/, ''), i]));

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-default-browser-check',
    ],
  });
  const context = await browser.newContext({
    locale: 'ja-JP',
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
  });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = await context.newPage();

  await page.goto('https://tabelog.com/account/login/', { waitUntil: 'domcontentloaded' });
  console.log(`\nSign in to Tabelog, then navigate to your visited list if needed.`);
  console.log(`Target URL: ${visitedListUrl}\n`);
  await waitForEnter('Press Enter when ready > ');

  console.log('\nCollecting visited restaurant URLs...');
  const visitedUrls = await collectVisitedUrls(page, visitedListUrl);
  console.log(`\nFound ${visitedUrls.length} visited restaurants total.\n`);

  if (visitedUrls.length === 0) {
    console.log('Nothing to update. Check the URL and try again.');
    rl.close();
    await browser.close();
    return;
  }

  // Normalise URLs (strip trailing slash) for matching
  const visitedSet = new Set(visitedUrls.map((u) => u.replace(/\/$/, '')));

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
      `\nNote: ${visitedUrls.filter((u) => !urlIndex.has(u.replace(/\/$/, ''))).length} visited URLs were not found in restaurants.json`,
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
