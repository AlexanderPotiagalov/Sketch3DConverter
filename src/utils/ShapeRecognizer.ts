import type { Stroke, Point } from "@/components/DrawCanvas";

export interface RecognizedShape {
  type: "circle" | "rectangle" | "triangle" | "polygon" | "line";
  points: Point[];
  color: string;
  originalStrokes: Stroke[];
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  properties?: {
    radius?: number;
    center?: Point;
    length?: number;
    angle?: number;
    width?: number;
    height?: number;
    area?: number;
  };
}

// Helper functions for geometry
function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function pathLength(points: Point[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += distance(points[i - 1], points[i]);
  }
  return length;
}

function getBoundingBox(points: Point[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;
  points.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function getCentroid(points: Point[]): Point {
  const n = points.length;
  if (n === 0) return { x: 0, y: 0 };
  let sumX = 0,
    sumY = 0;
  points.forEach((p) => {
    sumX += p.x;
    sumY += p.y;
  });
  return { x: sumX / n, y: sumY / n };
}

// Calculate how circular a shape is (1.0 is perfect circle)
function calculateCircularity(points: Point[]): number {
  if (points.length < 5) return 0;
  const center = getCentroid(points);
  const distances = points.map((p) => distance(center, p));
  const avg = distances.reduce((s, d) => s + d, 0) / distances.length;
  const variance =
    distances.reduce((s, d) => s + (d - avg) ** 2, 0) / distances.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 1 - stdDev / avg / 0.5);
}

// Calculate how rectangular a shape is
function calculateRectangularity(points: Point[]): number {
  if (points.length < 4) return 0;
  const bbox = getBoundingBox(points);
  const bboxArea = bbox.width * bbox.height;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  area = Math.abs(area) / 2;
  return Math.min(area / bboxArea, bboxArea / area);
}
