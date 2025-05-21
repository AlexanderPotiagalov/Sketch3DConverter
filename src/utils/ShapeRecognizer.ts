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
