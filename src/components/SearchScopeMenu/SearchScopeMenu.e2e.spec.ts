import { expect, test } from "@playwright/test";

test.describe("SearchScopeMenu (playwright)", () => {
  test("appears under the hover segment, matches its width, and follows movement", async ({
    page,
  }) => {
    const logRects = async (label: string) => {
      const bar = page.getByTestId("searchbar");
      const menu = page.getByTestId("searchscope-menu");
      const [barBox, menuBox] = await Promise.all([bar.boundingBox(), menu.boundingBox()]);
      console.log(label, { barBox, menuBox });
    };

    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    console.log("bar classes", await bar.getAttribute("class"));

    const box = await bar.boundingBox();
    if (!box) throw new Error("Search bar bounding box not found");

    const centerX = box.x + box.width / 2;
    const nearBottomY = box.y + box.height - 2;

    const steps = [box.y + 8, box.y + 16, box.y + 24, box.y + 32, nearBottomY];
    for (const y of steps) {
      await page.mouse.move(centerX, y);
    }

    await expect(page.getByTestId("searchbar-outline-hover")).toBeVisible();

    const menu = page.getByTestId("searchscope-menu");
    await expect(menu).toBeVisible();
    await logRects("after-center");

    const barStyles = await bar.evaluate((el) => {
      const s = getComputedStyle(el as HTMLElement);
      return {
        backgroundColor: s.backgroundColor,
        boxShadow: s.boxShadow,
        backdropFilter:
          s.backdropFilter ||
          (s as CSSStyleDeclaration & { webkitBackdropFilter?: string })
            .webkitBackdropFilter ||
          "",
      };
    });
    const menuStyles = await menu.evaluate((el) => {
      const s = getComputedStyle(el as HTMLElement);
      return {
        backgroundColor: s.backgroundColor,
        boxShadow: s.boxShadow,
        backdropFilter:
          s.backdropFilter ||
          (s as CSSStyleDeclaration & { webkitBackdropFilter?: string })
            .webkitBackdropFilter ||
          "",
      };
    });
    const corpusColor = await menu
      .locator("text=Corpus")
      .evaluate((el) => getComputedStyle(el as HTMLElement).color);

    const { overlay, shadow, textPrimary } = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const probe = document.createElement("div");
      probe.style.color = "var(--colors-vercel-text-primary)";
      document.body.appendChild(probe);
      const tokenColor = getComputedStyle(probe).color;
      probe.remove();
      return {
        overlay: root.getPropertyValue("--colors-vercel-surface-overlay").trim(),
        shadow: root.getPropertyValue("--shadows-panel").trim(),
        textPrimary: tokenColor,
      };
    });

    expect(barStyles.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(menuStyles.backgroundColor).toBe(barStyles.backgroundColor);
    expect(barStyles.boxShadow || shadow).toBeTruthy();
    expect(menuStyles.boxShadow).toBe(barStyles.boxShadow);
    expect(menuStyles.backdropFilter).toBe(barStyles.backdropFilter);
    expect(corpusColor).toBe(textPrimary);

    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error("Menu bounding box not found");

    const expectedWidth = 400;
    const widthTolerance = Math.max(10, expectedWidth * 0.1);

    expect(menuBox.width).toBeGreaterThanOrEqual(expectedWidth - widthTolerance);
    expect(menuBox.width).toBeLessThanOrEqual(expectedWidth + widthTolerance);
    expect(menuBox.y).toBeGreaterThanOrEqual(box.y + box.height - 2);

    const outsideX = box.x + box.width + 50;
    await page.mouse.move(outsideX, nearBottomY);
    await page.mouse.move(outsideX, box.y - 20);
    await page.evaluate(
      ({ x, y }) =>
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y })),
      { x: outsideX, y: box.y - 20 },
    );
    await expect(menu).toBeHidden();

    const returnSteps = [box.y + 8, box.y + 16, box.y + 24, box.y + 32, nearBottomY];
    for (const y of returnSteps) {
      await page.mouse.move(centerX, y);
    }
    await expect(menu).toBeVisible();
    await logRects("after-center-return");
  });
});
