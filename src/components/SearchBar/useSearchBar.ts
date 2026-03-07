import { useEffect, useRef, type PointerEvent } from "react";
import { useAtom } from "jotai";

import { findClosestPerimeterLength } from "@/components/SearchBar/perimeter";
import {
  focusOriginAtom,
  hoverOffsetAtom,
  outlineLockedAtom,
  perimeterAtom,
  queryAtom,
  searchBarSizeAtom,
  searchFocusedAtom,
} from "@/state/searchbar";

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
  const [hoverOffset, setHoverOffset] = useAtom(hoverOffsetAtom);
  const [focusOrigin, setFocusOrigin] = useAtom(focusOriginAtom);
  const [perimeter, setPerimeter] = useAtom(perimeterAtom);

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
    if (focused) return;

    const result = findClosestPerimeterLength({
      container: containerRef.current,
      path: hoverPathRef.current,
      clientX,
      clientY,
      inset: outlineInset,
    });
    if (!result) return;

    const { bestLength, total } = result;
    if (!Number.isFinite(total) || total <= 0) return;

    const centered = bestLength - hoverSegmentLength / 2;
    const normalized = ((centered % total) + total) % total;

    setHoverOffset(normalized);
  };

  const handlePointerLeave = () => {
    if (!focused) setHoverOffset(null);
  };

  const handleFocus = () => {
    setFocused(true);
    setOutlineLocked(false);

    const origin =
      hoverOffset !== null && perimeter > 0 ? hoverOffset / perimeter : 0;

    setFocusOrigin(origin);

    if (lockTimer.current) clearTimeout(lockTimer.current);

    lockTimer.current = setTimeout(() => {
      setOutlineLocked(true);
    }, outlineLockDelay);
  };

  const handleBlur = () => {
    setFocused(false);
    setOutlineLocked(false);
    setHoverOffset(null);

    if (lockTimer.current) clearTimeout(lockTimer.current);
  };

  useEffect(() => {
    const handleWindowBlur = () => {
      setFocused(false);
      setOutlineLocked(false);
      setHoverOffset(null);

      if (lockTimer.current) clearTimeout(lockTimer.current);
    };

    window.addEventListener("blur", handleWindowBlur);

    return () => window.removeEventListener("blur", handleWindowBlur);
  }, [setFocused, setHoverOffset, setOutlineLocked]);

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
