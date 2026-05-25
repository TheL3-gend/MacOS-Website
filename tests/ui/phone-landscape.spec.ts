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

    await page.locator('[data-dock-app-id="safari"]').click();
    await expect(page.locator('[data-app-window-id="safari"]')).toBeVisible();
    await expect(page.locator('.safari-tabs')).toBeVisible();
    await expectNoHorizontalPageOverflow(page);
    await page.screenshot({
      path: path.join(screenshotDir, 'phone-landscape-safari.png'),
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
