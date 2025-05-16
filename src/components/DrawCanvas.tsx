"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { Stage, Layer, Line } from "react-konva";

export type Point = { x: number; y: number };

export interface DrawCanvasHandle {
  getStrokes(): Point[][];
  exportImage(pixelRatio?: number): string;
}

interface DrawCanvasProps {
  color: string;
  strokeWidth: number;
}

const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  ({ color, strokeWidth }, ref) => {
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [strokes, setStrokes] = useState<Point[][]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

    // Update stage size on mount and resize
    useEffect(() => {
      const updateSize = () => {
        if (containerRef.current) {
          setStageSize({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };

      updateSize();
      window.addEventListener("resize", updateSize);

      return () => {
        window.removeEventListener("resize", updateSize);
      };
    }, []);

    useImperativeHandle(ref, () => ({
      getStrokes: () => strokes,
      exportImage: (pixelRatio = 1) =>
        stageRef.current?.toDataURL({ pixelRatio }) || "",
    }));

    const handleMouseDown = () => {
      const pos = stageRef.current.getPointerPosition();
      if (pos) setCurrentStroke([{ x: pos.x, y: pos.y }]);
    };

    const handleMouseMove = () => {
      if (!currentStroke) return;
      const pos = stageRef.current.getPointerPosition();
      if (pos) setCurrentStroke([...currentStroke, { x: pos.x, y: pos.y }]);
    };

    const handleMouseUp = () => {
      if (currentStroke) {
        setStrokes([...strokes, currentStroke]);
        setCurrentStroke(null);
      }
    };

    return (
      <div ref={containerRef} className="w-full h-full">
        {stageSize.width > 0 && (
          <Stage
            width={stageSize.width}
            height={stageSize.height}
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
                  stroke={color}
                  strokeWidth={strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              ))}
              {currentStroke && (
                <Line
                  points={currentStroke.flatMap((p) => [p.x, p.y])}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                />
              )}
            </Layer>
          </Stage>
        )}
      </div>
    );
  }
);

DrawCanvas.displayName = "DrawCanvas";
export default DrawCan;
