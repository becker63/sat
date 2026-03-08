import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { describe, expect, it } from "vitest";
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

describe("SearchScopeMenu", () => {
  it("shows when hover is active and the pointer moves below the bar", () => {
    const { store } = renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 20 }],
      ]),
    );

    act(() => {
      store.set(pointerPositionAtom, { x: 160, y: 90 });
    });

    expect(screen.getByTestId("searchscope-menu")).toBeInTheDocument();
  });

  it("hides when no hover offset is present", () => {
    renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, null],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 90 }],
      ]),
    );

    expect(screen.queryByTestId("searchscope-menu")).toBeNull();
  });

  it("stays visible when hovered even if pointer leaves trigger area", () => {
    renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [scopeMenuHoverAtom, true],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, null],
      ]),
    );

    expect(screen.getByTestId("searchscope-menu")).toBeInTheDocument();
  });

  it("does not show if the pointer is above the trigger line", () => {
    const { unmount } = renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 5 }],
      ]),
    );

    const menu = screen.getByTestId("searchscope-menu");
    expect(menu).toBeInTheDocument();
    expect(menu.style.opacity).toBe("0");
    unmount();
  });

  it("shows across the entire bottom band under the segment", () => {
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
      });

      expect(screen.getByTestId("searchscope-menu")).toBeInTheDocument();
      unmount();
    }
  });

  it("aligns left based on the hover anchor and bar position", () => {
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
    });

    const menu = screen.getByTestId("searchscope-menu");
    expect(Number(menu.getAttribute("data-left"))).toBeCloseTo(58, 0);
    expect(Number(menu.getAttribute("data-width"))).toBeCloseTo(184, 0);
    expect(Number(menu.getAttribute("data-top"))).toBeGreaterThan(140);
  });

  it("hides when leaving the menu itself", () => {
    renderWithState((store) =>
      setStateEntries(store, [
        [hoverOffsetAtom, 10],
        [scopeMenuHoverAtom, true],
        [searchBarSizeAtom, { width: 320, height: 80 + outlineInset * 2 }],
        [pointerPositionAtom, { x: 160, y: 90 }],
      ]),
    );

    const menu = screen.getByTestId("searchscope-menu");
    fireEvent.pointerLeave(menu);

    return waitFor(() =>
      expect(screen.queryByTestId("searchscope-menu")).toBeNull(),
    );
  });
});
