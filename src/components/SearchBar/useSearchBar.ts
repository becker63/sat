import { useEffect, useRef, type PointerEvent } from "react";
import { useAtom, useAtomValue } from "jotai";

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
  scopeMenuVisibleAtom,
  flowDraggingAtom,
} from "@/state/searchbar";

const MENU_HOLD_MARGIN = 24;
const MENU_HORIZONTAL_MARGIN = 12;

type UseSearchBarOptions = {
  outlineInset: number;
  hoverSegmentLength: number;
  outlineLockDelay?: number;
  onReplay?: (query?: string) => void;
};

export function useSearchBar({
  outlineInset,
  hoverSegmentLength,
  outlineLockDelay = 300,
  onReplay,
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
  const [menuVisible, setMenuVisible] = useAtom(scopeMenuVisibleAtom);
  const flowDragging = useAtomValue(flowDraggingAtom);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoverPathRef = useRef<SVGRectElement>(null);
  const lockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (lockTimer.current) clearTimeout(lockTimer.current);
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
  }, [outlineInset, setSize]);

  useEffect(() => {
    const path = hoverPathRef.current;
    if (!path) return;

    setPerimeter(path.getTotalLength());
  }, [setPerimeter, size]);

  const triggerReplay = () => {
    if (!onReplay) return;

    onReplay(value);
    setValue("");

    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  const handlePointerMove = ({
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
    const anchorAbsX =
      hoverAnchor?.x ?? containerRect.left + contentWidth / 2;
    const horizontalBandHalf = menuWidth / 2 + MENU_HORIZONTAL_MARGIN;
    const pointerWithinBand =
      clientX >= anchorAbsX - horizontalBandHalf &&
      clientX <= anchorAbsX + horizontalBandHalf;

    const menuDeactivated = menuVisible && !pointerWithinBand;

    if (menuDeactivated) {
      setMenuHover(false);
      setMenuVisible(false);
      setHoverOffset(null);
      setHoverAnchor(null);
      setPointerPosition(null);
      return;
    }

    if (menuVisible && pointerWithinBand) {
      return;
    }
    setPointerPosition({
      x: clientX - containerRect.left,
      y: clientY - containerRect.top,
    });

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
    if (point && !menuDeactivated) {
      const anchorX = containerRect.left + point.x;
      const anchorY = containerRect.top + point.y;
      setHoverAnchor({
        x: anchorX,
        y: anchorY,
      });
    }
  };

  const handlePointerLeave = () => {
    if (flowDragging) return;

    const container = containerRef.current;
    const containerRect = container?.getBoundingClientRect();

    if (menuVisible) {
      const contentWidth = Math.max(0, size.width - outlineInset * 2);
      const menuWidth =
        Math.min(Math.max(0, hoverSegmentLength), contentWidth) || contentWidth;
      const anchorAbsX =
        hoverAnchor?.x ??
        (containerRect ? containerRect.left + contentWidth / 2 : 0);
      const horizontalBandHalf = menuWidth / 2 + MENU_HORIZONTAL_MARGIN;
      const anchorLocalX = containerRect
        ? anchorAbsX - containerRect.left
        : anchorAbsX;

      const outsideBand =
        pointerPosition === null ||
        pointerPosition.x < anchorLocalX - horizontalBandHalf ||
        pointerPosition.x > anchorLocalX + horizontalBandHalf;

      if (outsideBand) {
        setMenuHover(false);
        setMenuVisible(false);
        setHoverOffset(null);
        setPointerPosition(null);
        return;
      }
    }

    const nearBottom =
      pointerPosition !== null &&
      pointerPosition.y >= size.height - outlineInset - MENU_HOLD_MARGIN;

    if (!focused && !menuHover && !nearBottom) {
      setHoverOffset(null);
      setPointerPosition(null);
    }
  };

  const handleFocus = () => {
    if (flowDragging) return;

    setFocused(true);
    setOutlineLocked(false);
    setMenuHover(false);
    setMenuVisible(false);

    const origin =
      hoverOffset !== null && perimeter > 0 ? hoverOffset / perimeter : 0;

    setFocusOrigin(origin);
    setHoverOffset(null);
    setPointerPosition(null);

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
    setPointerPosition(null);
    setMenuHover(false);
    setMenuVisible(false);

    if (lockTimer.current) clearTimeout(lockTimer.current);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      setFocused(false);
      setOutlineLocked(false);
      setHoverOffset(null);
      setHoverAnchor(null);
      setPointerPosition(null);
      setMenuHover(false);

      if (lockTimer.current) clearTimeout(lockTimer.current);
    };

    window.addEventListener("blur", handleWindowBlur);

    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [setFocused, setHoverOffset, setOutlineLocked]);

  useEffect(() => {
    if (!menuVisible) return;

    const onPointerMove = (event: PointerEvent | MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const contentWidth = Math.max(0, size.width - outlineInset * 2);
      const menuWidth =
        Math.min(Math.max(0, hoverSegmentLength), contentWidth) || contentWidth;
      const anchorAbsX =
        hoverAnchor?.x ?? rect.left + contentWidth / 2;
      const bandHalf = menuWidth / 2 + MENU_HORIZONTAL_MARGIN;

      const withinX =
        event.clientX >= anchorAbsX - bandHalf &&
        event.clientX <= anchorAbsX + bandHalf;

      if (!withinX) {
        setMenuHover(false);
        setMenuVisible(false);
        setHoverOffset(null);
        setHoverAnchor(null);
        setPointerPosition(null);
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("mousemove", onPointerMove);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("mousemove", onPointerMove);
    };
  }, [
    hoverAnchor?.x,
    hoverSegmentLength,
    menuVisible,
    outlineInset,
    setHoverAnchor,
    setHoverOffset,
    setMenuHover,
    setMenuVisible,
    setPointerPosition,
    size.width,
  ]);

  useEffect(() => {
    if (!flowDragging) return;

    setFocused(false);
    setOutlineLocked(false);
    setHoverOffset(null);
    setHoverAnchor(null);
    setPointerPosition(null);
    setMenuHover(false);
    setMenuVisible(false);
    inputRef.current?.blur();
  }, [
    flowDragging,
    setFocused,
    setHoverAnchor,
    setHoverOffset,
    setMenuHover,
    setMenuVisible,
    setOutlineLocked,
    setPointerPosition,
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
    size,
    triggerReplay,
    setValue,
    value,
  };
}
