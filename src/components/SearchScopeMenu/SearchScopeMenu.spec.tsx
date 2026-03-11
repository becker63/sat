import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchScopeMenu } from "./SearchScopeMenu";
import {
  hoverOffsetAtom,
  hoverAnchorAtom,
  pointerPositionAtom,
  scopeMenuHoverAtom,
  searchBarSizeAtom,
  searchBarPositionAtom,
} from "@/state/searchbar";

const outlineInset = 8;

const renderWithState = (
  setState: (store: ReturnType<typeof createStore>) => void,
) => {
  const store = createStore();
  setState(store);

  const result = render(
    <Provider store={store}>
      <div style={{ width: "320px", height: "100px" }}>
        <SearchScopeMenu outlineInset={outlineInset} />
      </div>
    </Provider>,
  );
  return { ...result, store };
};

const setStateEntries = (
  store: ReturnType<typeof createStore>,
  entries: Array<[any, any]>,
) => {
  for (const [atom, value] of entries) {
    store.set(atom, value);
  }
};

afterEach(() => {
  vi.useRealTimers();
});

describe("SearchScopeMenu", () => {
  it("shows when hover is active and the pointer moves below the bar", () => {
    vi.useFakeTimers();

    const { store } = renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 20 }],
      ]),
    );

    act(() => {
      store.set(pointerPositionAtom, { x: 160, y: 90 });
      vi.advanceTimersByTime(320);
      // nudge to trigger recalculation after the delay window
      store.set(pointerPositionAtom, { x: 160, y: 90 });
    });

    expect(screen.getByTestId("searchscope-menu")).toBeInTheDocument();
  });

  it("hides when no hover offset is present", () => {
    vi.useFakeTimers();

    renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, null],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 90 }],
      ]),
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByTestId("searchscope-menu")).toBeNull();
  });

  it("stays visible when hovered even if pointer leaves trigger area", () => {
    vi.useFakeTimers();

    renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [scopeMenuHoverAtom, true],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, null],
      ]),
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.getByTestId("searchscope-menu")).toBeInTheDocument();
  });

  it("does not show if the pointer is above the trigger line", () => {
    vi.useFakeTimers();

    const { unmount } = renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 5 }],
      ]),
    );

    act(() => {
      vi.runAllTimers();
    });

    expect(screen.queryByTestId("searchscope-menu")).toBeNull();
    unmount();
  });

  it("shows across the entire bottom band under the segment", () => {
    vi.useFakeTimers();

    const height = 80 + outlineInset * 2;
    const contentHeight = 80;
    const triggerY = 76;

    const bandSamples = [
      triggerY,
      triggerY + 4,
      triggerY + 8,
      contentHeight + 4,
    ];

    for (const y of bandSamples) {
      const { store, unmount } = renderWithState((store) =>
        setStateEntries(store, [
          [hoverOffsetAtom, 10],
          [searchBarSizeAtom, { width: 320, height }],
          [pointerPositionAtom, { x: 160, y: triggerY - 10 }],
        ]),
      );

      act(() => {
        store.set(pointerPositionAtom, { x: 160, y });
        vi.advanceTimersByTime(320);
        store.set(pointerPositionAtom, { x: 160, y });
      });

      expect(screen.getByTestId("searchscope-menu")).toBeInTheDocument();
      unmount();
    }
  });

  it("aligns left based on the hover anchor and bar position", () => {
    vi.useFakeTimers();

    const { store } = renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [searchBarSizeAtom, { width: 200, height: 80 + outlineInset * 2 }],
        [searchBarPositionAtom, { left: 100, top: 50 }],
        [pointerPositionAtom, { x: 120, y: 60 }],
        [scopeMenuHoverAtom, true],
        [hoverAnchorAtom, { x: 150, y: 0 }],
      ]),
    );

    act(() => {
      store.set(pointerPositionAtom, { x: 120, y: 90 });
      vi.runAllTimers();
    });

    const menu = screen.getByTestId("searchscope-menu");
    expect(Number(menu.getAttribute("data-left"))).toBeCloseTo(58, 0);
    expect(Number(menu.getAttribute("data-width"))).toBeCloseTo(184, 0);
    expect(Number(menu.getAttribute("data-top"))).toBeGreaterThan(140);
  });

  it("hides when leaving the menu itself", () => {
    vi.useFakeTimers();

    renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [scopeMenuHoverAtom, true],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 90 }],
      ]),
    );

    act(() => {
      vi.runAllTimers();
    });

    const menu = screen.getByTestId("searchscope-menu");
    fireEvent.pointerLeave(menu);

    act(() => {
      vi.runAllTimers();
    });

    const maybeMenu = screen.queryByTestId("searchscope-menu");
    if (maybeMenu) {
      expect(
        window.getComputedStyle(maybeMenu as HTMLElement).opacity,
      ).toBe("0");
    } else {
      expect(maybeMenu).toBeNull();
    }
  });
});
