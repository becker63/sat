import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef } from "react";

import {
  hoverOffsetAtom,
  hoverAnchorAtom,
  pointerPositionAtom,
  searchBarSizeAtom,
  searchBarPositionAtom,
  scopeMenuHoverAtom,
  flowDraggingAtom,
} from "@/state/searchbar";
import { SearchScopeEngine, type ScopeEngineSnapshot } from "@/state/searchScopeEngine";

type Options = {
  outlineInset: number;
  segmentLength?: number;
};

export type SearchScopeMenuState = Pick<
  ScopeEngineSnapshot,
  "visible" | "width" | "offsetLeft" | "offsetTop" | "dwelling"
>;

export function useSearchScopeMenu({
  outlineInset,
  segmentLength,
}: Options): SearchScopeMenuState {
  const hoverOffset = useAtomValue(hoverOffsetAtom);
  const pointer = useAtomValue(pointerPositionAtom);
  const size = useAtomValue(searchBarSizeAtom);
  const anchor = useAtomValue(hoverAnchorAtom);
  const menuHover = useAtomValue(scopeMenuHoverAtom);
  const position = useAtomValue(searchBarPositionAtom);
  const flowDragging = useAtomValue(flowDraggingAtom);

  const engineRef = useRef<SearchScopeEngine | null>(null);

  if (engineRef.current === null) {
    engineRef.current = new SearchScopeEngine();
  }

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
    };
  }, []);

  const snapshot = useMemo(() => {
    const engine = engineRef.current;
    const pointerAbs =
      pointer === null
        ? null
        : {
            x: position.left + pointer.x,
            y: position.top + pointer.y,
          };

    const contentWidth = Math.max(0, size.width - outlineInset * 2);
    const anchorAbsX =
      anchor?.x ??
      (pointer ? position.left + pointer.x : position.left + contentWidth / 2);
    const anchorLocalX = anchorAbsX - position.left;

    const now =
      typeof performance !== "undefined" && performance.now
        ? performance.now()
        : Date.now();

    return engine
      ? engine.update({
          pointer,
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
          menuShown: false,
        })
      : {
          visible: false,
          width: 0,
          offsetLeft: 0,
          offsetTop: 0,
          exitTriggered: false,
          pointerWithinBand: false,
          pointerAbove: false,
          dwelling: false,
        };
  }, [
    anchor?.x,
    flowDragging,
    hoverOffset,
    menuHover,
    outlineInset,
    pointer,
    position,
    segmentLength,
    size,
  ]);

  return {
    visible: snapshot.visible,
    width: snapshot.width,
    offsetLeft: snapshot.offsetLeft,
    offsetTop: snapshot.offsetTop,
    dwelling: snapshot.dwelling,
  };
}
