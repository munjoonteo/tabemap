import { chromium } from 'playwright';

export const RST_URL_RE = /tabelog\.com\/[a-z]+\/[A-Z]\d+\/[A-Z]\d+\/\d+\/$/;

export async function launchBrowser() {
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

// Collects all restaurant URLs from a paginated Tabelog list page.
// Returns Set<string> of normalized URLs (trailing slash stripped).
// label is used in progress logging, e.g. 'restaurants' or 'visited restaurants'.
export async function collectRestaurantUrls(page, startUrl, label = 'restaurants') {
  const result = new Set();
  let nextUrl = startUrl;
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

    if (urls.length === 0) {
      const hasNextButton = await page.evaluate(
        () =>
          !!document.querySelector('.c-pagination__arrow--next:not([disabled]), a[rel="next"]'),
      );
      if (hasNextButton) {
        console.warn(
          `Page ${pageNum}: 0 restaurant URLs found but a next-page button is present — possible bot detection or login expired. Stopping early.`,
        );
      }
      break;
    }

    for (const url of urls) result.add(url.replace(/\/$/, ''));
    console.log(`Page ${pageNum}: found ${urls.length} ${label} (total: ${result.size})`);

    nextUrl = await page.evaluate(
      () =>
        document.querySelector('.c-pagination__arrow--next:not([disabled]), a[rel="next"]')?.href ??
        null,
    );
    pageNum++;
  }

  return result;
}
