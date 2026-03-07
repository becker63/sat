import "@testing-library/jest-dom/vitest";

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  // ReactFlow expects ResizeObserver to exist; the mock keeps the DOM lightweight for unit tests.
  globalThis.ResizeObserver = ResizeObserver;
}
