import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

import {
  hoverOffsetAtom,
  hoverAnchorAtom,
  pointerPositionAtom,
  searchBarSizeAtom,
  searchBarPositionAtom,
  perimeterAtom,
  scopeMenuHoverAtom,
  scopeMenuVisibleAtom,
  scopeDwellingAtom,
  flowDraggingAtom,
} from "@/state/searchbar";
import { SearchScopeEngine } from "@/state/searchScopeEngine";

type Options = {
  outlineInset: number;
  segmentLength?: number;
};

export function useSearchScopeMenu({
  outlineInset,
  segmentLength,
}: Options) {
  const hoverOffset = useAtomValue(hoverOffsetAtom);
  const setHoverOffset = useSetAtom(hoverOffsetAtom);
  const setHoverAnchor = useSetAtom(hoverAnchorAtom);
  const setPointerPosition = useSetAtom(pointerPositionAtom);
  const pointer = useAtomValue(pointerPositionAtom);
  const size = useAtomValue(searchBarSizeAtom);
  const anchor = useAtomValue(hoverAnchorAtom);
  const menuHover = useAtomValue(scopeMenuHoverAtom);
  const position = useAtomValue(searchBarPositionAtom);
  const [menuVisible, setMenuVisible] = useAtom(scopeMenuVisibleAtom);
  const setDwelling = useSetAtom(scopeDwellingAtom);
  const perimeter = useAtomValue(perimeterAtom);
  const flowDragging = useAtomValue(flowDraggingAtom);
  const fixedLeftRef = useRef<number | null>(null);
  const globalPointerRef = useRef<{ x: number; y: number } | null>(null);
  const [tick, setTick] = useState(0);
  const engineRef = useRef<SearchScopeEngine | null>(null);

  const contentWidth = Math.max(0, size.width - outlineInset * 2);

  const anchorAbsX =
    anchor?.x ??
    (pointer
      ? position.left + pointer.x
      : position.left + contentWidth / 2);
  const anchorLocalX = anchorAbsX - position.left;

  void tick;
  const pointerAbs =
    globalPointerRef.current ??
    (pointer === null
      ? null
      : {
          x: position.left + pointer.x,
          y: position.top + pointer.y,
        });

  const pointerLocal =
    pointerAbs != null
      ? {
          x: pointerAbs.x - position.left,
          y: pointerAbs.y - position.top,
        }
      : pointer;

  const now =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : Date.now();

  if (engineRef.current === null) {
    engineRef.current = new SearchScopeEngine();
  }

  const engine = engineRef.current;

  useEffect(() => {
    const handler = (event: MouseEvent | PointerEvent) => {
      globalPointerRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("pointermove", handler, { passive: true });
    window.addEventListener("mousemove", handler, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handler);
      window.removeEventListener("mousemove", handler);
    };
  }, []);

  useEffect(
    () => () => {
      engine.stop();
    },
    [engine],
  );

  const snapshot = engine.update({
    pointer: pointerLocal,
    pointerAbs,
    anchorLocalX,
    anchorAbsX,
    position,
    size,
    outlineInset,
    segmentLength,
    menuHover,
    hoverEngaged: hoverOffset !== null,
    flowDragging,
    now,
    menuShown: menuVisible,
  });

  useEffect(() => {
    if (!menuVisible && !snapshot.visible && hoverOffset === null) return;
    const id = setInterval(() => setTick((t) => t + 1), 80);
    return () => clearInterval(id);
  }, [menuVisible, snapshot.visible, hoverOffset]);

  useEffect(() => {
    setDwelling(snapshot.dwelling);
  }, [setDwelling, snapshot.dwelling]);

  useEffect(() => {
    setMenuVisible(snapshot.visible);
    if (!snapshot.visible && snapshot.exitTriggered) {
      setHoverOffset(null);
      setHoverAnchor(null);
      setPointerPosition(null);
      fixedLeftRef.current = null;
    }
  }, [
    setMenuVisible,
    setHoverOffset,
    setHoverAnchor,
    setPointerPosition,
    snapshot.visible,
    snapshot.exitTriggered,
  ]);

  useEffect(() => {
    if (snapshot.visible && fixedLeftRef.current === null) {
      fixedLeftRef.current = snapshot.offsetLeft;
    }
    if (!snapshot.visible) {
      fixedLeftRef.current = null;
    }
  }, [snapshot.visible, snapshot.offsetLeft]);

  const hasCenteredRef = useRef(false);
  useEffect(() => {
    if (snapshot.visible && perimeter > 0 && segmentLength && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      const menuLeft = fixedLeftRef.current ?? snapshot.offsetLeft;
      const menuCenterAbs = menuLeft + snapshot.width / 2;
      const menuCenterLocal = menuCenterAbs - position.left + outlineInset;

      const svgW = size.width - 1;
      const svgH = size.height - 1;
      const simplePerimeter = 2 * svgW + 2 * svgH;
      const bottomEdgeFraction = (svgW + svgH + (svgW - menuCenterLocal)) / simplePerimeter;
      const centerPerimeterPos = bottomEdgeFraction * perimeter;
      const wrapped = ((centerPerimeterPos % perimeter) + perimeter) % perimeter;
      setHoverOffset(wrapped);
    }
    if (!snapshot.visible) {
      hasCenteredRef.current = false;
    }
  }, [snapshot.visible, perimeter, segmentLength, snapshot.width, snapshot.offsetLeft, position.left, outlineInset, size.width, size.height, setHoverOffset]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing =
      ((window as any).__scopeVisibleLog as
        | Array<{
            t: number;
            visible: boolean;
            hoverOffset: number | null;
            pointer: typeof pointer;
            pointerWithinBand: boolean;
            wantShow: boolean;
            holdWhileInside: boolean;
            hoverEngaged: boolean;
            menuVisibleState: boolean;
          }>
        | undefined) ?? [];
    const timestamp =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();
    (window as any).__scopeVisibleLog = [
      ...existing,
      {
        t: timestamp,
        visible: snapshot.visible,
        hoverOffset,
        pointer,
        pointerWithinBand: snapshot.pointerWithinBand,
        wantShow: snapshot.visible,
        holdWhileInside: snapshot.visible,
        hoverEngaged: hoverOffset !== null,
        menuVisibleState: menuVisible,
      },
    ];
  }, [hoverOffset, menuVisible, pointer, snapshot.pointerWithinBand, snapshot.visible]);

  return {
    visible: snapshot.visible,
    width: snapshot.width,
    offsetLeft: snapshot.offsetLeft,
    offsetTop: snapshot.offsetTop,
  };
}
