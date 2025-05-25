// components/DrawCanvas.tsx
"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { Stage, Layer, Line } from "react-konva";
import { RecognizedShape } from "@/utils/ShapeRecognizer";

export type Point = { x: number; y: number };

export interface Stroke {
  points: Point[];
  color: string;
  strokeWidth: number;
}

export interface DrawCanvasHandle {
  exportImage(pixelRatio?: number): string;
  clearCanvas(): void;
  getStrokes(): Stroke[];
  getRecognizedShapes(): RecognizedShape[];
}

interface DrawCanvasProps {
  color: string;
  strokeWidth: number;
  tool?: "pen" | "eraser" | "shape";
  showRecognizedShapes?: boolean;
  onStrokesChange?: (strokes: Stroke[]) => void;
  onShapesRecognized?: (shapes: RecognizedShape[]) => void;
}

const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  (
    {
      color,
      strokeWidth,
      tool = "pen",
      showRecognizedShapes = true,
      onStrokesChange,
      onShapesRecognized,
    },
    ref
  ) => {
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const [isDrawing, setIsDrawing] = useState(false);
    const [recognizedShapes, setRecognizedShapes] = useState<RecognizedShape[]>(
      []
    );

    // Resize handling unchanged…

    useImperativeHandle(
      ref,
      () => ({
        exportImage: (pixelRatio = 2) =>
          stageRef.current?.toDataURL({ pixelRatio }) || "",
        clearCanvas: () => {
          setStrokes([]);
          setRecognizedShapes([]);
          onStrokesChange?.([]);
          onShapesRecognized?.([]);
        },
        getStrokes: () => strokes,
        getRecognizedShapes: () => recognizedShapes,
      }),
      [strokes, recognizedShapes, onStrokesChange, onShapesRecognized]
    );

    // Recognize shapes on strokes change
    useEffect(() => {
      import("@/utils/ShapeRecognizer").then(({ recognizeShapes }) => {
        if (strokes.length > 0) {
          const shapes = recognizeShapes(strokes);
          setRecognizedShapes(shapes);
          onShapesRecognized?.(shapes);
        } else {
          setRecognizedShapes([]);
          onShapesRecognized?.([]);
        }
      });
    }, [strokes, onShapesRecognized]);

    const beginStroke = (pos: Point) => {
      setIsDrawing(true);
      if (tool === "eraser") {
        const thresh = strokeWidth * 2;
        const next = strokes.filter(
          (s) =>
            !s.points.some((p) => Math.hypot(p.x - pos.x, p.y - pos.y) < thresh)
        );
        setStrokes(next);
        onStrokesChange?.(next);
      } else {
        setCurrentStroke({ points: [pos], color, strokeWidth });
      }
    };

    const extendStroke = (pos: Point) => {
      if (!isDrawing) return;
      if (tool === "eraser") {
        const thresh = strokeWidth * 2;
        const next = strokes.filter(
          (s) =>
            !s.points.some((p) => Math.hypot(p.x - pos.x, p.y - pos.y) < thresh)
        );
        setStrokes(next);
        onStrokesChange?.(next);
      } else if (currentStroke) {
        setCurrentStroke({
          ...currentStroke,
          points: [...currentStroke.points, pos],
        });
      }
    };

    const endStroke = () => {
      setIsDrawing(false);
      if (currentStroke && currentStroke.points.length > 1) {
        const next = [...strokes, currentStroke];
        setStrokes(next);
        onStrokesChange?.(next);
      }
      setCurrentStroke(null);
    };

    const handleMouseDown = (e: any) => {
      e.evt.preventDefault();
      const pos = stageRef.current.getPointerPosition();
      if (pos) beginStroke({ x: pos.x, y: pos.y });
    };
    const handleMouseMove = (e: any) => {
      e.evt.preventDefault();
      if (!isDrawing) return;
      const pos = stageRef.current.getPointerPosition();
      if (pos) extendStroke({ x: pos.x, y: pos.y });
    };
    const handleMouseUp = () => endStroke();
    const handleMouseLeave = () => endStroke();
    const handleTouchStart = (e: any) =>
      handleMouseDown({ evt: e.evt.touches[0] });
    const handleTouchMove = (e: any) =>
      handleMouseMove({ evt: e.evt.touches[0] });
    const handleTouchEnd = () => endStroke();

    return (
      <div ref={containerRef} className="w-full h-full relative">
        {stageSize.width > 0 && (
          <Stage
            ref={stageRef}
            width={stageSize.width}
            height={stageSize.height}
            style={{
              background: "#fff",
              cursor: tool === "eraser" ? "not-allowed" : "crosshair",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Layer>
              {strokes.map((s, i) => (
                <Line
                  key={i}
                  points={s.points.flatMap((p) => [p.x, p.y])}
                  stroke={s.color}
                  strokeWidth={s.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={
                    tool === "eraser" ? "destination-out" : "source-over"
                  }
                />
              ))}
              {currentStroke && (
                <Line
                  points={currentStroke.points.flatMap((p) => [p.x, p.y])}
                  stroke={currentStroke.color}
                  strokeWidth={currentStroke.strokeWidth}
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
export default DrawCanvas;
