import { expect, test, type Browser, type Page, type ViewportSize } from '@playwright/test';

const appUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:5179';
const workspaceStorageKey = 'macos_vscode_workspace_v1';
const saveModifier = process.platform === 'darwin' ? 'Meta' : 'Control';

async function openPage(browser: Browser, viewport: ViewportSize, isMobile = false) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: isMobile ? 2 : 1,
    hasTouch: isMobile,
    isMobile,
  });
  const page = await context.newPage();
  await page.goto(appUrl);
  await page.evaluate((key) => window.localStorage.removeItem(key), workspaceStorageKey);
  await page.reload();

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

async function openVSCode(page: Page) {
  await page.locator('[data-dock-app-id="vscode"]').click();
  await expect(page.getByTestId('vscode-app')).toBeVisible();
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 20_000 });
}

async function replaceEditorText(page: Page, text: string) {
  await page.locator('.monaco-editor').click();
  await page.keyboard.press(`${saveModifier}+A`);
  await page.keyboard.type(text);
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

test('opens VS Code, edits, saves, reloads, and restores the virtual workspace', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });

  await unlock(page);
  await openVSCode(page);

  await replaceEditorText(page, `const persistedMarker = 'saved through monaco';\n`);
  await expect(page.getByTestId('vscode-save-status')).toContainText('unsaved');

  await page.keyboard.press(`${saveModifier}+S`);
  await expect(page.getByTestId('vscode-save-status')).toContainText('Saved');

  await page.reload();
  await unlock(page);
  await openVSCode(page);
  await expect(page.locator('.monaco-editor')).toContainText('persistedMarker');

  await context.close();
});

test('keeps unsaved edits when switching tabs', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });

  await unlock(page);
  await openVSCode(page);

  await replaceEditorText(page, `const tabSwitchMarker = 'still open';\n`);
  await expect(page.getByTestId('vscode-save-status')).toContainText('unsaved');

  await page.getByRole('button', { name: 'Open src/components/Dock.tsx' }).click();
  await expect(page.locator('.monaco-editor')).toContainText('dockItems');

  await page.getByRole('button', { name: 'Open tab App.tsx' }).click();
  await expect(page.locator('.monaco-editor')).toContainText('tabSwitchMarker');

  await context.close();
});

test('search finds workspace content and opens the selected result', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });

  await unlock(page);
  await openVSCode(page);

  await page.getByRole('button', { name: 'Search' }).click();
  await page.getByPlaceholder('Search').fill('dockItems');
  await expect(page.getByRole('button', { name: /Dock\.tsx/ }).first()).toBeVisible();

  await page.getByRole('button', { name: /Dock\.tsx/ }).first().click();
  await expect(page.locator('.monaco-editor')).toContainText('dockItems');

  await context.close();
});

test('phone landscape keeps the editor visible without page overflow', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 844, height: 390 }, true);

  await unlock(page);
  await page.locator('[data-dock-app-id="vscode"]').click();

  await expect(page.locator('.phone-landscape')).toBeVisible();
  await expect(page.getByTestId('vscode-app')).toBeVisible();
  await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('.vscode-sidebar')).toBeHidden();
  await expectNoHorizontalPageOverflow(page);

  await context.close();
});
