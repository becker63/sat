import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Quick helper to capture a screenshot of the search scope menu.
 * Run `npm run dev` in another terminal, then execute:
 *   npx tsx src/components/SearchScopeMenu/capture-menu.ts
 * The image will be saved alongside this script.
 */
async function capture() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
  });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
  });

  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  const bar = page.locator("[data-focused]");
  await bar.waitFor({ state: "visible", timeout: 10_000 });

  const box = await bar.boundingBox();
  if (!box) throw new Error("Search bar bounding box not found");

  const centerX = box.x + box.width / 2;
  const nearBottomY = box.y + box.height - 2;
  const steps = [box.y + 8, box.y + 16, box.y + 24, box.y + 32, nearBottomY];
  for (const y of steps) {
    await page.mouse.move(centerX, y);
  }
  await page.waitForTimeout(200);
  // also dispatch pointer events directly on the container to ensure hover state
  const elementHandle = await bar.elementHandle();
  if (elementHandle) {
    const coords: Array<[number, number]> = steps.map((y) => [centerX, y]);
    await page.evaluate(
      ({ el, coords }) => {
        coords.forEach(([x, y]) => {
          const evt = new PointerEvent("pointermove", {
            clientX: x,
            clientY: y,
            bubbles: true,
          });
          el.dispatchEvent(evt);
        });
      },
      { el: elementHandle, coords },
    );
  }

  const menu = page.getByTestId("searchscope-menu");
  await menu.waitFor({ state: "visible", timeout: 10_000 });

  const outDir = path.join(__dirname);
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, "searchscope-menu.png");

  await menu.screenshot({ path: outFile });

  console.log(`Saved screenshot to ${outFile}`);

  await browser.close();
}

capture().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
