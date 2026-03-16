import { atom } from "jotai";
import { initialTokenState } from "./tokenReducer";

export const tokenStateAtom = atom(initialTokenState);
