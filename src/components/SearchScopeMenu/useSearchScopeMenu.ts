import { useAtom, useAtomValue } from "jotai";
import { useEffect, useRef } from "react";

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

const TRIGGER_MARGIN = 6;
const HORIZONTAL_MARGIN = 12;

type Options = {
  outlineInset: number;
  segmentLength?: number;
};

export function useSearchScopeMenu({
  outlineInset,
  segmentLength,
}: Options) {
  const hoverOffset = useAtomValue(hoverOffsetAtom);
  const pointer = useAtomValue(pointerPositionAtom);
  const size = useAtomValue(searchBarSizeAtom);
  const anchor = useAtomValue(hoverAnchorAtom);
  const menuHover = useAtomValue(scopeMenuHoverAtom);
  const position = useAtomValue(searchBarPositionAtom);
  const [menuVisible, setMenuVisible] = useAtom(scopeMenuVisibleAtom);
  const flowDragging = useAtomValue(flowDraggingAtom);
  const lastPointerY = useRef<number | null>(null);

  const contentHeight = Math.max(0, size.height - outlineInset * 2);
  const triggerCandidate = contentHeight - outlineInset - 2 + TRIGGER_MARGIN;
  const triggerY = Math.max(
    0,
    Math.min(contentHeight - 2, triggerCandidate),
  );
  const contentWidth = Math.max(0, size.width - outlineInset * 2);

  const anchorAbsX =
    anchor?.x ??
    (pointer
      ? position.left + pointer.x
      : position.left + contentWidth / 2);
  const anchorLocalX = anchorAbsX - position.left;

  const menuWidth =
    Math.min(Math.max(0, segmentLength ?? contentWidth), contentWidth) ||
    contentWidth;
  const horizontalBandHalf = menuWidth / 2 + HORIZONTAL_MARGIN;
  const visible =
    !flowDragging && hoverOffset !== null && (pointer !== null || menuHover);
  const viewportWidth =
    typeof window !== "undefined" && window.innerWidth
      ? window.innerWidth
      : size.width;
  const desiredLeft = anchorAbsX - menuWidth / 2;
  const clampedLeft = Math.max(
    0,
    Math.min(desiredLeft, viewportWidth - menuWidth),
  );
  const top = position.top + size.height - outlineInset + 8;

  useEffect(() => {
    if (menuVisible !== visible) {
      setMenuVisible(visible);
    }
  }, [menuVisible, setMenuVisible, visible]);

  useEffect(() => {
    lastPointerY.current = pointer?.y ?? null;
  }, [pointer?.y]);

  return {
    visible,
    width: menuWidth,
    offsetLeft: clampedLeft,
    offsetTop: top,
  };
}
