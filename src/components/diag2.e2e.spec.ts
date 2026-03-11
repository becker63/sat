import { test, expect } from "@playwright/test";

test("entry patterns: top-down vs side-entry vs already-at-bottom", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);

  const bar = page.getByTestId("searchbar");
  await bar.waitFor();
  const barBox = (await bar.boundingBox())!;
  const menu = page.getByTestId("searchscope-menu");
  const mouse = page.mouse;
  const barCenter = barBox.x + barBox.width / 2;
  const leftQuarter = barBox.x + barBox.width * 0.25;
  const rightQuarter = barBox.x + barBox.width * 0.75;

  const dismiss = async () => {
    await mouse.move(barBox.x - 200, barBox.y + barBox.height + 300, { steps: 4 });
    await page.evaluate(({x, y}) => {
      window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }));
    }, { x: barBox.x - 200, y: barBox.y + barBox.height + 300 });
    await page.waitForTimeout(600);
  };

  const logMenu = async (label: string) => {
    const vis = await menu.isVisible().catch(() => false);
    if (!vis) { console.log(`${label}: menu NOT visible`); return; }
    const mb = await menu.boundingBox();
    const center = (mb?.x ?? 0) + (mb?.width ?? 0) / 2;
    console.log(`${label}: menuLeft=${mb?.x?.toFixed(0)} menuCenter=${center.toFixed(0)} menuW=${mb?.width?.toFixed(0)}`);
  };

  // Pattern 1: Top-down at left quarter (the one that works)
  console.log("\n=== Pattern 1: Top-down at left quarter ===");
  await mouse.move(leftQuarter, barBox.y - 50);
  await page.waitForTimeout(100);
  for (let i = 0; i <= 15; i++) {
    const y = (barBox.y - 20) + (barBox.height + 30) * (i / 15);
    await mouse.move(leftQuarter, y);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(400);
  await logMenu("top-down leftQ");
  await dismiss();

  // Pattern 2: Enter from left side at bottom half
  console.log("\n=== Pattern 2: Side entry from left, near bottom ===");
  await mouse.move(barBox.x - 100, barBox.y + barBox.height - 10);
  await page.waitForTimeout(100);
  for (let i = 0; i <= 15; i++) {
    const x = (barBox.x - 80) + (leftQuarter - barBox.x + 80) * (i / 15);
    await mouse.move(x, barBox.y + barBox.height - 10);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(400);
  await logMenu("side-entry leftQ");
  await dismiss();

  // Pattern 3: Already inside bar, move to bottom at right quarter
  console.log("\n=== Pattern 3: Hover mid-height then slide to bottom at rightQ ===");
  await mouse.move(rightQuarter, barBox.y + barBox.height / 2);
  await page.waitForTimeout(200);
  for (let i = 0; i <= 15; i++) {
    const y = (barBox.y + barBox.height / 2) + (barBox.height / 2 - 4) * (i / 15);
    await mouse.move(rightQuarter, y);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(400);
  await logMenu("mid-to-bottom rightQ");
  await dismiss();

  // Pattern 4: Hover at center, move horizontally to left quarter near bottom
  console.log("\n=== Pattern 4: Start center-bottom, slide left to leftQ ===");
  await mouse.move(barCenter, barBox.y + 10);
  await page.waitForTimeout(100);
  for (let i = 0; i <= 10; i++) {
    await mouse.move(barCenter, barBox.y + 10 + (barBox.height - 20) * (i / 10));
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(100);
  // Now slide left to leftQuarter at bottom
  const vis1 = await menu.isVisible().catch(() => false);
  console.log(`After center descent: menu visible=${vis1}`);
  if (vis1) {
    await logMenu("center-descent");
    await dismiss();
  }
  // Now try at leftQuarter without going back to top
  for (let i = 0; i <= 10; i++) {
    const x = barCenter + (leftQuarter - barCenter) * (i / 10);
    await mouse.move(x, barBox.y + barBox.height - 8);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(400);
  await logMenu("slide-to-leftQ");
  await dismiss();

  // Pattern 5: Quick horizontal sweep at bottom of bar
  console.log("\n=== Pattern 5: Quick horizontal at bottom, stop at rightQ ===");
  await mouse.move(barBox.x + 30, barBox.y + barBox.height - 8);
  await page.waitForTimeout(100);
  for (let i = 0; i <= 10; i++) {
    const x = barBox.x + 30 + (rightQuarter - barBox.x - 30) * (i / 10);
    await mouse.move(x, barBox.y + barBox.height - 8);
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(400);
  await logMenu("sweep-to-rightQ");

  expect(true).toBe(true);
});
