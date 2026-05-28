import { expect, test, type Browser, type Page, type ViewportSize } from '@playwright/test';

const appUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:5179';
const workspaceStorageKey = 'macos_vscode_workspace_v1';
const desktopFilesStorageKey = 'macos_virtual_desktop_files_v1';
const desktopOpenStorageKey = 'macos_virtual_desktop_open_request_v1';
const extensionsStorageKey = 'macos_vscode_extensions_v1';
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
  await page.evaluate((keys) => {
    keys.forEach((key) => window.localStorage.removeItem(key));
  }, [workspaceStorageKey, desktopFilesStorageKey, desktopOpenStorageKey, extensionsStorageKey]);
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

test('source control tracks and commits virtual workspace changes', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });

  await unlock(page);
  await openVSCode(page);

  await replaceEditorText(page, `const gitMarker = 'tracked change';\n`);
  await page.getByRole('button', { name: 'Source Control' }).click();
  await expect(page.getByRole('button', { name: 'M src/App.tsx' })).toBeVisible();

  await page.getByPlaceholder('Commit message').fill('Track virtual git changes');
  await page.getByRole('button', { name: 'Commit' }).click();
  await expect(page.getByText('No source control changes.')).toBeVisible();
  await expect(page.locator('footer')).toContainText('Clean');

  await context.close();
});

test('extensions install and enable editor capabilities', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });

  await unlock(page);
  await openVSCode(page);

  await page.getByRole('button', { name: 'Extensions' }).click();
  await page.getByRole('button', { name: 'Install Prettier Formatter' }).click();
  await expect(page.getByRole('button', { name: 'Disable Prettier Formatter' })).toBeVisible();

  await context.close();
});

test('saves active files to the macOS web desktop', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });

  await unlock(page);
  await openVSCode(page);

  await replaceEditorText(page, `const desktopMarker = 'saved to desktop';\n`);
  await page.getByRole('button', { name: 'Save active file to Desktop' }).click();

  await expect(page.getByText('App.tsx saved to Desktop')).toBeVisible();
  await expect(page.getByTestId('virtual-desktop-file')).toHaveCount(1);

  await context.close();
});

test('runs JavaScript files in the built-in output panel', async ({ browser }) => {
  const { context, page } = await openPage(browser, { width: 1440, height: 900 });

  await unlock(page);
  await openVSCode(page);

  await page.getByRole('button', { name: 'Open src/run-demo.js' }).click();
  await page.getByRole('button', { name: 'Run active file' }).click();
  await expect(page.getByTestId('vscode-run-console')).toContainText('Running virtual VS Code workspace');

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
