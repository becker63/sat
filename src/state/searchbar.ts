import { atom } from "jotai";

export type SearchBarSize = { width: number; height: number };

export const queryAtom = atom("");
export const searchFocusedAtom = atom(false);
export const outlineLockedAtom = atom(false);
export const hoverOffsetAtom = atom<number | null>(null);
export const focusOriginAtom = atom(0);
export const searchBarSizeAtom = atom<SearchBarSize>({ width: 0, height: 0 });
export const perimeterAtom = atom(0);
