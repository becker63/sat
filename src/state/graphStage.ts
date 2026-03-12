import { atom } from "jotai";
import type { Edge, Node } from "@xyflow/react";

export const graphInitialNodesAtom = atom<Node[]>([]);

export const graphInitialEdgesAtom = atom<Edge[]>([]);
