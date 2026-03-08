import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Provider, createStore } from "jotai";
import SearchBar from "@/components/SearchBar";
import { searchBarHiddenClass } from "@/components/ui";
import * as perimeterModule from "@/components/SearchBar/perimeter";
import { flowDraggingAtom } from "@/state/searchbar";

const movePointer = (element: HTMLElement, x: number, y: number) => {
  fireEvent.pointerMove(element, { clientX: x, clientY: y });
};

const getContainer = () =>
  screen.getByRole("textbox").closest("[data-focused]") as HTMLElement;

const renderSearchBar = (props?: ComponentProps<typeof SearchBar>) => {
  const store = createStore();

  return {
    store,
    ...render(
      <Provider store={store}>
        <SearchBar {...props} />
      </Provider>,
    ),
  };
};

const mockRect = (width = 320, height = 64, left = 0, top = 0) => {
  const right = left + width;
  const bottom = top + height;
  return {
    width,
    height,
    top,
    left,
    right,
    bottom,
    x: left,
    y: top,
    toJSON: () => ({}),
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SearchBar (vitest)", () => {
  it("renders input and replay button", () => {
    renderSearchBar();

    const input = screen.getByRole("textbox");
    const button = screen.getByRole("button", { name: /replay/i });

    expect(input).toBeInTheDocument();
    expect(button).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search symbol...");
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("invokes onReplay when the replay button is clicked", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();

    renderSearchBar({ onReplay });

    await user.click(screen.getByRole("button", { name: /replay/i }));

    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it("passes the query when replay is triggered", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();

    renderSearchBar({ onReplay });

    const input = screen.getByRole("textbox");

    await user.type(input, "useQuery");
    await user.click(screen.getByRole("button", { name: /replay/i }));

    expect(onReplay).toHaveBeenCalledWith("useQuery");
  });

  it("triggers replay when pressing Enter", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();

    renderSearchBar({ onReplay });

    const input = screen.getByRole("textbox");

    await user.type(input, "focusManager{enter}");

    expect(onReplay).toHaveBeenCalledWith("focusManager");
  });

  it("clears the input after replay", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();

    renderSearchBar({ onReplay });

    const input = screen.getByRole("textbox");

    await user.type(input, "reactQuery");
    await user.keyboard("{enter}");

    await waitFor(() => {
      expect(input).toHaveValue("");
    });
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it("shows focus highlight when input is focused", async () => {
    const user = userEvent.setup();

    renderSearchBar();

    const input = screen.getByRole("textbox");

    await user.click(input);

    const container = input.closest('[data-focused="true"]');

    expect(container).toBeTruthy();
  });

  it("removes highlight when input loses focus", async () => {
    const user = userEvent.setup();

    renderSearchBar();

    const input = screen.getByRole("textbox");

    await user.click(input);
    await user.tab();

    const container = input.closest('[data-focused="true"]');

    expect(container).toBeNull();
  });

  it("keeps the input focused after replay", async () => {
    const user = userEvent.setup();
    const onReplay = vi.fn();

    renderSearchBar({ onReplay });

    const input = screen.getByRole("textbox");

    await user.type(input, "query{enter}");

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("projects pointer moves to a hover segment along the perimeter", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect() as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    const perimeterSpy = vi
      .spyOn(perimeterModule, "findClosestPerimeterLength")
      .mockReturnValue({ bestLength: 120, total: 400, point: { x: 0, y: 0 } });

    renderSearchBar();

    const container = getContainer();

    movePointer(container, 50, 20);

    const hoverOutline = await screen.findByTestId(
      "searchbar-outline-hover",
    );

    expect(perimeterSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        clientX: 50,
        clientY: 20,
      }),
    );
    expect(hoverOutline).toHaveAttribute("data-offset", "320");
    expect(hoverOutline).toHaveAttribute("data-variant", "hover");
  });

  it("updates the hover segment offset and clears it on leave", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect() as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength")
      .mockReturnValueOnce({ bestLength: 200, total: 400, point: { x: 0, y: 0 } })
      .mockReturnValueOnce({ bestLength: 260, total: 400, point: { x: 0, y: 0 } });

    renderSearchBar();

    const container = getContainer();

    movePointer(container, 30, 18);

    let hoverOutline = await screen.findByTestId("searchbar-outline-hover");
    expect(hoverOutline).toHaveAttribute("data-offset", "0");

    movePointer(container, 90, 32);

    hoverOutline = await screen.findByTestId("searchbar-outline-hover");
    expect(hoverOutline).toHaveAttribute("data-offset", "0");

    fireEvent.pointerLeave(container);

    await waitFor(() => {
      expect(screen.queryByTestId("searchbar-outline-hover")).toBeNull();
    });
  });

  it("wraps the outline from the last hover point when the input focuses", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect() as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength").mockReturnValue({
      bestLength: 200,
      total: 400,
      point: { x: 0, y: 0 },
    });

    renderSearchBar({ outlineLockDelayMs: 1000 });

    const input = screen.getByRole("textbox");
    const container = getContainer();

    movePointer(container, 44, 22);
    await screen.findByTestId("searchbar-outline-hover");
    fireEvent.focus(input);

    expect(getContainer()).toHaveAttribute("data-focused", "true");

    const focusOutline = screen.getByTestId("searchbar-outline-focus");

    expect(focusOutline).toHaveAttribute("data-focus-origin", "0");
    expect(focusOutline).toHaveAttribute("data-variant", "focus");
  });

  it("clears hover segments when focus is lost", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect() as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength").mockReturnValue({
      bestLength: 150,
      total: 400,
      point: { x: 0, y: 0 },
    });

    renderSearchBar();

    const input = screen.getByRole("textbox");
    const container = getContainer();

    movePointer(container, 10, 10);

    await screen.findByTestId("searchbar-outline-hover");

    fireEvent.focus(input);
    fireEvent.blur(input);

    expect(screen.queryByTestId("searchbar-outline-hover")).toBeNull();
  });

  it("hides the scope menu when the input is focused", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect(320, 64) as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength").mockReturnValue({
      bestLength: 200,
      total: 400,
      point: { x: 160, y: 64 },
    });

    renderSearchBar();

    const input = screen.getByRole("textbox");
    const container = getContainer();

    movePointer(container, 160, 40);
    movePointer(container, 160, 76);
    await screen.findByTestId("searchscope-menu");

    await userEvent.click(input);

    await waitFor(() =>
      expect(screen.queryByTestId("searchscope-menu")).toBeNull(),
    );
  });

  it("keeps the scope menu visible when exiting downward from the bar", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect(320, 64) as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength").mockReturnValue({
      bestLength: 200,
      total: 400,
      point: { x: 160, y: 64 },
    });

    renderSearchBar();

    const container = getContainer();

    movePointer(container, 160, 40);
    movePointer(container, 160, 76);

    await screen.findByTestId("searchbar-outline-hover");
    await screen.findByTestId("searchscope-menu");

    fireEvent.pointerLeave(container);

    expect(screen.getByTestId("searchscope-menu")).toBeInTheDocument();
  });

  it("keeps the scope menu visible for at least 600ms after exit near the bottom", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect(320, 64) as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength").mockReturnValue({
      bestLength: 200,
      total: 400,
      point: { x: 160, y: 64 },
    });

    renderSearchBar();

    const container = getContainer();

    movePointer(container, 160, 40);
    movePointer(container, 160, 84);

    await screen.findByTestId("searchbar-outline-hover");
    await screen.findByTestId("searchscope-menu");

    fireEvent.pointerLeave(container);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
    });

    await waitFor(() =>
      expect(screen.queryByTestId("searchscope-menu")).toBeNull(),
    );
  });

  it("hides the search UI while React Flow is dragging", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect(320, 64) as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength").mockReturnValue({
      bestLength: 200,
      total: 400,
      point: { x: 160, y: 64 },
    });

    const { store } = renderSearchBar();

    const container = getContainer();

    movePointer(container, 160, 40);
    movePointer(container, 160, 76);

    await screen.findByTestId("searchscope-menu");

    act(() => {
      store.set(flowDraggingAtom, true);
    });

    expect(container).toHaveAttribute("data-hidden", "true");

    act(() => {
      store.set(flowDraggingAtom, false);
    });

    expect(await screen.findByRole("textbox")).toBeInTheDocument();
  });

  it("positions the scope menu under the segment and follows its movement", async () => {
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(
      mockRect(300, 60, 100, 200) as DOMRect,
    );
    vi.spyOn(SVGGeometryElement.prototype, "getTotalLength").mockReturnValue(
      400,
    );
    vi.spyOn(perimeterModule, "findClosestPerimeterLength")
      .mockReturnValueOnce({
        bestLength: 180,
        total: 400,
        point: { x: 50, y: 0 },
      })
      .mockReturnValueOnce({
        bestLength: 220,
        total: 400,
        point: { x: 220, y: 0 },
      });

    renderSearchBar();

    const container = getContainer();

    movePointer(container, 220, 240);
    movePointer(container, 220, 280);
    await screen.findByTestId("searchscope-menu");
    const firstMenu = screen.getByTestId("searchscope-menu");
    const firstTop = Number(firstMenu.getAttribute("data-top"));
    const firstWidth = Number(firstMenu.getAttribute("data-width"));

    expect(firstWidth).toBeCloseTo(300, 0);
    expect(firstTop).toBeGreaterThanOrEqual(276);

    movePointer(container, 520, 240);
    movePointer(container, 520, 280);

    const hoverOutline = screen.getByTestId("searchbar-outline-hover");
    expect(hoverOutline).toBeInTheDocument();

    const menu = screen.getByTestId("searchscope-menu");
    expect(menu).toBeInTheDocument();
  });
});
