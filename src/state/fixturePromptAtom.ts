import { atom } from "jotai";
import { selectedFixtureAtom } from "./fixtureAtom";
import { fixtureRegistry } from "@/graph/fixtures";

export const fixturePromptAtom = atom((get) => {
  const key = get(selectedFixtureAtom);

  if (!key) return "";

  return fixtureRegistry[key].prompt;
});
