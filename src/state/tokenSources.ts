import { atom } from "jotai";

export type TokenSource = "query" | "anchor" | "closure" | "semantic";

export interface TokenContribution {
  source: TokenSource;
  tokens: number;
}

export const tokenContributionsAtom = atom<TokenContribution[]>([]);
