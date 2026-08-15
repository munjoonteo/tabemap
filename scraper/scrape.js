// Tabelog scraper
//
// Usage:
//   node scrape.js        — full scrape: collect all URLs, scrape every detail page
//   node scrape.js sync   — incremental sync: only scrape new restaurants, remove deleted ones
//
// The sync mode:
//   1. Scrapes all saved-list pages to get the current set of URLs + personal ratings
//   2. Removes restaurants no longer in your saved list
//   3. Only visits detail pages for restaurants not already in restaurants.json
//   4. Updates personal_rating for existing restaurants from the list page (no detail visit needed)

import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync, copyFileSync } from 'fs';
import { createInterface } from 'readline';
import { randomUUID } from 'crypto';

function backupData() {
  if (existsSync(OUT_PATH)) {
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = OUT_PATH.replace('.json', `.backup-${ts}.json`);
    copyFileSync(OUT_PATH, backupPath);
    console.log(`Backed up to ${backupPath}`);
  }
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const waitForEnter = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));

const SAVED_LIST_URL = 'https://tabelog.com/rvwr/teomunjoon/hozon_restaurants/list';
const OUT_PATH = './restaurants.json';
const RST_URL_RE = /tabelog\.com\/[a-z]+\/[A-Z]\d+\/[A-Z]\d+\/\d+\/$/;

// ── helpers ───────────────────────────────────────────────────────────────────

function parseMaxYen(str) {
  if (!str) return null;
  const nums = str.replace(/,/g, '').match(/\d+/g);
  if (!nums) return null;
  return parseInt(nums[nums.length - 1], 10);
}

function yenToTier(maxYen) {
  if (maxYen === null) return null;
  if (maxYen < 1000) return 1;
  if (maxYen < 2000) return 2;
  if (maxYen < 5000) return 3;
  return 4;
}

function normalizeUrl(url) {
  return url.replace(/\/$/, '');
}

// ── browser setup ─────────────────────────────────────────────────────────────

async function launchBrowser() {
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
  return { browser, page };
}

// ── collect URLs from list pages ──────────────────────────────────────────────
// Returns Set<normalizedUrl>

async function collectListData(page) {
  const result = new Set();
  let nextUrl = SAVED_LIST_URL;
  let pageNum = 1;

  while (nextUrl) {
    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    const urls = await page.evaluate((re) => {
      return [
        ...new Set(
          Array.from(document.querySelectorAll('a[href]'))
            .map((a) => a.href)
            .filter((h) => new RegExp(re).test(h)),
        ),
      ];
    }, RST_URL_RE.source);

    if (urls.length === 0) break;

    for (const url of urls) result.add(normalizeUrl(url));

    console.log(`Page ${pageNum}: found ${urls.length} restaurants (total: ${result.size})`);

    nextUrl = await page.evaluate(
      () =>
        document.querySelector('.c-pagination__arrow--next:not([disabled]), a[rel="next"]')?.href ??
        null,
    );
    pageNum++;
  }

  return result;
}

// ── scrape a single restaurant detail page ────────────────────────────────────

async function extractRestaurantData(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

  const raw = await page.evaluate(() => {
    let lat = 0,
      lng = 0;
    for (const s of document.querySelectorAll('script')) {
      if (s.type === 'application/ld+json') {
        try {
          const json = JSON.parse(s.textContent);
          const geo = json.geo || json['@graph']?.find((x) => x.geo)?.geo;
          if (geo?.latitude) {
            lat = parseFloat(geo.latitude);
            lng = parseFloat(geo.longitude);
            break;
          }
        } catch {}
      }
      const m = s.textContent?.match(/"lat"\s*:\s*([\d.]+).*?"lng"\s*:\s*([\d.]+)/);
      if (m) {
        lat = parseFloat(m[1]);
        lng = parseFloat(m[2]);
        break;
      }
    }

    const name =
      document.querySelector('.display-name span, h2.display-name')?.textContent?.trim() ||
      document.title.split(/\s*[-–]\s*/)[0].trim();

    const address = (() => {
      for (const row of document.querySelectorAll('.rstinfo-table tr, .rstdtl-info__table tr')) {
        const th = row.querySelector('th, dt');
        if (th?.textContent?.includes('住所')) {
          return row.querySelector('td, dd')?.textContent?.trim().split('\n')[0].trim() || '';
        }
      }
      return (
        document
          .querySelector('.rstdtl-side-yoyaku__address')
          ?.textContent?.split('\n')[0]
          .trim() || ''
      );
    })();

    const ratingEl = document.querySelector('.rdheader-rating__score-val-dtl');
    const tabelog_rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) : 0;

    // personal rating from bookmark panel on this page
    const personalRatingEl = document.querySelector('b.p-btn-bkm-actionpanel__raiting-val');
    const personal_rating = personalRatingEl
      ? parseFloat(personalRatingEl.textContent.trim()) || null
      : null;

    const cuisine = (() => {
      for (const row of document.querySelectorAll('.rstinfo-table tr, .rstdtl-info__table tr')) {
        const th = row.querySelector('th, dt');
        if (th?.textContent?.includes('ジャンル')) {
          const td = row.querySelector('td, dd');
          const text = (td?.querySelector('a')?.textContent || td?.textContent || '').trim();
          return text.split(/[（(、,，・]/)[0].trim();
        }
      }
      return '';
    })();

    const lunchPrice = (() => {
      for (const row of document.querySelectorAll('tr')) {
        if (row.querySelector('th, dt')?.textContent?.match(/ランチ|昼/))
          return row.querySelector('td, dd')?.textContent?.trim() || null;
      }
      return null;
    })();

    const dinnerPrice = (() => {
      for (const row of document.querySelectorAll('tr')) {
        if (row.querySelector('th, dt')?.textContent?.match(/ディナー|夜/))
          return row.querySelector('td, dd')?.textContent?.trim() || null;
      }
      return document.querySelector('.rdheader-budget__price-target')?.textContent?.trim() || null;
    })();

    const awards = [];
    for (const el of document.querySelectorAll(
      '[class*="c-badge-award--"], [class*="c-badge-hyakumeiten--"]',
    )) {
      const cls = el.className;
      const awardMatch = cls.match(/c-badge-award--(\d+)(silver|gold|bronze)/i);
      if (awardMatch) {
        awards.push({ type: awardMatch[2].toLowerCase(), year: parseInt(awardMatch[1]) });
        continue;
      }
      const hyaku = cls.match(/c-badge-hyakumeiten--(\d+)-?(\w*)/);
      if (hyaku) {
        const entry = { type: 'hyakumeiten', year: parseInt(hyaku[1]) };
        if (hyaku[2]) entry.category = hyaku[2].charAt(0).toUpperCase() + hyaku[2].slice(1);
        awards.push(entry);
      }
    }

    // deduplicate awards by type+category+year
    const uniqueAwards = awards.filter(
      (a, i, arr) =>
        arr.findIndex(
          (b) => b.type === a.type && b.category === a.category && b.year === a.year,
        ) === i,
    );

    return {
      name,
      address,
      lat,
      lng,
      tabelog_rating,
      personal_rating,
      cuisine,
      lunchPrice,
      dinnerPrice,
      awards: uniqueAwards,
    };
  });

  const price_tier =
    yenToTier(parseMaxYen(raw.dinnerPrice)) ?? yenToTier(parseMaxYen(raw.lunchPrice)) ?? 2;

  return {
    name: raw.name,
    address: raw.address,
    lat: raw.lat,
    lng: raw.lng,
    tabelog_rating: raw.tabelog_rating,
    personal_rating: raw.personal_rating,
    cuisine: raw.cuisine,
    price_tier,
    awards: raw.awards,
  };
}

// ── full scrape ───────────────────────────────────────────────────────────────

async function fullScrape() {
  backupData();
  const { browser, page } = await launchBrowser();
  await page.goto('https://tabelog.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  console.log('Sign in to Tabelog, then press Enter here.\n');
  await waitForEnter('Press Enter when ready > ');

  console.log('Collecting saved restaurant URLs...');
  const currentUrls = await collectListData(page);
  const urls = [...currentUrls];
  console.log(`\nFound ${urls.length} restaurants. Scraping details...\n`);

  const restaurants = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    process.stdout.write(`[${i + 1}/${urls.length}] ${url}...`);
    try {
      const data = await extractRestaurantData(page, url);
      restaurants.push({
        id: randomUUID(),
        ...data,
        tabelog_url: url + '/',
        tags: [],
        notes: '',
        visited: data.personal_rating != null,
      });
      process.stdout.write(' ✓\n');
    } catch (err) {
      process.stdout.write(` ✗ (${err.message})\n`);
    }
    await page.waitForTimeout(800 + Math.random() * 400);
  }

  writeFileSync(OUT_PATH, JSON.stringify(restaurants, null, 2));
  console.log(`\nDone. Saved ${restaurants.length} restaurants to ${OUT_PATH}`);
  console.log('\nTo upload to Cloudflare:');
  console.log(
    '  cd ../worker && node upload.js https://tabemap-api.tabemap.workers.dev YOUR_TOKEN',
  );
  rl.close();
  await browser.close();
}

// ── incremental sync ──────────────────────────────────────────────────────────

async function sync() {
  if (!existsSync(OUT_PATH)) {
    console.error(`${OUT_PATH} not found — run a full scrape first.`);
    process.exit(1);
  }
  backupData();
  const existing = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
  const existingByUrl = new Map(existing.map((r) => [normalizeUrl(r.tabelog_url), r]));
  console.log(`Loaded ${existing.length} restaurants from ${OUT_PATH}\n`);

  const { browser, page } = await launchBrowser();
  await page.goto('https://tabelog.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  console.log('Sign in to Tabelog, then press Enter here.\n');
  await waitForEnter('Press Enter when ready > ');

  console.log('Collecting current saved list...');
  const currentUrls = await collectListData(page);
  const existingUrls = new Set(existingByUrl.keys());

  const newUrls = [...currentUrls].filter((u) => !existingUrls.has(u));
  const deletedUrls = [...existingUrls].filter((u) => !currentUrls.has(u));
  const keptUrls = [...currentUrls].filter((u) => existingUrls.has(u));

  console.log(
    `\nDiff: ${newUrls.length} new, ${deletedUrls.length} deleted, ${keptUrls.length} unchanged`,
  );

  if (deletedUrls.length > 0) {
    console.log('\nRemoved from your saved list:');
    deletedUrls.forEach((u) => console.log('  -', existingByUrl.get(u)?.name ?? u));
  }

  // scrape only new restaurants
  const newRestaurants = [];
  if (newUrls.length > 0) {
    console.log(`\nScraping ${newUrls.length} new restaurant(s)...\n`);
    for (let i = 0; i < newUrls.length; i++) {
      const url = newUrls[i];
      process.stdout.write(`[${i + 1}/${newUrls.length}] ${url}...`);
      try {
        const data = await extractRestaurantData(page, url);
        newRestaurants.push({
          id: randomUUID(),
          ...data,
          tabelog_url: url + '/',
          tags: [],
          notes: '',
          visited: data.personal_rating != null,
        });
        process.stdout.write(' ✓\n');
      } catch (err) {
        process.stdout.write(` ✗ (${err.message})\n`);
      }
      await page.waitForTimeout(800 + Math.random() * 400);
    }
  }

  // update personal_rating on kept restaurants from list page (free — already scraped)
  const updated = [
    ...keptUrls.map((url) => existingByUrl.get(url)), // preserve everything including personal_rating
    ...newRestaurants,
  ];

  writeFileSync(OUT_PATH, JSON.stringify(updated, null, 2));
  console.log(
    `\nDone. ${updated.length} restaurants saved (${newRestaurants.length} added, ${deletedUrls.length} removed)`,
  );
  console.log('\nTo upload to Cloudflare:');
  console.log(
    '  cd ../worker && node upload.js https://tabemap-api.tabemap.workers.dev YOUR_TOKEN',
  );
  rl.close();
  await browser.close();
}

// ── entry point ───────────────────────────────────────────────────────────────

const mode = process.argv[2];
if (mode === 'sync') {
  sync().catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  fullScrape().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
