import { useEffect, useRef, useCallback, type PointerEvent } from "react";
import { useAtom, useAtomValue, useSetAtom } from "jotai";

import { findClosestPerimeterLength } from "@/components/SearchBar/perimeter";
import {
  focusOriginAtom,
  hoverOffsetAtom,
  hoverAnchorAtom,
  outlineLockedAtom,
  perimeterAtom,
  pointerPositionAtom,
  queryAtom,
  searchBarSizeAtom,
  searchBarPositionAtom,
  searchFocusedAtom,
  scopeMenuHoverAtom,
  flowDraggingAtom,
  searchBarContainerAtom,
  searchBarPathAtom,
} from "@/state/searchbar";

const MENU_HOLD_MARGIN = 24;
const MENU_HORIZONTAL_MARGIN = 200;

type UseSearchBarOptions = {
  outlineInset: number;
  hoverSegmentLength: number;
  outlineLockDelay?: number;
  onReplay?: (query?: string) => void;
  menuState?: {
    visible: boolean;
    dwelling: boolean;
  };
};

export function useSearchBar({
  outlineInset,
  hoverSegmentLength,
  outlineLockDelay = 300,
  onReplay,
  menuState,
}: UseSearchBarOptions) {
  const [value, setValue] = useAtom(queryAtom);
  const [focused, setFocused] = useAtom(searchFocusedAtom);
  const [outlineLocked, setOutlineLocked] = useAtom(outlineLockedAtom);
  const [size, setSize] = useAtom(searchBarSizeAtom);
  const [, setPosition] = useAtom(searchBarPositionAtom);
  const [hoverOffset, setHoverOffset] = useAtom(hoverOffsetAtom);
  const [hoverAnchor, setHoverAnchor] = useAtom(hoverAnchorAtom);
  const [focusOrigin, setFocusOrigin] = useAtom(focusOriginAtom);
  const [perimeter, setPerimeter] = useAtom(perimeterAtom);
  const [pointerPosition, setPointerPosition] = useAtom(pointerPositionAtom);
  const [menuHover, setMenuHover] = useAtom(scopeMenuHoverAtom);
  const flowDragging = useAtomValue(flowDraggingAtom);
  const setBarContainer = useSetAtom(searchBarContainerAtom);
  const setBarPath = useSetAtom(searchBarPathAtom);

  const menuVisible = menuState?.visible ?? false;
  const dwelling = menuState?.dwelling ?? false;

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoverPathRef = useRef<SVGRectElement>(null);
  const lastWithinBandAt = useRef<number | null>(null);
  const pendingPointer = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );
  const pointerFrame = useRef<number | null>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingBandClear = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disposedRef = useRef(false);
  useEffect(
    () => () => {
      disposedRef.current = true;
      if (lockTimer.current) clearTimeout(lockTimer.current);
      if (pointerFrame.current !== null)
        cancelAnimationFrame(pointerFrame.current);
    },
    [],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const rect = node.getBoundingClientRect();

      setSize({
        width: rect.width + outlineInset * 2,
        height: rect.height + outlineInset * 2,
      });
      setPosition({ left: rect.left, top: rect.top });
    };

    update();

    const ro = new ResizeObserver(update);
    ro.observe(node);

    return () => ro.disconnect();
  }, [outlineInset, setPosition, setSize]);

  useEffect(() => {
    setBarContainer(containerRef.current);
    setBarPath(hoverPathRef.current);
  }, [setBarContainer, setBarPath, size]);

  useEffect(() => {
    const path = hoverPathRef.current;
    if (!path) return;

    setPerimeter(path.getTotalLength());
  }, [setPerimeter, size]);

  const safeSetPointerPosition = useCallback(
    (value: { x: number; y: number } | null) => {
      if (disposedRef.current) return;
      setPointerPosition(value);
    },
    [setPointerPosition],
  );

  const triggerReplay = () => {
    if (!onReplay) return;

    onReplay(value);
    setValue("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const processPointerMove = ({
    clientX,
    clientY,
  }: {
    clientX: number;
    clientY: number;
  }) => {
    if (focused || flowDragging) return;

    const container = containerRef.current;
    const path = hoverPathRef.current;
    if (!container || !path) return;

    const containerRect = container.getBoundingClientRect();
    const contentWidth = Math.max(0, size.width - outlineInset * 2);
    const menuWidth =
      Math.min(Math.max(0, hoverSegmentLength), contentWidth) || contentWidth;
    const anchorAbsX = hoverAnchor?.x ?? containerRect.left + contentWidth / 2;
    const horizontalBandHalf = menuWidth / 2 + MENU_HORIZONTAL_MARGIN;
    const pointerWithinBand =
      clientX >= anchorAbsX - horizontalBandHalf &&
      clientX <= anchorAbsX + horizontalBandHalf;

    const now =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    if (pointerWithinBand) {
      lastWithinBandAt.current = now;
    }

    const recentlyWithinBand =
      lastWithinBandAt.current !== null && now - lastWithinBandAt.current < 140;

    const nextPointer = {
      x: clientX - containerRect.left,
      y: clientY - containerRect.top,
    };

    if (menuVisible && (pointerWithinBand || recentlyWithinBand)) {
      // While the menu is owning the interaction, keep the segment fixed and only
      // update the pointer projection for the engine.
      safeSetPointerPosition(nextPointer);
      return;
    }

    safeSetPointerPosition(nextPointer);

    const result = findClosestPerimeterLength({
      container,
      path,
      clientX,
      clientY,
      inset: outlineInset,
    });
    if (!result) return;

    const { bestLength, total, point } = result;
    if (!Number.isFinite(total) || total <= 0) return;

    const centered = bestLength - hoverSegmentLength / 2;
    const normalized = ((centered % total) + total) % total;

    setHoverOffset(normalized);
    if (point && !menuVisible) {
      const anchorX = containerRect.left - outlineInset + point.x;
      const anchorY = containerRect.top - outlineInset + point.y;
      setHoverAnchor({
        x: anchorX,
        y: anchorY,
      });
    }
  };

  const handlePointerMove = ({
    clientX,
    clientY,
  }: {
    clientX: number;
    clientY: number;
  }) => {
    pendingPointer.current = { clientX, clientY };
    if (pointerFrame.current !== null) return;

    pointerFrame.current = requestAnimationFrame(() => {
      pointerFrame.current = null;
      const next = pendingPointer.current;
      pendingPointer.current = null;
      if (!next) return;
      processPointerMove(next);
    });
  };

  const handlePointerLeave = () => {
    if (flowDragging) return;

    const container = containerRef.current;
    const containerRect = container?.getBoundingClientRect();

    // Always clear the projected pointer when leaving the bar so the engine
    // can fall back to global pointer coordinates.
    safeSetPointerPosition(null);

    if (menuVisible || dwelling) return;

    const nearBottom =
      pointerPosition !== null &&
      pointerPosition.y >= size.height - outlineInset - MENU_HOLD_MARGIN;

    if (!focused && !menuHover && !nearBottom) {
      setHoverOffset(null);
      safeSetPointerPosition(null);
    }

    if (!menuVisible) {
      safeSetPointerPosition(null);
    }
  };

  const handleFocus = () => {
    if (flowDragging) return;

    setFocused(true);
    setOutlineLocked(false);
    setMenuHover(false);

    const origin =
      hoverOffset !== null && perimeter > 0 ? hoverOffset / perimeter : 0;

    setFocusOrigin(origin);
    setHoverOffset(null);
    safeSetPointerPosition(null);

    if (lockTimer.current) clearTimeout(lockTimer.current);

    lockTimer.current = setTimeout(() => {
      setOutlineLocked(true);
    }, outlineLockDelay);
  };

  const handleBlur = () => {
    setFocused(false);
    setOutlineLocked(false);
    setHoverOffset(null);
    setHoverAnchor(null);
    safeSetPointerPosition(null);
    setMenuHover(false);

    if (lockTimer.current) clearTimeout(lockTimer.current);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      setFocused(false);
      setOutlineLocked(false);
      setHoverOffset(null);
      setHoverAnchor(null);
      safeSetPointerPosition(null);
      setMenuHover(false);

      if (lockTimer.current) clearTimeout(lockTimer.current);
    };

    window.addEventListener("blur", handleWindowBlur);

    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [
    setFocused,
    setHoverAnchor,
    setHoverOffset,
    setMenuHover,
    setOutlineLocked,
    safeSetPointerPosition,
  ]);

  useEffect(() => {
    if (!menuVisible && hoverOffset === null) return;

    const onPointerMove = (event: PointerEvent | MouseEvent) => {
      if (menuVisible || menuHover) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      safeSetPointerPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      const contentWidth = Math.max(0, size.width - outlineInset * 2);
      const menuWidth =
        Math.min(Math.max(0, hoverSegmentLength), contentWidth) || contentWidth;
      const anchorAbsX = hoverAnchor?.x ?? rect.left + contentWidth / 2;
      const bandHalf = menuWidth / 2 + MENU_HORIZONTAL_MARGIN;

      const withinX =
        event.clientX >= anchorAbsX - bandHalf &&
        event.clientX <= anchorAbsX + bandHalf;

      const now =
        typeof performance !== "undefined" && performance.now
          ? performance.now()
          : Date.now();

      if (withinX) {
        lastWithinBandAt.current = now;
        if (pendingBandClear.current) {
          clearTimeout(pendingBandClear.current);
          pendingBandClear.current = null;
        }
      }

      const recentlyWithinBand =
        lastWithinBandAt.current !== null &&
        now - lastWithinBandAt.current < 140;

      if (!withinX && recentlyWithinBand) {
        return;
      }

      if (!withinX && !menuVisible && !dwelling) {
        if (typeof window !== "undefined") {
          const log =
            ((window as any).__scopeBandLog as
              | Array<{ x: number; min: number; max: number; t: number }>
              | undefined) ?? [];
          const timestamp =
            typeof performance !== "undefined" && performance.now
              ? performance.now()
              : Date.now();
          (window as any).__scopeBandLog = [
            ...log,
            {
              x: event.clientX,
              min: anchorAbsX - bandHalf,
              max: anchorAbsX + bandHalf,
              t: timestamp,
            },
          ];
        }
        setMenuHover(false);
        setHoverOffset(null);
        setHoverAnchor(null);
        safeSetPointerPosition(null);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousemove", onPointerMove);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
      if (pendingBandClear.current) {
        clearTimeout(pendingBandClear.current);
        pendingBandClear.current = null;
      }
    };
  }, [
    dwelling,
    hoverAnchor?.x,
    hoverOffset,
    hoverSegmentLength,
    menuHover,
    menuVisible,
    outlineInset,
    setHoverAnchor,
    setHoverOffset,
    setMenuHover,
    safeSetPointerPosition,
    size.width,
  ]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent | MouseEvent) => {
      if (menuVisible || menuHover || dwelling) return;

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const margin = 48;
      const outside =
        event.clientX < rect.left - margin ||
        event.clientX > rect.right + margin ||
        event.clientY < rect.top - margin ||
        event.clientY > rect.bottom + margin;
      if (outside) {
        safeSetPointerPosition(null);
        setHoverOffset(null);
        setHoverAnchor(null);
        setMenuHover(false);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousemove", onPointerMove);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
    };
  }, [
    dwelling,
    menuHover,
    menuVisible,
    setHoverAnchor,
    setHoverOffset,
    setMenuHover,
    safeSetPointerPosition,
  ]);

  useEffect(() => {
    if (!flowDragging) return;

    setFocused(false);
    setOutlineLocked(false);
    setHoverOffset(null);
    setHoverAnchor(null);
    safeSetPointerPosition(null);
    setMenuHover(false);
    inputRef.current?.blur();
  }, [
    flowDragging,
    setFocused,
    setHoverAnchor,
    setHoverOffset,
    setMenuHover,
    setOutlineLocked,
    safeSetPointerPosition,
  ]);

  return {
    containerRef,
    focusOrigin,
    focused,
    handleBlur,
    handleFocus,
    handlePointerLeave,
    handlePointerMove,
    hoverOffset,
    hoverPathRef,
    inputRef,
    outlineLocked,
    perimeter,
    size,
    triggerReplay,
    setValue,
    value,
  };
}
