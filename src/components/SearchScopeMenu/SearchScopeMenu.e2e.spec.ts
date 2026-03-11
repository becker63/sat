import { expect, test, type Page } from "@playwright/test";

test.describe("SearchScopeMenu (playwright)", () => {
  test.describe.configure({ mode: "parallel" });

  const installMachineObserver = async (page: Page) => {
    await page.evaluate(() => {
      const w = window as any;
      w.__scopeMachineLog = [];
      w.__scopeVisibleLog = [];
      w.__scopeLatchLog = [];
      w.__scopeObserverLog = [];
      w.__scopeMachineObservers = [];
      const observer = (payload: unknown) => {
        w.__scopeObserverLog.push(payload);
      };
      w.__scopeMachineObservers.push(observer);
    });
  };

  const gotoAndInstall = async (page: Page) => {
    await page.goto("/");
    await installMachineObserver(page);
  };

  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[browser:${msg.type()}]`, msg.text());
    });
    await page.goto("/");
    await installMachineObserver(page);
  });

  test.afterEach(async ({ page }, testInfo) => {
    const logs = await page.evaluate(() => ({
      machine: (window as any).__scopeMachineLog ?? [],
      visible: (window as any).__scopeVisibleLog ?? [],
      latch: (window as any).__scopeLatchLog ?? [],
      observer: (window as any).__scopeObserverLog ?? [],
    }));

    if (testInfo.status !== "passed") {
      console.log("scope machine log", JSON.stringify(logs.machine, null, 2));
      console.log("scope visible log", JSON.stringify(logs.visible.slice(-12), null, 2));
      console.log("scope latch log", JSON.stringify(logs.latch, null, 2));
      console.log("scope observer log", JSON.stringify(logs.observer.slice(-18), null, 2));
    }
  });

  const descendIntoBand = async (
    page: Page,
    x: number,
    startY: number,
    endY: number,
    durationMs = 320,
  ) => {
    const steps = 18;
    const stepSize = (endY - startY) / steps;
    const pause = Math.max(6, Math.round(durationMs / steps));
    for (let i = 0; i <= steps; i++) {
      const y = startY + stepSize * i;
      await page.mouse.move(x, y, { steps: 1 });
      await page.waitForTimeout(pause);
    }
  };

  test("appears under the hover segment, matches its width, and follows movement", async ({
    page,
  }) => {
    const logRects = async (label: string) => {
      const bar = page.getByTestId("searchbar");
      const menu = page.getByTestId("searchscope-menu");
      const [barBox, menuBox] = await Promise.all([bar.boundingBox(), menu.boundingBox()]);
      console.log(label, { barBox, menuBox });
    };

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    console.log("bar classes", await bar.getAttribute("class"));

    const box = await bar.boundingBox();
    if (!box) throw new Error("Search bar bounding box not found");

    const centerX = box.x + box.width / 2;
    const nearBottomY = box.y + box.height - 2;

    await descendIntoBand(page, centerX, box.y + 8, nearBottomY, 320);

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

    await descendIntoBand(page, centerX, box.y + 8, nearBottomY, 320);
    await expect(menu).toBeVisible();
    await logRects("after-center-return");
  });

  test("does not jump to the top-left on first render", async ({ page }) => {
    const bar = page.getByTestId("searchbar");
    await bar.waitFor();

    await page.evaluate(() => {
      const frames: Array<{
        x: number;
        y: number;
        width: number;
        height: number;
      }> = [];
      (window as any).__searchScopeFrames = frames;

      const record = (menu: HTMLElement) => {
        const sample = () => {
          const rect = menu.getBoundingClientRect();
          frames.push({
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          });
        };

        sample();
        requestAnimationFrame(() => {
          sample();
          requestAnimationFrame(sample);
          requestAnimationFrame(sample);
        });
      };

      const observer = new MutationObserver((entries) => {
        for (const entry of entries) {
          entry.addedNodes.forEach((node) => {
            if (
              node instanceof HTMLElement &&
              node.dataset?.testid === "searchscope-menu"
            ) {
              record(node);
            }
          });
        }
      });

      observer.observe(document.body, { childList: true });
      (window as any).__searchScopeObserver = observer;
    });

    const box = await bar.boundingBox();
    if (!box) throw new Error("Search bar bounding box not found");

    const centerX = box.x + box.width / 2;
    const nearBottomY = box.y + box.height - 2;
    await descendIntoBand(page, centerX, box.y + 8, nearBottomY, 320);

    await expect(page.getByTestId("searchbar-outline-hover")).toBeVisible();

    const menu = page.getByTestId("searchscope-menu");
    await expect(menu).toBeVisible();
    await page.waitForTimeout(200);

    const stableBox = await menu.boundingBox();
    if (!stableBox) throw new Error("Menu bounding box not found");

    const frames = await page.evaluate(
      () => (window as any).__searchScopeFrames ?? [],
    );

    expect(frames.length).toBeGreaterThan(0);

    const firstFrame = frames[0];
    const minWidth = frames.reduce(
      (min, frame) => Math.min(min, frame.width),
      Number.POSITIVE_INFINITY,
    );

    const maxDrift = 2;
    expect(Math.abs(firstFrame.x - stableBox.x)).toBeLessThanOrEqual(maxDrift);
    expect(Math.abs(firstFrame.y - stableBox.y)).toBeLessThanOrEqual(maxDrift);
    expect(minWidth).toBeGreaterThanOrEqual(stableBox.width * 0.98);

    await page.evaluate(({ sampleFrames }) => {
      const frames: Array<{
        visible: boolean;
        x: number;
        y: number;
        width: number;
        height: number;
      }> = [];
      let hiddenFrames = 0;
      let mounts = 0;
      let unmounts = 0;

      const observer = new MutationObserver((entries) => {
        for (const entry of entries) {
          entry.addedNodes.forEach((node) => {
            if (
              node instanceof HTMLElement &&
              node.dataset?.testid === "searchscope-menu"
            ) {
              mounts += 1;
            }
          });
          entry.removedNodes.forEach((node) => {
            if (
              node instanceof HTMLElement &&
              node.dataset?.testid === "searchscope-menu"
            ) {
              unmounts += 1;
            }
          });
        }
      });
      observer.observe(document.body, { childList: true });

      let count = 0;
      const sample = () => {
        const menu = document.querySelector(
          "[data-testid='searchscope-menu']",
        ) as HTMLElement | null;
        const style = menu ? getComputedStyle(menu) : null;
        const visible =
          !!menu &&
          style?.display !== "none" &&
          style?.visibility !== "hidden" &&
          style?.opacity !== "0";
        if (!visible) hiddenFrames += 1;
        const rect = menu?.getBoundingClientRect();
        frames.push({
          visible,
          x: rect?.x ?? Number.NaN,
          y: rect?.y ?? Number.NaN,
          width: rect?.width ?? 0,
          height: rect?.height ?? 0,
        });
        if (++count >= sampleFrames) {
          observer.disconnect();
          (window as any).__searchScopeCapture = {
            frames,
            mounts,
            unmounts,
            hiddenFrames,
          };
          return;
        }
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    }, { sampleFrames: 96 });

    const bottomBandStart = box.y + box.height - 20;
    const bottomBandEnd = box.y + box.height - 4;
    const midBand = box.y + box.height / 2 + 6;

    const path = [
      [centerX, bottomBandEnd],
      [centerX, bottomBandStart],
      [centerX, bottomBandEnd - 2],
      [centerX, bottomBandStart + 2],
      [centerX, midBand],
      [centerX, bottomBandEnd],
      [centerX, bottomBandStart],
    ];

    for (const [x, y] of path) {
      await page.mouse.move(x, y, { steps: 6 });
      await page.waitForTimeout(24);
    }

    const expectedFrames = 96;
    await page.waitForTimeout(320);

    await page.waitForFunction(
      (minimum) => {
        const capture = (window as any).__searchScopeCapture;
        return (
          capture &&
          Array.isArray(capture.frames) &&
          capture.frames.length >= minimum
        );
      },
      expectedFrames,
      { timeout: 2_000 },
    );

    const motion = await page.evaluate(
      () => (window as any).__searchScopeCapture as
        | {
            frames: Array<{
              visible: boolean;
              x: number;
              y: number;
              width: number;
              height: number;
            }>;
            mounts: number;
            unmounts: number;
            hiddenFrames: number;
          }
        | undefined,
    );

    if (!motion || motion.frames.length === 0) {
      throw new Error("Did not capture motion frames for menu visibility");
    }

    if (motion.unmounts > 0 || motion.hiddenFrames > 0) {
      const visibleLog = await page.evaluate(() => {
        const log = (window as any).__scopeVisibleLog ?? [];
        return log.map((entry: any) => ({
          ...entry,
          pointer:
            entry.pointer && typeof entry.pointer === "object"
              ? { x: entry.pointer.x, y: entry.pointer.y }
              : entry.pointer,
        }));
      });
      const compactLog = visibleLog.slice(-12).map((entry) => {
        const pointer =
          entry.pointer && typeof entry.pointer === "object"
            ? entry.pointer
            : null;
        return {
          t: entry.t,
          visible: entry.visible,
          pointerEligible: entry.pointerEligible,
          pointerWithinBand: entry.pointerWithinBand,
          pointerX: pointer?.x ?? null,
          pointerY: pointer?.y ?? null,
          menuVisibleState: entry.menuVisibleState,
          baseVisible: entry.baseVisible,
          holdWhileInside: entry.holdWhileInside,
        };
      });
      console.log("scope motion debug", {
        unmounts: motion.unmounts,
        hiddenFrames: motion.hiddenFrames,
        lastLog: compactLog,
      });
    }

    // Allow the initial mount but no remounts/unmounts once visible.
    expect(motion.mounts).toBeLessThanOrEqual(1);
    expect(motion.unmounts).toBe(0);
    expect(motion.hiddenFrames).toBe(0);

    const maxFrameDrift = 2;
    for (const frame of motion.frames) {
      expect(frame.visible).toBe(true);
      expect(Math.abs(frame.x - stableBox.x)).toBeLessThanOrEqual(maxFrameDrift);
      expect(Math.abs(frame.y - stableBox.y)).toBeLessThanOrEqual(maxFrameDrift);
      expect(frame.width).toBeGreaterThanOrEqual(stableBox.width * 0.98);
    }
  });

  test("spawns reliably when moving downward in varied arcs", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();

    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const topY = barBox.y + 6;
    const bottomY = barBox.y + barBox.height + 32;

    const scenarios = [
      {
        label: "wide-slow",
        ampX: Math.min(200, barBox.width / 3),
        ampY: 18,
        freqX: 1.2,
        freqY: 2.6,
        steps: 36,
        dwell: 18,
      },
      {
        label: "wide-fast",
        ampX: Math.min(220, barBox.width / 2.5),
        ampY: 26,
        freqX: 1.8,
        freqY: 3.6,
        steps: 18,
        dwell: 6,
      },
      {
        label: "edge-left",
        ampX: Math.min(240, barBox.width / 2.2),
        ampY: 24,
        freqX: 2.3,
        freqY: 3.8,
        steps: 28,
        dwell: 10,
        centerShift: -barBox.width * 0.24,
      },
      {
        label: "edge-right",
        ampX: Math.min(240, barBox.width / 2.2),
        ampY: 24,
        freqX: 2.4,
        freqY: 4.1,
        steps: 28,
        dwell: 10,
        centerShift: barBox.width * 0.24,
      },
      {
        label: "micro-wiggle",
        ampX: 90,
        ampY: 28,
        freqX: 3.6,
        freqY: 4.5,
        steps: 42,
        dwell: 8,
      },
    ] as const;

    // Pseudo-random but deterministic jitter to vary arcs mid-flight.
    let seed = 42;
    const rand = () => {
      seed = (seed * 48271) % 2147483647;
      return seed / 2147483647;
    };

    const menu = page.getByTestId("searchscope-menu");
    let failures = 0;

    for (const scenario of scenarios) {
      const cx = centerX + (scenario.centerShift ?? 0);
      let seen = false;
      for (let i = 0; i <= scenario.steps; i++) {
        const t = i / scenario.steps;
        const jitterX = 1 + (rand() - 0.5) * 0.3;
        const jitterY = 1 + (rand() - 0.5) * 0.3;
        const y =
          topY +
          (bottomY - topY) * t +
          Math.sin(t * Math.PI * scenario.freqY * jitterY) * scenario.ampY;
        const x =
          cx + Math.sin(t * Math.PI * scenario.freqX * jitterX) * scenario.ampX;
        const speedSteps = Math.max(1, Math.round((rand() + 0.2) * 3));
        await page.mouse.move(x, y, { steps: speedSteps });
        await page.waitForTimeout(Math.max(4, scenario.dwell - speedSteps));
        if (!seen) {
          seen = await menu.isVisible();
        }
      }
      // Finish with a clean downward pass through the center of the segment.
      await page.mouse.move(centerX, barBox.y + barBox.height - 2, { steps: 2 });
      await page.mouse.move(centerX, barBox.y + barBox.height + 18, { steps: 2 });

      try {
        if (!seen) {
          await menu.waitFor({ state: "visible", timeout: 1500 });
        }
      } catch (error) {
        failures += 1;
        console.log("arc-run failure", scenario);
      }
    }

    expect(failures).toBe(0);
  });

  test("spawns when traversing varied crossings through the segment", async ({
    page,
  }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const baseCenterX = barBox.x + barBox.width / 2;
    const startAbove = barBox.y - 18;
    const endBelow = barBox.y + barBox.height + 28;
    const midBand = barBox.y + barBox.height / 2;

    type Scenario = {
      label: string;
      fn: (t: number) => { x: number; y: number };
      steps?: number;
      dwell?: number;
    };

    const scenarios: Scenario[] = [
      {
        label: "center-slow",
        steps: 28,
        dwell: 12,
        fn: (t) => ({
          x: baseCenterX,
          y: startAbove + (endBelow - startAbove) * Math.pow(t, 1.05),
        }),
      },
      {
        label: "center-fast",
        steps: 18,
        dwell: 6,
        fn: (t) => ({
          x: baseCenterX,
          y: startAbove + (endBelow - startAbove) * Math.pow(t, 0.78),
        }),
      },
      {
        label: "left-diagonal",
        steps: 30,
        dwell: 8,
        fn: (t) => ({
          x: baseCenterX - barBox.width * 0.35 * Math.sin(Math.PI * t),
          y: startAbove + (endBelow - startAbove) * t,
        }),
      },
      {
        label: "right-diagonal",
        steps: 30,
        dwell: 8,
        fn: (t) => ({
          x: baseCenterX + barBox.width * 0.35 * Math.sin(Math.PI * t),
          y: startAbove + (endBelow - startAbove) * t,
        }),
      },
      {
        label: "zig-zag",
        steps: 32,
        dwell: 6,
        fn: (t) => ({
          x: baseCenterX + 180 * Math.sin(5 * Math.PI * t),
          y: startAbove + (endBelow - startAbove) * (0.4 + 0.6 * t),
        }),
      },
      {
        label: "mid-band-hover",
        steps: 26,
        dwell: 14,
        fn: (t) => ({
          x: baseCenterX + 90 * Math.sin(2 * Math.PI * t),
          y: midBand + (endBelow - midBand) * Math.pow(t, 0.9),
        }),
      },
      {
        label: "edge-skirt-left",
        steps: 28,
        dwell: 10,
        fn: (t) => ({
          x: baseCenterX - barBox.width * 0.42 + 120 * Math.sin(3 * Math.PI * t),
          y: startAbove + (endBelow - startAbove) * (0.2 + 0.8 * t),
        }),
      },
      {
        label: "edge-skirt-right",
        steps: 28,
        dwell: 10,
        fn: (t) => ({
          x: baseCenterX + barBox.width * 0.42 - 120 * Math.sin(3 * Math.PI * t),
          y: startAbove + (endBelow - startAbove) * (0.2 + 0.8 * t),
        }),
      },
    ];

    for (const scenario of scenarios) {
      const steps = scenario.steps ?? 24;
      const dwell = scenario.dwell ?? 8;

      // Reset hover state away from the bar between runs.
      await page.mouse.move(barBox.x + barBox.width + 80, barBox.y - 40);
      await page.waitForTimeout(200);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const { x, y } = scenario.fn(t);
        await page.mouse.move(x, y, { steps: 1 });
        await page.waitForTimeout(dwell);
      }

      const menu = page.getByTestId("searchscope-menu");
      try {
        await menu.waitFor({ state: "visible", timeout: 1200 });
      } catch {
        throw new Error(`Menu did not appear for scenario "${scenario.label}"`);
      }
      await expect(menu, scenario.label).toBeVisible();
    }
  });
  test("does not show until the pointer descends into the band", async ({
    page,
  }) => {
    await gotoAndInstall(page);
    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const aboveY = barBox.y + 4;
    const nearBottom = barBox.y + barBox.height - 4;
    const menu = page.getByTestId("searchscope-menu");

    // Move across the band horizontally without descending: menu should stay hidden.
    for (const x of [barBox.x + 20, centerX, barBox.x + barBox.width - 20]) {
      await page.mouse.move(x, aboveY, { steps: 2 });
      await page.waitForTimeout(20);
      await expect(menu).toHaveCount(0);
    }

    // Now descend through the band; menu should appear promptly.
    await descendIntoBand(page, centerX, aboveY + 4, nearBottom + 24, 320);
    await menu.waitFor({ state: "visible", timeout: 1500 });
  });

  test("hides when moving upward out of the band", async ({ page }) => {
    await gotoAndInstall(page);
    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const bottom = barBox.y + barBox.height + 16;
    const menu = page.getByTestId("searchscope-menu");

    await descendIntoBand(page, centerX, barBox.y + 8, bottom, 360);
    await menu.waitFor({ state: "visible", timeout: 1500 });

    // Move upward above the bar; menu should disappear once we leave the bar surface.
    for (const y of [barBox.y + barBox.height * 0.5, barBox.y + 4, barBox.y - 30]) {
      await page.mouse.move(centerX, y, { steps: 2 });
      await page.waitForTimeout(24);
    }

    await expect(menu).toBeHidden({ timeout: 500 });
  });

  test("stays visible while sweeping downward diagonally", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const topY = barBox.y + 6;
    const bottomY = barBox.y + barBox.height + 28;
    const menu = page.getByTestId("searchscope-menu");

    // Prime hover and show the menu.
    await descendIntoBand(page, centerX, barBox.y + 8, barBox.y + barBox.height - 4, 360);
    await menu.waitFor({ state: "visible", timeout: 1200 });

    const scenarios = [
      {
        label: "rational-left",
        fn: (t: number) => ({
          x: centerX - 360 * (t / (0.35 + t)),
          y: topY + (bottomY - topY) * Math.pow(t, 0.9),
        }),
      },
      {
        label: "rational-right",
        fn: (t: number) => ({
          x: centerX + 360 * (t / (0.35 + t)),
          y: topY + (bottomY - topY) * Math.pow(t, 0.9),
        }),
      },
      {
        label: "arc-left",
        fn: (t: number) => ({
          x: centerX - 320 * Math.sin(Math.PI * t * 0.8),
          y: topY + (bottomY - topY) * (0.5 - 0.5 * Math.cos(Math.PI * t)),
        }),
      },
      {
        label: "arc-right",
        fn: (t: number) => ({
          x: centerX + 320 * Math.sin(Math.PI * t * 0.8),
          y: topY + (bottomY - topY) * (0.5 - 0.5 * Math.cos(Math.PI * t)),
        }),
      },
    ] as const;

    for (const scenario of scenarios) {
      await descendIntoBand(page, centerX, barBox.y + 8, barBox.y + barBox.height - 4, 360);
      await menu.waitFor({ state: "visible", timeout: 1200 });

      await page.evaluate(() => {
        (window as any).__scopeSweepFrames = [];
        (window as any).__scopeVisibleLog = [];
        (window as any).__scopeBandLog = [];
      });

      // Start sampling menu visibility each frame.
      await page.evaluate(() => {
        const frames: Array<{ visible: boolean }> = [];
        const sample = (n: number) => {
          if (n <= 0) {
            (window as any).__scopeSweepFrames = frames;
            return;
          }
          const menu = document.querySelector(
            "[data-testid='searchscope-menu']",
          ) as HTMLElement | null;
          const style = menu ? getComputedStyle(menu) : null;
          const visible =
            !!menu &&
            style?.display !== "none" &&
            style?.visibility !== "hidden" &&
            style?.opacity !== "0";
          frames.push({
            visible,
            opacity: style?.opacity ?? null,
            display: style?.display ?? null,
            visibility: style?.visibility ?? null,
            hasNode: !!menu,
          });
          requestAnimationFrame(() => sample(n - 1));
        };
        requestAnimationFrame(() => sample(240));
      });

      const steps = 32;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const { x, y } = scenario.fn(t);
        await page.mouse.move(x, y, { steps: 1 });
        await page.waitForTimeout(6);
      }

      // Wait for sampler to finish.
      await page.waitForFunction(
        () => {
          const frames = (window as any).__scopeSweepFrames;
          return Array.isArray(frames) && frames.length >= 120;
        },
        undefined,
        { timeout: 4000 },
      );

      const frames = await page.evaluate(
        () =>
          (window as any).__scopeSweepFrames as Array<{
            visible: boolean;
            opacity: string | null;
            display: string | null;
            visibility: string | null;
            hasNode: boolean;
          }>,
      );

      const firstVisible = frames.findIndex((f) => f.visible);
      expect(firstVisible).toBeGreaterThanOrEqual(0);
      const hiddenAfterShow = frames
        .slice(firstVisible)
        .some((f) => !f.visible);
      if (hiddenAfterShow) {
        const firstHidden =
          frames.slice(firstVisible).findIndex((f) => !f.visible) +
          firstVisible;
        const hiddenCount = frames
          .slice(firstVisible)
          .filter((f) => !f.visible).length;
        const hiddenIndices = frames
          .map((f, i) => ({ ...f, i }))
          .filter((f) => !f.visible)
          .map((f) => f.i);
        const hiddenSamples = hiddenIndices
          .slice(0, 5)
          .map((index) => frames[index]);
        console.log("diagonal sweep hidden", {
          label: scenario.label,
          firstVisible,
          firstHidden,
          hiddenCount,
          hiddenIndices,
          hiddenSamples,
          total: frames.length,
          visibilityLog: await page.evaluate(
            () =>
              (window as any).__scopeVisibleLog as Array<{
                t: number;
                visible: boolean;
              }>,
          ),
          bandLog: await page.evaluate(
            () =>
              (window as any).__scopeBandLog as Array<{
                x: number;
                min: number;
                max: number;
                t: number;
              }>,
          ),
        });
      }
      expect(hiddenAfterShow).toBe(false);
    }
  });

  test("hides when leaving the menu bounds", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const menu = page.getByTestId("searchscope-menu");

    await descendIntoBand(page, centerX, barBox.y + 8, barBox.y + barBox.height + 8, 340);
    await menu.waitFor({ state: "visible", timeout: 1500 });

    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error("Menu bounding box not found");

    // Enter the menu to assert hover state sticks.
    await page.mouse.move(menuBox.x + menuBox.width / 2, menuBox.y + menuBox.height / 2, {
      steps: 3,
    });
    await page.waitForTimeout(40);
    await expect(menu).toBeVisible();

    // Move away from both bar and menu; the menu should disappear quickly.
    await page.mouse.move(menuBox.x + menuBox.width + 200, menuBox.y - 160, { steps: 4 });
    await page.waitForTimeout(240);
    await expect(menu).toBeHidden({ timeout: 240 });
  });

  test("hides when pointer drifts far from its hover point", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const menu = page.getByTestId("searchscope-menu");

    await descendIntoBand(page, centerX, barBox.y + 8, barBox.y + barBox.height + 10, 340);
    await menu.waitFor({ state: "visible", timeout: 1500 });

    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error("Menu bounding box not found");

    // Move laterally outside the hover point while staying near the bar height.
    await page.mouse.move(menuBox.x + menuBox.width + 240, menuBox.y + menuBox.height / 2, {
      steps: 3,
    });
    await page.waitForTimeout(120);

    await expect(menu).toBeHidden({ timeout: 220 });
  });

  test("is only visible while the hover segment is present", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const outline = page.getByTestId("searchbar-outline-hover");
    const menu = page.getByTestId("searchscope-menu");

    await descendIntoBand(page, centerX, barBox.y + 8, barBox.y + barBox.height + 8, 340);
    await outline.waitFor({ state: "visible", timeout: 1500 });
    await menu.waitFor({ state: "visible", timeout: 1500 });

    // Remove hover by moving well outside the bar; segment should vanish and menu should follow.
    await page.mouse.move(barBox.x - 200, barBox.y + barBox.height + 300, { steps: 4 });
    await page.evaluate(
      ({ x, y }) =>
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y })),
      { x: barBox.x - 200, y: barBox.y + barBox.height + 300 },
    );
    await page.waitForTimeout(300);

    await expect(outline).toBeHidden({ timeout: 600 });
    await expect(menu).toBeHidden({ timeout: 400 });
  });

  test("menu box aligns horizontally with the hover segment", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const menu = page.getByTestId("searchscope-menu");
    const outline = page.getByTestId("searchbar-outline-hover");

    const hoverPositions = [
      { label: "left quarter", x: barBox.x + barBox.width * 0.25 },
      { label: "center", x: barBox.x + barBox.width * 0.5 },
      { label: "right quarter", x: barBox.x + barBox.width * 0.75 },
    ];

    for (const pos of hoverPositions) {
      await page.mouse.move(barBox.x - 200, barBox.y + barBox.height + 300, { steps: 4 });
      await page.evaluate(
        ({ x, y }) =>
          window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y })),
        { x: barBox.x - 200, y: barBox.y + barBox.height + 300 },
      );
      await page.waitForTimeout(500);
      await expect(menu).toBeHidden({ timeout: 800 });

      await descendIntoBand(page, pos.x, barBox.y + 8, barBox.y + barBox.height - 4, 360);
      await menu.waitFor({ state: "visible", timeout: 1500 });
      await outline.waitFor({ state: "visible", timeout: 1500 });

      const segmentCenterPageX = await outline.evaluate((el) => {
        const offset = parseFloat(el.getAttribute("data-offset")!);
        const dashArr = el.getAttribute("stroke-dasharray")!;
        const segLen = parseFloat(dashArr.split(" ")[0]);

        const rect = el as unknown as SVGGeometryElement;
        const total = rect.getTotalLength();
        const centerOffset = ((offset + segLen / 2) % total + total) % total;
        const point = rect.getPointAtLength(centerOffset);

        const svgEl = el.closest("svg")!;
        const svgRect = svgEl.getBoundingClientRect();
        return svgRect.left + point.x;
      });

      expect(segmentCenterPageX).not.toBeNull();

      const menuBox = await menu.boundingBox();
      if (!menuBox) throw new Error(`Menu box not found at ${pos.label}`);
      const menuCenterX = menuBox.x + menuBox.width / 2;

      const drift = Math.abs(segmentCenterPageX! - menuCenterX);
      expect(
        drift,
        `Menu center and segment center should align at ${pos.label} (drift=${drift.toFixed(1)}px)`,
      ).toBeLessThan(25);
    }
  });

  test("never repositions after it spawns", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("Search bar bounding box not found");

    const centerX = barBox.x + barBox.width / 2;
    const menu = page.getByTestId("searchscope-menu");

    await descendIntoBand(page, centerX, barBox.y + 8, barBox.y + barBox.height + 8, 340);
    await menu.waitFor({ state: "visible", timeout: 1500 });

    await expect(menu, "menu should stay mounted before sampling drift").toBeVisible({
      timeout: 800,
    });

    const initialBox = await menu.boundingBox();
    if (!initialBox) throw new Error("Menu bounding box not found");

    const samples: Array<{ x: number; y: number }> = [];

    // Move across the bar to places that normally shift the hover segment; menu
    // should not translate at all once mounted.
    const sweepXs = [
      barBox.x + 32,
      barBox.x + barBox.width * 0.33,
      centerX,
      barBox.x + barBox.width * 0.66,
      barBox.x + barBox.width - 32,
    ];
    for (const x of sweepXs) {
      await page.mouse.move(x, barBox.y + barBox.height / 2, { steps: 3 });
      await page.waitForTimeout(50);
      await expect(menu, "menu vanished during drift sampling").toBeVisible({
        timeout: 300,
      });
      const box = await menu.boundingBox();
      if (box) {
        samples.push({ x: box.x, y: box.y });
      } else {
        throw new Error("Menu bounding box missing during drift sampling");
      }
    }

    const maxDrift = samples.reduce(
      (acc, sample) => ({
        dx: Math.max(acc.dx, Math.abs(sample.x - initialBox.x)),
        dy: Math.max(acc.dy, Math.abs(sample.y - initialBox.y)),
      }),
      { dx: 0, dy: 0 },
    );

    expect(maxDrift.dx).toBe(0);
    expect(maxDrift.dy).toBe(0);
  });
});

test.describe("segment–menu alignment contract", () => {
  const installMachineObserver = async (page: Page) => {
    await page.evaluate(() => {
      const w = window as any;
      w.__scopeMachineLog = [];
      w.__scopeVisibleLog = [];
      w.__scopeLatchLog = [];
      w.__scopeObserverLog = [];
      w.__scopeMachineObservers = [];
      const observer = (payload: unknown) => {
        w.__scopeObserverLog.push(payload);
      };
      w.__scopeMachineObservers.push(observer);
    });
  };

  const gotoAndInstall = async (page: Page) => {
    await page.goto("/");
    await installMachineObserver(page);
  };

  const descendIntoBand = async (
    page: Page,
    x: number,
    startY: number,
    endY: number,
    durationMs = 320,
  ) => {
    const steps = 18;
    const stepSize = (endY - startY) / steps;
    const pause = Math.max(6, Math.round(durationMs / steps));
    for (let i = 0; i <= steps; i++) {
      const y = startY + stepSize * i;
      await page.mouse.move(x, y, { steps: 1 });
      await page.waitForTimeout(pause);
    }
  };

  const dismissMenu = async (page: Page, barBox: { x: number; y: number; width: number; height: number }) => {
    await page.mouse.move(barBox.x - 200, barBox.y + barBox.height + 300, { steps: 4 });
    await page.evaluate(
      ({ x, y }) =>
        window.dispatchEvent(new MouseEvent("mousemove", { clientX: x, clientY: y })),
      { x: barBox.x - 200, y: barBox.y + barBox.height + 300 },
    );
    await page.waitForTimeout(500);
  };

  const spawnMenuAt = async (
    page: Page,
    x: number,
    barBox: { x: number; y: number; width: number; height: number },
    menu: ReturnType<Page["getByTestId"]>,
  ) => {
    await descendIntoBand(page, x, barBox.y + 8, barBox.y + barBox.height - 4, 360);
    await menu.waitFor({ state: "visible", timeout: 1500 });
  };

  const getSegmentEdgesPageX = async (outline: ReturnType<Page["getByTestId"]>) => {
    return outline.evaluate((el) => {
      const offset = parseFloat(el.getAttribute("data-offset")!);
      const segLen = parseFloat(el.getAttribute("stroke-dasharray")!.split(" ")[0]);
      const rect = el as unknown as SVGGeometryElement;
      const total = rect.getTotalLength();
      const startOff = ((offset % total) + total) % total;
      const endOff = (((offset + segLen) % total) + total) % total;
      const startPt = rect.getPointAtLength(startOff);
      const endPt = rect.getPointAtLength(endOff);
      const svgRect = el.closest("svg")!.getBoundingClientRect();
      const x1 = svgRect.left + startPt.x;
      const x2 = svgRect.left + endPt.x;
      return { left: Math.min(x1, x2), right: Math.max(x1, x2) };
    });
  };

  test.beforeEach(async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[browser:${msg.type()}]`, msg.text());
    });
  });

  test("segment and menu share the same width", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("bar not found");

    const menu = page.getByTestId("searchscope-menu");
    const outline = page.getByTestId("searchbar-outline-hover");
    const centerX = barBox.x + barBox.width / 2;

    await spawnMenuAt(page, centerX, barBox, menu);
    await outline.waitFor({ state: "visible", timeout: 1500 });

    const segWidth = await outline.evaluate((el) => {
      return parseFloat(el.getAttribute("stroke-dasharray")!.split(" ")[0]);
    });

    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error("menu not found");

    expect(
      Math.abs(segWidth - menuBox.width),
      `Segment width (${segWidth}) should match menu width (${menuBox.width})`,
    ).toBeLessThan(2);
  });

  test("menu left edge aligns with segment left edge at center", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("bar not found");

    const menu = page.getByTestId("searchscope-menu");
    const outline = page.getByTestId("searchbar-outline-hover");
    const centerX = barBox.x + barBox.width / 2;

    await spawnMenuAt(page, centerX, barBox, menu);
    await outline.waitFor({ state: "visible", timeout: 1500 });

    const segEdges = await getSegmentEdgesPageX(outline);
    const menuBox = await menu.boundingBox();
    if (!menuBox) throw new Error("menu not found");

    const drift = Math.abs(segEdges.left - menuBox.x);
    expect(
      drift,
      `Segment left edge (${segEdges.left.toFixed(1)}) should align with menu left edge (${menuBox.x.toFixed(1)}), drift=${drift.toFixed(1)}px`,
    ).toBeLessThan(5);
  });

  test("menu left edge aligns with segment left edge at varied positions", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("bar not found");

    const menu = page.getByTestId("searchscope-menu");
    const outline = page.getByTestId("searchbar-outline-hover");

    const fractions = [0.2, 0.4, 0.6, 0.8];

    for (const frac of fractions) {
      await dismissMenu(page, barBox);
      await expect(menu).toBeHidden({ timeout: 800 });

      const hoverX = barBox.x + barBox.width * frac;
      await spawnMenuAt(page, hoverX, barBox, menu);
      await outline.waitFor({ state: "visible", timeout: 1500 });

      const segEdges = await getSegmentEdgesPageX(outline);
      const menuBox = await menu.boundingBox();
      if (!menuBox) throw new Error(`menu not found at ${(frac * 100).toFixed(0)}%`);

      const drift = Math.abs(segEdges.left - menuBox.x);
      expect(
        drift,
        `At ${(frac * 100).toFixed(0)}%: segment left (${segEdges.left.toFixed(1)}) vs menu left (${menuBox.x.toFixed(1)}), drift=${drift.toFixed(1)}px`,
      ).toBeLessThan(5);
    }
  });

  test("menu spawns at the hovered position, not always at center", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("bar not found");

    const menu = page.getByTestId("searchscope-menu");
    const leftX = barBox.x + barBox.width * 0.25;
    const rightX = barBox.x + barBox.width * 0.75;

    await spawnMenuAt(page, leftX, barBox, menu);
    const leftBox = await menu.boundingBox();
    if (!leftBox) throw new Error("menu not found at left quarter");
    const leftCenter = leftBox.x + leftBox.width / 2;

    await dismissMenu(page, barBox);
    await expect(menu).toBeHidden({ timeout: 800 });

    await spawnMenuAt(page, rightX, barBox, menu);
    const rightBox = await menu.boundingBox();
    if (!rightBox) throw new Error("menu not found at right quarter");
    const rightCenter = rightBox.x + rightBox.width / 2;

    const separation = Math.abs(rightCenter - leftCenter);
    const expectedMinSeparation = barBox.width * 0.4;
    expect(
      separation,
      `Menu should spawn at different positions: left center=${leftCenter.toFixed(0)}, right center=${rightCenter.toFixed(0)}, separation=${separation.toFixed(0)}px, expected ≥${expectedMinSeparation.toFixed(0)}px`,
    ).toBeGreaterThanOrEqual(expectedMinSeparation);
  });

  test("edge clamping keeps menu on-screen without breaking width", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("bar not found");

    const menu = page.getByTestId("searchscope-menu");
    const expectedWidth = 400;
    const widthTolerance = 20;

    const nearLeftX = barBox.x + 30;
    await spawnMenuAt(page, nearLeftX, barBox, menu);
    const leftBox = await menu.boundingBox();
    if (!leftBox) throw new Error("menu not found near left edge");

    expect(leftBox.x).toBeGreaterThanOrEqual(0);
    expect(leftBox.width).toBeGreaterThanOrEqual(expectedWidth - widthTolerance);
    expect(leftBox.width).toBeLessThanOrEqual(expectedWidth + widthTolerance);

    await dismissMenu(page, barBox);
    await expect(menu).toBeHidden({ timeout: 800 });

    const viewportWidth = await page.evaluate(() => window.innerWidth);
    const nearRightX = barBox.x + barBox.width - 30;
    await spawnMenuAt(page, nearRightX, barBox, menu);
    const rightBox = await menu.boundingBox();
    if (!rightBox) throw new Error("menu not found near right edge");

    expect(rightBox.x + rightBox.width).toBeLessThanOrEqual(viewportWidth);
    expect(rightBox.width).toBeGreaterThanOrEqual(expectedWidth - widthTolerance);
    expect(rightBox.width).toBeLessThanOrEqual(expectedWidth + widthTolerance);
  });

  test("mid-height descent aligns menu with hover point, not center", async ({ page }) => {
    await gotoAndInstall(page);

    const bar = page.getByTestId("searchbar");
    await bar.waitFor();
    const barBox = await bar.boundingBox();
    if (!barBox) throw new Error("bar not found");

    const menu = page.getByTestId("searchscope-menu");
    const barCenterX = barBox.x + barBox.width / 2;

    for (const [label, startX] of [
      ["leftQ", barBox.x + barBox.width * 0.25],
      ["rightQ", barBox.x + barBox.width * 0.75],
    ] as const) {
      await dismissMenu(page, barBox);
      await expect(menu).toBeHidden({ timeout: 800 });

      await page.mouse.move(startX, barBox.y - 50);
      await page.waitForTimeout(80);
      await page.mouse.move(startX, barBox.y + barBox.height / 2);
      await page.waitForTimeout(80);

      const endY = barBox.y + barBox.height - 4;
      await descendIntoBand(page, startX, barBox.y + barBox.height / 2, endY, 360);
      await menu.waitFor({ state: "visible", timeout: 1500 });

      const menuBox = await menu.boundingBox();
      if (!menuBox) throw new Error(`menu not found at ${label}`);

      const menuCenter = menuBox.x + menuBox.width / 2;
      const driftFromHover = Math.abs(menuCenter - startX);
      const driftFromCenter = Math.abs(menuCenter - barCenterX);

      expect(
        driftFromCenter,
        `${label}: menu should NOT be at center — menuCenter=${menuCenter.toFixed(0)}, barCenter=${barCenterX.toFixed(0)}`,
      ).toBeGreaterThan(barBox.width * 0.15);

      expect(
        driftFromHover,
        `${label}: menu center (${menuCenter.toFixed(0)}) should be near hover point (${startX.toFixed(0)}), drift=${driftFromHover.toFixed(0)}px`,
      ).toBeLessThan(25);
    }
  });
});
