import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Capture screenshots of the current React Flow view and its visible parents.
 *
 * Assumes the dev server is already running (default: http://127.0.0.1:5000).
 * Usage: npm run shot:theme
 *
 * Outputs are written to src/theme/theme-shots/<timestamp>/.
 */
async function main() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:5000";
  await waitForServer(baseURL);

  const themeDir = path.dirname(new URL(import.meta.url).pathname);
  const outDir = path.join(themeDir, "theme-shots");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.join(outDir, `${timestamp}.json`);
  const screenshotFile = path.join(outDir, `${timestamp}.png`);
  await fs.mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
  });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 900 },
  });

  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  const flow = page.locator(".react-flow");
  await flow.waitFor({ state: "visible", timeout: 8_000 });
  await page.waitForTimeout(120);

  const snapshot = await page.evaluate(() => {
    const root = document.querySelector(".react-flow");
    const nodeEl = document.querySelector(".react-flow__node");
    const edgeEl = document.querySelector(".react-flow__edge-path");
    const handleEl = document.querySelector(".react-flow__handle");
    const background = document.querySelector(".react-flow__background");

    function readVars(el, names) {
      if (!el) return {};
      const style = getComputedStyle(el);
      const entries = [];
      for (const name of names) {
        const value = style.getPropertyValue(name).trim();
        if (value) entries.push([name, value]);
      }
      return Object.fromEntries(entries);
    }

    return {
      cssVars: readVars(root, [
        "--xy-edge-stroke-default",
        "--xy-edge-stroke-selected-default",
        "--xy-connectionline-stroke-default",
        "--xy-node-background-color-default",
        "--xy-node-color-default",
        "--xy-handle-background-color-default",
        "--xy-background-pattern-dots-color-default",
      ]),
      styles: {
        canvas: root ? getComputedStyle(root).backgroundColor : null,
        node: nodeEl
          ? {
              background: getComputedStyle(nodeEl).backgroundColor,
              borderColor: getComputedStyle(nodeEl).borderColor,
              color: getComputedStyle(nodeEl).color,
              boxShadow: getComputedStyle(nodeEl).boxShadow,
            }
          : null,
        edge: edgeEl
          ? {
              stroke: getComputedStyle(edgeEl).stroke,
              strokeWidth: getComputedStyle(edgeEl).strokeWidth,
            }
          : null,
        handle: handleEl
          ? { background: getComputedStyle(handleEl).backgroundColor }
          : null,
        backgroundPattern: background
          ? {
              stroke: getComputedStyle(background).stroke,
              fill: getComputedStyle(background).fill,
            }
          : null,
      },
    };
  });

  await fs.writeFile(outFile, JSON.stringify(snapshot, null, 2), "utf-8");
  await page.screenshot({ path: screenshotFile, fullPage: true });

  await browser.close();
  console.log(`Saved theme snapshot for ${baseURL} -> ${outFile}`);
  console.log(`Saved full-page screenshot -> ${screenshotFile}`);
}

async function waitForServer(url, timeoutMs = 5_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok || res.status === 404) return;
    } catch {
      // ignore and retry
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server not responding at ${url} within ${timeoutMs}ms`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
