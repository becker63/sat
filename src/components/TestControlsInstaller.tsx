"use client";

import { useEffect } from "react";
import { getDefaultStore } from "jotai";
import { selectedFixtureAtom } from "@/state/fixtureAtom";
import { graphPlayingAtom } from "@/state/graphPlayback";

const isE2E = process.env.NEXT_PUBLIC_E2E === "true";

export function TestControlsInstaller() {
  useEffect(() => {
    if (!isE2E) return;
    if (typeof window === "undefined") return;

    const store = getDefaultStore();

    (window as any).__graphControls = {
      selectFixture: (id: string | null) =>
        store.set(selectedFixtureAtom, id as any),
      setPlaying: (playing: boolean) => store.set(graphPlayingAtom, playing),
    };
  }, []);

  return null;
}
