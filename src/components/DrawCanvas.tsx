"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { Stage, Layer, Line, Circle, Rect } from "react-konva";
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

    // Resize handling
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
      return () => window.removeEventListener("resize", updateSize);
    }, []);

    // Expose methods
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

    // Recognize shapes
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

    const getPointerPos = (): Point | null =>
      (stageRef.current?.getPointerPosition() as Point) || null;

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

    // Event handlers
    const handleMouseDown = (e: any) => {
      e.evt.preventDefault();
      const pos = getPointerPos();
      if (pos) beginStroke(pos);
    };
    const handleMouseMove = (e: any) => {
      e.evt.preventDefault();
      const pos = getPointerPos();
      if (pos) extendStroke(pos);
    };
    const handleMouseUp = () => endStroke();
    const handleMouseLeave = () => endStroke();
    const handleTouchStart = (e: any) =>
      handleMouseDown({ evt: e.evt.touches[0] });
    const handleTouchMove = (e: any) =>
      handleMouseMove({ evt: e.evt.touches[0] });
    const handleTouchEnd = () => endStroke();

    const renderRecognizedShapes = () =>
      recognizedShapes.map((shape, index) => {
        switch (shape.type) {
          case "circle":
            if (!shape.properties?.center || !shape.properties?.radius)
              return null;
            return (
              <Circle
                key={index}
                x={shape.properties.center.x}
                y={shape.properties.center.y}
                radius={shape.properties.radius}
                stroke={shape.color}
                strokeWidth={2}
                dash={[5, 5]}
                opacity={0.7}
              />
            );
          case "rectangle":
            if (!shape.boundingBox) return null;
            return (
              <Rect
                key={index}
                x={shape.boundingBox.x}
                y={shape.boundingBox.y}
                width={shape.boundingBox.width}
                height={shape.boundingBox.height}
                stroke={shape.color}
                strokeWidth={2}
                dash={[5, 5]}
                opacity={0.7}
              />
            );
          case "triangle":
          case "polygon":
          case "line":
            return (
              <Line
                key={index}
                points={shape.points.flatMap((p) => [p.x, p.y])}
                stroke={shape.color}
                strokeWidth={2}
                closed={shape.type !== "line"}
                dash={[5, 5]}
                opacity={0.7}
              />
            );
          default:
            return null;
        }
      });

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
              {strokes.map((stroke, i) => (
                <Line
                  key={i}
                  points={stroke.points.flatMap((p) => [p.x, p.y])}
                  stroke={stroke.color}
                  strokeWidth={stroke.strokeWidth}
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
                  globalCompositeOperation="source-over"
                />
              )}
              {showRecognizedShapes && renderRecognizedShapes()}
            </Layer>
          </Stage>
        )}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow text-sm flex items-center">
          <span className="mr-2">
            {tool === "pen" ? "✏️" : tool === "eraser" ? "🧹" : "📐"}
          </span>
          <span>
            {tool === "pen"
              ? "Drawing"
              : tool === "eraser"
              ? "Erasing"
              : "Shape"}
          </span>
        </div>
      </div>
    );
  }
);

DrawCanvas.displayName = "DrawCanvas";
export default DrawCanvas;
