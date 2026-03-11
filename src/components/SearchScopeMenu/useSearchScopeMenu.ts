import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";

import {
  hoverOffsetAtom,
  hoverAnchorAtom,
  pointerPositionAtom,
  searchBarSizeAtom,
  searchBarPositionAtom,
  scopeMenuHoverAtom,
  scopeMenuVisibleAtom,
  flowDraggingAtom,
} from "@/state/searchbar";
import { SearchScopeEngine, SHOW_DELAY_MS } from "@/state/searchScopeEngine";

const POINTER_STALE_MS = 260;

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
  const flowDragging = useAtomValue(flowDraggingAtom);
  const fixedLeftRef = useRef<number | null>(null);
  const globalPointerRef = useRef<{ x: number; y: number } | null>(null);
  const engineRef = useRef<SearchScopeEngine | null>(null);
  const prevMenuHoverRef = useRef<boolean>(false);

  const contentWidth = Math.max(0, size.width - outlineInset * 2);

  const anchorAbsX =
    anchor?.x ??
    (pointer
      ? position.left + pointer.x
      : position.left + contentWidth / 2);
  const anchorLocalX = anchorAbsX - position.left;

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

  const [showReady, setShowReady] = useState(false);

  useEffect(() => {
    if (snapshot.visible && !showReady) {
      const timer = setTimeout(() => setShowReady(true), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
    if (!snapshot.visible) {
      setShowReady(false);
    }
  }, [snapshot.visible, showReady]);

  const delayedVisible = snapshot.visible && showReady;

  useEffect(() => {
    setMenuVisible(delayedVisible);
    if (!delayedVisible && snapshot.exitTriggered) {
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
    delayedVisible,
    snapshot.exitTriggered,
  ]);

  useEffect(() => {
    prevMenuHoverRef.current = menuHover;
  }, [menuHover]);

  useEffect(() => {
    if (snapshot.visible && fixedLeftRef.current === null) {
      fixedLeftRef.current = snapshot.offsetLeft;
    }
    if (!snapshot.visible) {
      fixedLeftRef.current = null;
    }
  }, [snapshot.visible, snapshot.offsetLeft]);

  useEffect(() => {
    if (hoverOffset === null) return;
    const timer = setTimeout(() => {
      const current = engineRef.current?.getLastPointerAt() ?? null;
      const stalePointer = current !== null && now - current > POINTER_STALE_MS;
      if (!menuVisible && hoverOffset !== null && (pointer === null || stalePointer)) {
        setHoverOffset(null);
        setMenuVisible(false);
        setPointerPosition(null);
      }
    }, POINTER_STALE_MS);
    return () => clearTimeout(timer);
  }, [hoverOffset, pointer, menuVisible, setHoverOffset, setMenuVisible, setPointerPosition, now]);

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
    visible: delayedVisible,
    width: snapshot.width,
    offsetLeft: snapshot.offsetLeft,
    offsetTop: snapshot.offsetTop,
  };
}
