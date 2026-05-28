import { expect, test, type Browser, type Page, type ViewportSize } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const screenshotDir = path.join(process.cwd(), 'ui-test-screenshots');
const appUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:5179';

const phonePortraitViewports: ViewportSize[] = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
];

const phoneLandscapeViewports: ViewportSize[] = [
  { width: 740, height: 360 },
  { width: 844, height: 390 },
  { width: 932, height: 430 },
];

test.beforeAll(async () => {
  await fs.mkdir(screenshotDir, { recursive: true });
});

async function openPhonePage(browser: Browser, viewport: ViewportSize) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.goto(appUrl);

  return { context, page };
}

async function unlock(page: Page) {
  const passwordInput = page.getByPlaceholder('Enter password (any key)');
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('test');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.locator('[data-app-window-id="finder"]')).toBeVisible();
  await page.waitForTimeout(1_250);
}

async function expectNoHorizontalPageOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const documentElement = document.documentElement;
    const body = document.body;

    return {
      clientWidth: documentElement.clientWidth,
      scrollWidth: Math.max(documentElement.scrollWidth, body.scrollWidth),
    };
  });

  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test.describe('phone portrait orientation guard', () => {
  for (const viewport of phonePortraitViewports) {
    test(`shows only the rotate prompt at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
      const { context, page } = await openPhonePage(browser, viewport);

      await expect(page.getByTestId('rotate-phone-overlay')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Rotate Your Phone' })).toBeVisible();
      await expect(page.getByTestId('rotate-phone-overlay').locator('button')).toHaveCount(0);
      await expectNoHorizontalPageOverflow(page);

      const overlayOwnsInteraction = await page.evaluate(() => {
        const hit = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
        return Boolean(hit?.closest('[data-testid="rotate-phone-overlay"]'));
      });
      expect(overlayOwnsInteraction).toBe(true);

      if (viewport.width === 390) {
        await page.screenshot({
          path: path.join(screenshotDir, 'phone-portrait-rotate.png'),
        });
      }

      await context.close();
    });
  }
});

test.describe('phone landscape compact macOS layout', () => {
  for (const viewport of phoneLandscapeViewports) {
    test(`fits the focused window at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
      const { context, page } = await openPhonePage(browser, viewport);

      await expect(page.getByTestId('rotate-phone-overlay')).toHaveCount(0);
      await unlock(page);
      await expect(page.locator('.phone-landscape')).toBeVisible();
      await expect(page.locator('[data-app-window-id="finder"]')).toBeVisible();
      await expect(page.locator('.window-resize-handle')).toHaveCount(0);
      await expect(page.locator('.phone-desktop-icons')).toBeVisible();
      await expectNoHorizontalPageOverflow(page);

      if (viewport.width === 844) {
        await page.screenshot({
          path: path.join(screenshotDir, 'phone-landscape-finder.png'),
        });
      }

      await context.close();
    });
  }

  test('switches apps and preserves touch input in landscape', async ({ browser }) => {
    const { context, page } = await openPhonePage(browser, { width: 844, height: 390 });

    await unlock(page);

    await page.locator('[data-dock-app-id="chrome"]').click();
    await expect(page.locator('[data-app-window-id="chrome"]')).toBeVisible();
    await expect(page.locator('.chrome-tabs')).toBeVisible();
    await expect(page.getByTestId('chrome-address-input')).toBeVisible();
    await expectNoHorizontalPageOverflow(page);
    await page.screenshot({
      path: path.join(screenshotDir, 'phone-landscape-chrome.png'),
    });

    await page.locator('[data-dock-app-id="notes"]').click();
    await expect(page.locator('[data-app-window-id="notes"]')).toBeVisible();
    const notesInput = page.locator('.notes-app textarea');
    await notesInput.fill('Playwright phone landscape smoke test');
    await expect(notesInput).toHaveValue('Playwright phone landscape smoke test');

    await page.locator('[data-dock-app-id="terminal"]').click();
    await expect(page.locator('[data-app-window-id="terminal"]')).toBeVisible();
    const terminalInput = page.locator('.terminal-app input[type="text"]');
    await terminalInput.fill('help');
    await terminalInput.press('Enter');
    await expect(page.locator('.terminal-app')).toContainText('guest@macbook ~ % help');

    await context.close();
  });
});

test('chrome opens bookmarks and normalizes typed URLs', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(appUrl);
  await unlock(page);

  await page.locator('[data-dock-app-id="chrome"]').click();
  await expect(page.locator('[data-app-window-id="chrome"]')).toBeVisible();
  await expect(page.locator('.chrome-tabs')).toBeVisible();
  await expect(page.getByTestId('chrome-bookmarks-bar')).toBeVisible();

  await page.getByTestId('chrome-start-bookmark-cosmic-nft').click();
  await expect(page.locator('.chrome-content')).toContainText('Nebula-99 Collapsar NFT');

  const addressInput = page.getByTestId('chrome-address-input');
  await addressInput.fill('example.com');
  await addressInput.press('Enter');
  await expect(page.getByTestId('chrome-external-frame')).toHaveAttribute('src', 'https://example.com');
  await expectNoHorizontalPageOverflow(page);

  await context.close();
});

test('desktop keeps overlapping-window behavior', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(appUrl);
  await unlock(page);
  await expect(page.getByTestId('rotate-phone-overlay')).toHaveCount(0);
  await expect(page.locator('.phone-landscape')).toHaveCount(0);
  await expect(page.locator('[data-app-window-id="finder"]')).toBeVisible();
  await expect(page.locator('.window-resize-handle')).toHaveCount(3);
  await expectNoHorizontalPageOverflow(page);

  await page.screenshot({
    path: path.join(screenshotDir, 'desktop-unlocked.png'),
  });

  await context.close();
});

test('desktop close animates before removing the window', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(appUrl);
  await unlock(page);

  const finderWindow = page.locator('[data-app-window-id="finder"]');
  await expect(finderWindow).toBeVisible();

  await page.getByRole('button', { name: 'Close Finder' }).click();
  await expect(finderWindow).toHaveCount(1);
  await expect.poll(async () => {
    return page.evaluate(() => {
      const element = document.querySelector<HTMLElement>('[data-app-window-id="finder"]');
      return element ? Number(window.getComputedStyle(element).opacity) : 0;
    });
  }, { timeout: 500 }).toBeLessThan(1);
  await expect(finderWindow).toHaveCount(0, { timeout: 1_000 });

  await context.close();
});

test('desktop windows can move behind the dock layer', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  await page.goto(appUrl);
  await unlock(page);

  const finderWindow = page.locator('[data-app-window-id="finder"]');
  const titleBar = finderWindow.locator('.window-titlebar');
  const dockItem = page.locator('[data-dock-app-id="finder"]');

  const titleBox = await titleBar.boundingBox();
  expect(titleBox).not.toBeNull();

  const dragX = titleBox!.x + titleBox!.width / 2;
  const dragY = titleBox!.y + titleBox!.height / 2;
  await page.mouse.move(dragX, dragY);
  await page.mouse.down();
  await page.mouse.move(dragX, 880, { steps: 12 });
  await page.mouse.up();

  const windowBox = await finderWindow.boundingBox();
  const dockBox = await dockItem.boundingBox();
  expect(windowBox).not.toBeNull();
  expect(dockBox).not.toBeNull();
  expect(windowBox!.y + windowBox!.height).toBeGreaterThan(dockBox!.y + 20);

  const dockOwnsItsLayer = await page.evaluate(() => {
    const dockItem = document.querySelector<HTMLElement>('[data-dock-app-id="finder"]');
    const rect = dockItem?.getBoundingClientRect();
    if (!rect) return false;

    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return Boolean(hit?.closest('[data-dock-app-id]'));
  });
  expect(dockOwnsItsLayer).toBe(true);

  await context.close();
});
