import { expect, test, type Page } from '@playwright/test';

const appUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://127.0.0.1:5179';

async function unlock(page: Page) {
  const passwordInput = page.getByPlaceholder('Enter password (any key)');
  await expect(passwordInput).toBeVisible();
  await passwordInput.fill('test');
  await page.getByRole('button', { name: 'Unlock' }).click();
  await expect(page.locator('[data-app-window-id="finder"]')).toBeVisible();
  await page.waitForTimeout(1_250);
}

async function getMonthTitle(page: Page, monthOffset: number) {
  return page.evaluate((offset) => {
    const now = new Date();
    const month = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return month.toLocaleDateString([], {
      month: 'long',
      year: 'numeric',
    });
  }, monthOffset);
}

test('menu bar date opens a navigable calendar popover', async ({ page }) => {
  await page.goto(appUrl);
  await unlock(page);

  const currentMonth = await getMonthTitle(page, 0);
  const nextMonth = await getMonthTitle(page, 1);
  const previousMonth = await getMonthTitle(page, -1);
  const currentDay = await page.evaluate(() => String(new Date().getDate()));

  await page.getByTestId('menu-bar-date-time').click();

  const calendarPanel = page.getByTestId('calendar-panel');
  const monthTitle = page.getByTestId('calendar-month-title');
  await expect(calendarPanel).toBeVisible();
  await expect(monthTitle).toHaveText(currentMonth);
  await expect(calendarPanel.locator('[aria-current="date"]')).toHaveText(currentDay);

  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(monthTitle).toHaveText(nextMonth);

  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(monthTitle).toHaveText(currentMonth);

  await page.getByRole('button', { name: 'Previous month' }).click();
  await expect(monthTitle).toHaveText(previousMonth);

  await page.getByRole('button', { name: 'Today' }).click();
  await expect(monthTitle).toHaveText(currentMonth);

  await page.mouse.click(20, 80);
  await expect(calendarPanel).toHaveCount(0);
});

test('calendar shares menu-bar dropdown state with control centre', async ({ page }) => {
  await page.goto(appUrl);
  await unlock(page);

  await page.getByTestId('menu-bar-date-time').click();
  await expect(page.getByTestId('calendar-panel')).toBeVisible();

  await page.getByTestId('menu-bar-control-center').click();
  await expect(page.getByTestId('calendar-panel')).toHaveCount(0);
  await expect(page.getByTestId('control-center-panel')).toBeVisible();

  await page.getByTestId('menu-bar-date-time').click();
  await expect(page.getByTestId('control-center-panel')).toHaveCount(0);
  await expect(page.getByTestId('calendar-panel')).toBeVisible();
});
