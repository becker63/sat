import {
  coordGreedy,
  decrossTwoLayer,
  graphConnect,
  layeringLongestPath,
  sugiyama,
  type Graph as DagGraph,
  type GraphNode as DagGraphNode,
  type MutGraphNode as DagMutGraphNode,
  type SugiNode,
} from "d3-dag";

import type { GraphEdge } from "./events";
import type { GraphState } from "./reducer";

export const NODE_WIDTH = 300;
export const NODE_HEIGHT = 140;

const VERTICAL_SPACING = 220;
const HORIZONTAL_SPACING = 340;

type DagNodeDatum = GraphState["nodes"][string] & { discoveryIndex?: number };

function buildDag(
  state: GraphState,
  discoveryIndex: Map<string, number>,
): DagGraph<DagNodeDatum, GraphEdge> {
  const nodeDatumForId = (id: string): DagNodeDatum => ({
    ...state.nodes[id],
    discoveryIndex: discoveryIndex.get(id) ?? Number.MAX_SAFE_INTEGER,
  });

  const builder = graphConnect()
    .sourceId(({ source }: GraphEdge) => source)
    .targetId(({ target }: GraphEdge) => target)
    .nodeDatum(nodeDatumForId);

  const dag = builder(state.edges) as DagGraph<DagNodeDatum, GraphEdge>;
  const dagNodesById = new Map<string, DagGraphNode<DagNodeDatum, GraphEdge>>();

  for (const node of dag.nodes()) {
    dagNodesById.set(node.data.id, node);
  }

  // Ensure isolated nodes are represented in the DAG
  for (const node of Object.values(state.nodes)) {
    if (!dagNodesById.has(node.id)) {
      const dagNode = (dag as any).node({
        ...node,
        discoveryIndex: discoveryIndex.get(node.id) ?? Number.MAX_SAFE_INTEGER,
      }) as DagMutGraphNode<any, GraphEdge>;
      dagNodesById.set(node.id, dagNode);
    }
  }

  return dag;
}

const orderByDiscovery = (discoveryIndex: Map<string, number>) =>
  (
    topLayer: SugiNode<any, GraphEdge>[],
    bottomLayer: SugiNode<any, GraphEdge>[],
    topDown: boolean,
  ) => {
    const layer = topDown ? bottomLayer : topLayer;

    const valueForNode = (node: any): number => {
      if (node.data.role === "node") {
        const id = node.data.node.data.id;
        return discoveryIndex.get(id) ?? node.data.node.data.discoveryIndex ?? 0;
      }

      const sourceId = node.data.link.source.data.id;
      const targetId = node.data.link.target.data.id;
      const source = discoveryIndex.get(sourceId) ?? node.data.link.source.data.discoveryIndex ?? 0;
      const target = discoveryIndex.get(targetId) ?? node.data.link.target.data.discoveryIndex ?? 0;
      return (source + target) / 2;
    };

    layer.sort((a, b) => valueForNode(a) - valueForNode(b));
  };

export async function layoutGraph(state: GraphState): Promise<GraphState> {
  const nodes = Object.values(state.nodes);
  const newNodes = nodes.filter((n) => !n.positioned);

  if (!newNodes.length) return state;

  const discoveryIndex = new Map<string, number>();
  Object.keys(state.nodes).forEach((id, idx) => discoveryIndex.set(id, idx));

  const dag = buildDag(state, discoveryIndex);

  const layout = (sugiyama() as any)
    .layering(
      layeringLongestPath().rank((node: any) =>
        node.data.state === "anchor" ? 0 : undefined,
      ),
    )
    .decross(decrossTwoLayer().order(orderByDiscovery(discoveryIndex)))
    .coord(coordGreedy())
    .nodeSize(() => [NODE_WIDTH, NODE_HEIGHT])
    .gap([HORIZONTAL_SPACING, VERTICAL_SPACING]);

  layout(dag);

  const placed: Record<string, GraphState["nodes"][string]> = { ...state.nodes };
  for (const dagNode of dag.nodes()) {
    const nodeId = dagNode.data.id;
    const existing = placed[nodeId];

    if (!existing) continue;

    const x = existing.positioned ? existing.position.x : dagNode.x;
    const y =
      existing.positioned && existing.state !== "anchor"
        ? existing.position.y
        : existing.state === "anchor"
          ? 0
          : dagNode.y;

    placed[nodeId] = {
      ...existing,
      positioned: true,
      position: { x, y },
    };
  }

  return {
    ...state,
    nodes: placed,
  };
}
