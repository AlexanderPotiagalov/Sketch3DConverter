"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  Ref,
} from "react";
import { Stage, Layer, Line } from "react-konva";

export type Point = { x: number; y: number };

export interface DrawCanvasHandle {
  getStrokes(): Point[][];
  exportImage(pixelRatio?: number): string;
}

// 1) Define an (empty) props interface
interface DrawCanvasProps {}

// 2) Add that as the second generic to forwardRef:
const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  (props, ref) => {
    const stageRef = useRef<any>(null);
    const [strokes, setStrokes] = useState<Point[][]>([]);
    const [current, setCurrent] = useState<Point[] | null>(null);

    useImperativeHandle(ref, () => ({
      getStrokes: () => strokes,
      exportImage: (pixelRatio = 1) =>
        stageRef.current?.toDataURL({ pixelRatio }) || "",
    }));

    const handleMouseDown = () => {
      const pos = stageRef.current.getPointerPosition();
      if (pos) setCurrent([{ x: pos.x, y: pos.y }]);
    };
    const handleMouseMove = () => {
      if (!current) return;
      const pos = stageRef.current.getPointerPosition();
      if (pos) setCurrent([...current, { x: pos.x, y: pos.y }]);
    };
    const handleMouseUp = () => {
      if (current) {
        setStrokes([...strokes, current]);
        setCurrent(null);
      }
    };

    return (
      <Stage
        width={window.innerWidth * 0.5}
        height={window.innerHeight}
        style={{ background: "#fff" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        ref={stageRef}
      >
        <Layer>
          {strokes.map((stroke, i) => (
            <Line
              key={i}
              points={stroke.flatMap((p) => [p.x, p.y])}
              stroke="black"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          ))}
          {current && (
            <Line
              points={current.flatMap((p) => [p.x, p.y])}
              stroke="black"
              strokeWidth={2}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
            />
          )}
        </Layer>
      </Stage>
    );
  }
);

// 3) Add a displayName for nicer React DevTools
DrawCanvas.displayName = "DrawCanvas";

export default DrawCanvas;
