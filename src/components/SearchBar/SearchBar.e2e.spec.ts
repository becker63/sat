import { expect, test } from "@playwright/test";

test.describe("SearchBar outline (playwright)", () => {
  test("hover segment stays stable when pointer pauses", async ({ page }) => {
    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();

    const box = await bar.boundingBox();
    if (!box) throw new Error("Search bar bounding box not found");

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    const nearBottom = box.y + box.height - 4;

    await page.mouse.move(centerX, centerY);
    await page.mouse.move(centerX, nearBottom);

    const outline = page.getByTestId("searchbar-outline-hover");
    await expect(outline).toBeVisible();

    const samples = await page.evaluate(
      ({ sampleCount }) =>
        new Promise<{
          xs: number[];
          missing: number;
        }>((resolve) => {
          const xs: number[] = [];
          let missing = 0;

          const sample = () => {
            const rect = document.querySelector(
              "[data-testid='searchbar-outline-hover']",
            ) as SVGRectElement | null;
            if (!rect || !rect.ownerSVGElement) {
              missing += 1;
            } else {
              const svg = rect.ownerSVGElement;
              const dash = rect.getAttribute("stroke-dasharray");
              const offset = rect.getAttribute("data-offset");
              const widthAttr = rect.getAttribute("width");
              const heightAttr = rect.getAttribute("height");
              if (dash && offset && widthAttr && heightAttr) {
                const dashLength = Number(dash.split(" ")[0]);
                const perimeter = Number(widthAttr) * 2 + Number(heightAttr) * 2;
                const current = (Number(offset) + dashLength / 2) % perimeter;
                const width = Number(widthAttr);
                const height = Number(heightAttr);

                let xPos = 0;
                const rightEdge = width;
                const bottomEdge = width + height;
                const leftEdge = width * 2 + height;
                if (current <= width) {
                  xPos = current;
                } else if (current <= bottomEdge) {
                  xPos = width;
                } else if (current <= leftEdge) {
                  xPos = width - (current - bottomEdge);
                } else {
                  xPos = 0;
                }

                xs.push(xPos);
              } else {
                missing += 1;
              }
            }

            if (xs.length + missing >= sampleCount) {
              resolve({ xs, missing });
              return;
            }
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
        }),
      { sampleCount: 120 },
    );

    expect(samples.xs.length).toBeGreaterThanOrEqual(80);
    expect(samples.missing).toBe(0);

    const range = Math.max(...samples.xs) - Math.min(...samples.xs);

    // Failing guard: segment should stay in one place; any horizontal drift signals jitter.
    expect(range).toBeLessThanOrEqual(0.01);
  });

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

  test("menu appears only after hover delay and matches segment width", async ({
    page,
  }) => {
    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const center = { x: barBox.x + barBox.width / 2, y: barBox.y + barBox.height / 2 };
    await page.mouse.move(center.x, center.y);

    const menu = page.getByTestId("searchscope-menu");
    await expect(menu).toHaveCount(0);

    const outline = page.getByTestId("searchbar-outline-hover");
    await expect(outline).toBeVisible();
    const dashLength = await outline.evaluate(() => {
      const dash = (document
        .querySelector("[data-testid='searchbar-outline-hover']") as SVGRectElement)?.getAttribute(
        "stroke-dasharray",
      );
      if (!dash) return null;
      const first = parseFloat(dash.split(" ")[0].replace("px", ""));
      return Number.isFinite(first) ? first : null;
    });

    // Drag downward past the bar to trigger the menu.
    const insideBottomY = barBox.y + barBox.height - 4;
    await page.mouse.move(center.x, insideBottomY);
    const downSteps = [
      barBox.y + barBox.height + 2,
      barBox.y + barBox.height + 10,
    ];
    for (const y of downSteps) {
      await page.mouse.move(center.x, y);
    }
    await page.waitForTimeout(260);
    await menu.waitFor({ state: "visible", timeout: 1_000 });

    const menuBox = await menu.boundingBox();
    if (!menuBox || dashLength === null) throw new Error("Missing menu or dash length");

    const tol = 8;
    expect(menuBox.width).toBeGreaterThanOrEqual(dashLength - tol);
    expect(menuBox.width).toBeLessThanOrEqual(dashLength + tol);
  });

  test("hover outline hugs the bar perimeter with the inset gap", async ({
    page,
  }) => {
    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    const input = page.getByRole("textbox");
    await bar.waitFor();

    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const centerY = barBox.y + barBox.height / 2;
    await page.mouse.move(centerX, centerY);

    const outline = page.getByTestId("searchbar-outline-hover");
    await expect(outline).toBeVisible();

    const outlineBox = await outline.boundingBox();
    const inputBox = await input.boundingBox();
    if (!outlineBox || !inputBox) throw new Error("Bounding boxes missing");

    const debugSizes = await outline.evaluate((el) => {
      const svg = el.ownerSVGElement;
      const rect = el as SVGRectElement;
      return {
        rectWidth: rect.width.baseVal.value,
        rectHeight: rect.height.baseVal.value,
        svgSize: svg
          ? {
              width: svg.getAttribute("width"),
              height: svg.getAttribute("height"),
              bbox: svg.getBoundingClientRect().toJSON(),
              styleWidth: getComputedStyle(svg).width,
            }
          : null,
        dashArray: rect.getAttribute("stroke-dasharray"),
      };
    });

    console.log(
      "hover-geometry",
      JSON.stringify({ barBox, outlineBox, inputBox, debugSizes }, null, 2),
    );

    const svgBBox = debugSizes.svgSize?.bbox;
    if (!svgBBox) throw new Error("SVG bbox missing");

    const insetMin = 4;
    const insetMax = 16;

    expect(svgBBox.x).toBeGreaterThanOrEqual(barBox.x - insetMax);
    expect(svgBBox.x).toBeLessThanOrEqual(barBox.x + insetMin);
    expect(svgBBox.y).toBeGreaterThanOrEqual(barBox.y - insetMax);
    expect(svgBBox.y).toBeLessThanOrEqual(barBox.y + insetMin);

    expect(svgBBox.width).toBeGreaterThanOrEqual(barBox.width - insetMin);
    expect(svgBBox.width).toBeLessThanOrEqual(barBox.width + insetMax * 2);
    expect(svgBBox.height).toBeGreaterThanOrEqual(barBox.height - insetMin);
    expect(svgBBox.height).toBeLessThanOrEqual(barBox.height + insetMax * 2);

    // Ensure there is a visible gap between the outline and the input content box using the full outline box.
    expect(inputBox.x).toBeGreaterThan(svgBBox.x + insetMin / 2);
    expect(inputBox.y).toBeGreaterThan(svgBBox.y + insetMin / 2);

    // Ensure the stroke draws a segment (non-empty dash length).
    expect(debugSizes.dashArray).toBeTruthy();
  });

  test("focus outline matches hover geometry and uses token stroke", async ({
    page,
  }) => {
    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    const input = page.getByRole("textbox");
    await bar.waitFor();

    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    await input.click();

    const focusOutline = page.getByTestId("searchbar-outline-focus");
    await expect(focusOutline).toBeVisible();

    const outlineBox = await focusOutline.boundingBox();
    if (!outlineBox) throw new Error("Focus outline bounding box missing");

    const debugSizes = await focusOutline.evaluate((el) => {
      const svg = el.ownerSVGElement;
      const rect = el as SVGRectElement;
      return {
        rectWidth: rect.width.baseVal.value,
        rectHeight: rect.height.baseVal.value,
        svgSize: svg
          ? {
              width: svg.getAttribute("width"),
              height: svg.getAttribute("height"),
              bbox: svg.getBoundingClientRect().toJSON(),
              styleWidth: getComputedStyle(svg).width,
            }
          : null,
      };
    });

    console.log(
      "focus-geometry",
      JSON.stringify({ barBox, outlineBox, debugSizes }, null, 2),
    );

    const svgBBox = debugSizes.svgSize?.bbox;
    if (!svgBBox) throw new Error("SVG bbox missing");

    const insetMin = 4;
    const insetMax = 16;

    expect(svgBBox.x).toBeGreaterThanOrEqual(barBox.x - insetMax);
    expect(svgBBox.x).toBeLessThanOrEqual(barBox.x + insetMin);
    expect(svgBBox.y).toBeGreaterThanOrEqual(barBox.y - insetMax);
    expect(svgBBox.y).toBeLessThanOrEqual(barBox.y + insetMin);
    expect(svgBBox.width).toBeGreaterThanOrEqual(barBox.width - insetMin);
    expect(svgBBox.width).toBeLessThanOrEqual(barBox.width + insetMax * 2);
    expect(svgBBox.height).toBeGreaterThanOrEqual(barBox.height - insetMin);
    expect(svgBBox.height).toBeLessThanOrEqual(barBox.height + insetMax * 2);

    const stroke = await focusOutline.evaluate((el) => {
      const s = getComputedStyle(el as HTMLElement);
      return s.stroke;
    });
    const tokenStroke = await page.evaluate(() => {
      const probe = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      probe.setAttribute("stroke", "var(--colors-vercel-text-primary)");
      document.body.appendChild(probe);
      const color = getComputedStyle(probe).stroke;
      probe.remove();
      return color;
    });
    expect(stroke).toBe(tokenStroke);
  });

  test("hover outline matches bar geometry (bounds alignment)", async ({
    page,
  }) => {
    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();

    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const center = { x: barBox.x + barBox.width / 2, y: barBox.y + barBox.height / 2 };
    await page.mouse.move(center.x, center.y);

    const outline = page.getByTestId("searchbar-outline-hover");
    await expect(outline).toBeVisible();

    const geom = await outline.evaluate((el) => {
      const rect = el as SVGRectElement;
      const svg = rect.ownerSVGElement!;
      const svgBox = svg.getBoundingClientRect();
      return {
        rectWidthAttr: parseFloat(rect.getAttribute("width") ?? "0"),
        rectHeightAttr: parseFloat(rect.getAttribute("height") ?? "0"),
        svgWidthAttr: parseFloat(svg.getAttribute("width") ?? "0"),
        svgHeightAttr: parseFloat(svg.getAttribute("height") ?? "0"),
        svgBox: svgBox.toJSON(),
      };
    });

    const OUTLINE_INSET = 8;
    const expectedSvgWidth = barBox.width + OUTLINE_INSET * 2;
    const expectedSvgHeight = barBox.height + OUTLINE_INSET * 2;

    expect(geom.svgWidthAttr).toBeCloseTo(expectedSvgWidth, 1);
    expect(geom.svgHeightAttr).toBeCloseTo(expectedSvgHeight, 1);
    expect(geom.rectWidthAttr).toBeCloseTo(expectedSvgWidth - 1, 1);
    expect(geom.rectHeightAttr).toBeCloseTo(expectedSvgHeight - 1, 1);

    // The rendered svg box should wrap the bar with the inset applied.
    const tol = 6;
    expect(geom.svgBox.x).toBeGreaterThanOrEqual(barBox.x - OUTLINE_INSET - tol);
    expect(geom.svgBox.x).toBeLessThanOrEqual(barBox.x + tol);
    expect(geom.svgBox.width).toBeGreaterThanOrEqual(barBox.width + OUTLINE_INSET * 2 - tol);
    expect(geom.svgBox.width).toBeLessThanOrEqual(barBox.width + OUTLINE_INSET * 2 + tol);
  });

  test("locks hover segment horizontally until leaving the scope menu span", async ({
    page,
  }) => {
    await page.goto("/");

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const startY = barBox.y + 6;
    const endY = barBox.y + barBox.height + 10;
    const menu = page.getByTestId("searchscope-menu");
    const outline = page.getByTestId("searchbar-outline-hover");

    const readSegmentX = async () =>
      await outline.evaluate(() => {
        const rect = document.querySelector(
          '[data-testid="searchbar-outline-hover"]',
        ) as SVGRectElement | null;
        if (!rect || !rect.ownerSVGElement) throw new Error("missing hover rect");
        const dash = rect.getAttribute("stroke-dasharray");
        const offset = rect.getAttribute("data-offset");
        const widthAttr = rect.getAttribute("width");
        const heightAttr = rect.getAttribute("height");
        if (!dash || !offset || !widthAttr || !heightAttr) throw new Error("missing attrs");
        const dashLength = Number(dash.split(" ")[0]);
        const perimeter = Number(widthAttr) * 2 + Number(heightAttr) * 2;
        const current = (Number(offset) + dashLength / 2) % perimeter;
        const width = Number(widthAttr);
        const height = Number(heightAttr);
        if (current <= width) return current;
        const bottomEdge = width + height;
        if (current <= bottomEdge) return width;
        const leftEdge = width * 2 + height;
        if (current <= leftEdge) return width - (current - bottomEdge);
        return 0;
      });

    const steps = 18;
    const dy = (endY - startY) / steps;
    for (let i = 0; i <= steps; i++) {
      await page.mouse.move(centerX, startY + dy * i, { steps: 1 });
      await page.waitForTimeout(12);
    }

    await outline.waitFor({ state: "visible", timeout: 1_000 });
    await menu.waitFor({ state: "visible", timeout: 1_000 });

    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error("Menu bounding box not found");

    const insideSamples: number[] = [await readSegmentX()];
    const insideXs = [
      menuBox.x + menuBox.width * 0.25,
      menuBox.x + menuBox.width * 0.5,
      menuBox.x + menuBox.width * 0.75,
    ];

    for (const x of insideXs) {
      await page.mouse.move(x, menuBox.y + menuBox.height / 2, { steps: 2 });
      await page.waitForTimeout(30);
      insideSamples.push(await readSegmentX());
    }

    const insideRange =
      Math.max(...insideSamples) - Math.min(...insideSamples);
    expect(insideRange).toBeLessThanOrEqual(0.5);

    const baseline = insideSamples[0]!;

    await page.mouse.move(barBox.x - 200, barBox.y + barBox.height + 300, { steps: 4 });
    await page.evaluate(
      ({ x, y }) =>
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y })),
      { x: barBox.x - 200, y: barBox.y + barBox.height + 300 },
    );
    await page.waitForTimeout(500);
    await expect(menu).not.toBeVisible({ timeout: 800 });

    const unlockX = barBox.x + barBox.width * 0.2;
    const barCenterY = barBox.y + barBox.height / 2;
    await page.mouse.move(unlockX, barCenterY, { steps: 3 });
    await expect(outline).toBeVisible({ timeout: 1_000 });

    const afterUnlock = await readSegmentX();
    expect(Math.abs(afterUnlock - baseline)).toBeGreaterThan(1);
  });
});
