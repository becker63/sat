type Point = { x: number; y: number };

type Segment = { start: Point; end: Point; length: number };

type ClosestLengthInput = {
  container: HTMLElement | null;
  path: SVGRectElement | null;
  clientX: number;
  clientY: number;
  inset: number;
};

const toPoint = (x: number, y: number): Point => ({ x, y });

const segmentLength = (segment: Segment) => segment.length;

const makeSegments = (width: number, height: number): Segment[] => {
  const p1 = toPoint(0, 0);
  const p2 = toPoint(width, 0);
  const p3 = toPoint(width, height);
  const p4 = toPoint(0, height);

  const build = (start: Point, end: Point): Segment => ({
    start,
    end,
    length: Math.hypot(end.x - start.x, end.y - start.y),
  });

  return [build(p1, p2), build(p2, p3), build(p3, p4), build(p4, p1)];
};

const closestOnSegment = (point: Point, segment: Segment) => {
  const vx = segment.end.x - segment.start.x;
  const vy = segment.end.y - segment.start.y;
  const wx = point.x - segment.start.x;
  const wy = point.y - segment.start.y;

  const segLenSq = vx * vx + vy * vy;
  if (segLenSq === 0) return { closest: segment.start, distanceSq: 0, t: 0 };

  const t = Math.max(0, Math.min(1, (wx * vx + wy * vy) / segLenSq));
  const closest = toPoint(segment.start.x + vx * t, segment.start.y + vy * t);
  const dx = point.x - closest.x;
  const dy = point.y - closest.y;

  return { closest, distanceSq: dx * dx + dy * dy, t };
};

export function findClosestPerimeterLength({
  container,
  path,
  clientX,
  clientY,
  inset,
}: ClosestLengthInput) {
  if (!container || !path) return null;

  const containerRect = container.getBoundingClientRect();
  const svgX = clientX - containerRect.left + inset;
  const svgY = clientY - containerRect.top + inset;

  const originX = path.x?.baseVal?.value ?? 0;
  const originY = path.y?.baseVal?.value ?? 0;
  const width = path.width?.baseVal?.value ?? 0;
  const height = path.height?.baseVal?.value ?? 0;

  if (width <= 0 || height <= 0) return null;

  const pointer = toPoint(svgX - originX, svgY - originY);
  const segments = makeSegments(width, height);
  const perimeterSimple = segments.reduce(
    (total, segment) => total + segmentLength(segment),
    0,
  );

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestLengthSimple = 0;
  let traversed = 0;

  for (const segment of segments) {
    const { distanceSq, t } = closestOnSegment(pointer, segment);
    if (distanceSq < bestDistance) {
      bestDistance = distanceSq;
      bestLengthSimple = traversed + segment.length * t;
    }
    traversed += segment.length;
  }

  const total =
    typeof path.getTotalLength === "function"
      ? path.getTotalLength()
      : perimeterSimple;

  if (!Number.isFinite(total) || total <= 0) return null;

  const scaledLength =
    perimeterSimple > 0 ? (bestLengthSimple / perimeterSimple) * total : 0;

  return { bestLength: scaledLength, total };
}
