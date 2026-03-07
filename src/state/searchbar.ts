import { atom } from "jotai";

export type SearchBarSize = { width: number; height: number };
export type SearchBarPosition = { left: number; top: number };

export const queryAtom = atom("");
export const searchFocusedAtom = atom(false);
export const outlineLockedAtom = atom(false);
export const hoverOffsetAtom = atom<number | null>(null);
export const hoverAnchorAtom = atom<{ x: number; y: number } | null>(null);
export const focusOriginAtom = atom(0);
export const searchBarSizeAtom = atom<SearchBarSize>({ width: 0, height: 0 });
export const searchBarPositionAtom = atom<SearchBarPosition>({ left: 0, top: 0 });
export const perimeterAtom = atom(0);
export const pointerPositionAtom = atom<{ x: number; y: number } | null>(null);
export const scopeMenuHoverAtom = atom(false);
export const scopeMenuVisibleAtom = atom(false);
export const flowDraggingAtom = atom(false);
