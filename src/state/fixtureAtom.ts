import { atom } from "jotai";
import { fixtureRegistry } from "@/graph/fixtures";

export type FixtureKey = keyof typeof fixtureRegistry;

export const selectedFixtureAtom = atom<FixtureKey | null>(null);
