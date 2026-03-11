import { quadtree } from "d3-quadtree";

import type { SimNode } from "./types";

export function collide() {
  let nodes: SimNode[] = [];

  const force = (alpha: number) => {
    const tree = quadtree(
      nodes,
      (d) => d.x,
      (d) => d.y,
    );

    for (const node of nodes) {
      const radius = (node.measured?.width ?? node.width ?? 0) / 2;
      const nx1 = node.x - radius;
      const nx2 = node.x + radius;
      const ny1 = node.y - radius;
      const ny2 = node.y + radius;

      tree.visit((quad, x1, y1, x2, y2) => {
        if (!("length" in quad)) {
          let q: any = quad;
          do {
            const data = q.data as SimNode | undefined;
            if (data && data !== node) {
              const otherRadius = (data.measured?.width ?? data.width ?? 0) / 2;
              const r = radius + otherRadius;
              let x = node.x - data.x;
              let y = node.y - data.y;
              let l = Math.hypot(x, y);

              if (l < r && l !== 0) {
                l = ((l - r) / l) * alpha;
                node.x -= x *= l;
                node.y -= y *= l;
                data.x += x;
                data.y += y;
              }
            }
          } while ((q = q.next));
        }

        return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
      });
    }
  };

  force.initialize = (newNodes: SimNode[]) => {
    nodes = newNodes;
  };

  return force;
}
