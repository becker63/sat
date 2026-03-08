import { expect, test } from "@playwright/test";

test.describe("SearchBar outline (playwright)", () => {
  test("draws a visible hover segment with the token stroke color", async ({
    page,
  }) => {
    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();

    const box = await bar.boundingBox();
    if (!box) throw new Error("Search bar bounding box not found");

    const centerX = box.x + box.width / 2;
    const ySteps = [box.y + 8, box.y + box.height / 2, box.y + box.height - 6];
    for (const y of ySteps) {
      await page.mouse.move(centerX, y);
    }

    const outline = page.getByTestId("searchbar-outline-hover");
    await expect(outline).toBeVisible();

    const { stroke, tokenStroke } = await outline.evaluate(() => {
      const elementStroke = getComputedStyle(
        document.querySelector('[data-testid="searchbar-outline-hover"]') as SVGElement,
      ).stroke;
      const probe = document.createElement("div");
      probe.style.color = "var(--colors-vercel-text-primary)";
      document.body.appendChild(probe);
      const tokenColor = getComputedStyle(probe).color;
      probe.remove();
      return { stroke: elementStroke, tokenStroke: tokenColor };
    });

    expect(stroke).toBe(tokenStroke);
    expect(stroke).not.toBe("transparent");
    expect(stroke).not.toBe("rgba(0, 0, 0, 0)");
  });
});
