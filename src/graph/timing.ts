export const GRAPH_TIMING = {
  EVENT_DELAYS: {
    iteration: 700,
    addNodes: 200,
    addEdges: 350,
    updateNode: 250,
    removeNode: 200,
  },

  CAMERA: {
    FOLLOW_PADDING: 120,
    UPWARD_OFFSET: 80,
    PAN_DURATION_MS: 450,
    RAF_SMOOTHING: 0.15,
  },

  EDGE_ANIMATION: {
    DRAW_DURATION_MS: 700,
  },

  NODE_ANIMATION: {
    SPAWN_DURATION_MS: 250,
  },
} as const;
