import { expect, test, type Page } from "@playwright/test";

async function selectFixtureAndPlay(page: Page, fixtureKey = "tanstack") {
  await page.goto("/");

  await page.waitForFunction(() => Boolean((window as any).__graphControls), {
    timeout: 5_000,
  });

  await page.evaluate(({ fixtureKey }) => {
    const controls = (window as any).__graphControls;
    controls?.selectFixture(fixtureKey);
    controls?.setPlaying(true);
  }, { fixtureKey });

  const playButton = page.getByRole("button", { name: /pause/i });
  await expect(playButton).toBeVisible({ timeout: 5_000 });
}

test.describe("GraphStage (playwright)", () => {
  test("follows latest iteration node into view", async ({ page }) => {
    await selectFixtureAndPlay(page);

    // Wait for final iteration to resolve nodes
    const resolvedNode = page.locator(
      "[data-testid='graph-node'][data-node-id='function:QueryObserver']",
    );
    await expect(resolvedNode).toHaveAttribute("data-state", "resolved", {
      timeout: 20_000,
    });

    // Allow follow animation to settle
    await page.waitForTimeout(600);

    const { lowest, viewport } = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll<HTMLElement>("[data-testid='graph-node']"),
      ).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.getAttribute("data-node-id"),
          state: el.getAttribute("data-state"),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          centerX: rect.x + rect.width / 2,
          centerY: rect.y + rect.height / 2,
        };
      });

      const lowest = nodes.reduce((best, node) => {
        if (!best) return node;
        return node.centerY > best.centerY ? node : best;
      }, nodes[0]);

      return {
        lowest,
        viewport: { width: window.innerWidth, height: window.innerHeight },
      };
    });

    if (!lowest) throw new Error("No nodes rendered");

    const padding = viewport.height * 0.5;

    expect(lowest.centerX).toBeGreaterThanOrEqual(-padding);
    expect(lowest.centerX).toBeLessThanOrEqual(viewport.width + padding);
    expect(lowest.centerY).toBeGreaterThanOrEqual(-padding);
    expect(lowest.centerY).toBeLessThanOrEqual(viewport.height + padding);
  });

  test("pending nodes morph to resolved content", async ({ page }) => {
    await selectFixtureAndPlay(page);

    const node = page.locator(
      "[data-testid='graph-node'][data-node-id='function:QueryObserver']",
    );

    // Wait for pending state first
    await expect(node).toHaveAttribute("data-state", "pending", { timeout: 10_000 });

    // Then ensure it transitions to resolved
    await expect(node).toHaveAttribute("data-state", "resolved", { timeout: 20_000 });
  });

  test("edges animate only once and remain visible", async ({ page }) => {
    await selectFixtureAndPlay(page);

    const resolvedNode = page.locator(
      "[data-testid='graph-node'][data-node-id='function:QueryObserver']",
    );
    await expect(resolvedNode).toHaveAttribute("data-state", "resolved", {
      timeout: 20_000,
    });

    const edgePath = page.locator("g[data-testid='graph-edge'] path").first();
    await edgePath.waitFor({ state: "attached", timeout: 5_000 });

    // Let any initial edge animation run
    await page.waitForTimeout(700);

    const minOpacity = await edgePath.evaluate(async (path: SVGPathElement) => {
      if (!path) return null;

      let min = 1;
      for (let i = 0; i < 10; i++) {
        const opacity = Number.parseFloat(getComputedStyle(path).opacity);
        if (opacity < min) min = opacity;
        await new Promise((r) => setTimeout(r, 80));
      }

      return min;
    });

    expect(minOpacity).not.toBeNull();
    expect(minOpacity as number).toBeGreaterThan(0.8);

    const activeAnimations = await page.$$eval(
      "g[data-testid='graph-edge'] path[data-animate='true']",
      (paths) => paths.length,
    );
    expect(activeAnimations).toBe(0);
  });

  test("camera follows newest node", async ({ page }) => {
    await selectFixtureAndPlay(page);

    const retryer = page.locator("[data-node-id='function:Retryer']");
    await expect(retryer).toBeVisible({ timeout: 20_000 });

    const box = await retryer.boundingBox();
    const viewport = page.viewportSize();

    if (!box || !viewport) throw new Error("Missing bounding box or viewport");

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    expect(centerX).toBeGreaterThan(viewport.width * 0.25);
    expect(centerX).toBeLessThan(viewport.width * 0.75);
    expect(centerY).toBeGreaterThan(viewport.height * 0.25);
    expect(centerY).toBeLessThan(viewport.height * 0.75);
  });
});
