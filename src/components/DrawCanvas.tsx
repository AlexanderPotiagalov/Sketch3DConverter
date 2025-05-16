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
  clearCanvas(): void;
}

interface DrawCanvasProps {
  color: string;
  strokeWidth: number;
  tool?: string;
}

const DrawCanvas = forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  ({ color, strokeWidth, tool = "pen" }, ref) => {
    const stageRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [strokes, setStrokes] = useState<Point[][]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[] | null>(null);
    const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
    const [isDrawing, setIsDrawing] = useState(false);

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
      exportImage: (pixelRatio = 2) =>
        stageRef.current?.toDataURL({ pixelRatio }) || "",
      clearCanvas: () => {
        setStrokes([]);
      },
    }));

    const handleMouseDown = (e: any) => {
      e.evt.preventDefault();
      setIsDrawing(true);
      const pos = stageRef.current.getPointerPosition();

      if (pos) {
        if (tool === "eraser") {
          const threshold = strokeWidth * 2;
          setStrokes(
            strokes.filter((stroke) => {
              return !stroke.some((point) => {
                const dx = point.x - pos.x;
                const dy = point.y - pos.y;
                return Math.sqrt(dx * dx + dy * dy) < threshold;
              });
            })
          );
        } else {
          setCurrentStroke([{ x: pos.x, y: pos.y }]);
        }
      }
    };

    const handleMouseMove = (e: any) => {
      e.evt.preventDefault();
      if (!isDrawing) return;
      const pos = stageRef.current.getPointerPosition();

      if (pos) {
        if (tool === "eraser") {
          const threshold = strokeWidth * 2;
          setStrokes(
            strokes.filter((stroke) => {
              return !stroke.some((point) => {
                const dx = point.x - pos.x;
                const dy = point.y - pos.y;
                return Math.sqrt(dx * dx + dy * dy) < threshold;
              });
            })
          );
        } else if (currentStroke) {
          setCurrentStroke([...currentStroke, { x: pos.x, y: pos.y }]);
        }
      }
    };

    const handleMouseUp = () => {
      setIsDrawing(false);
      if (currentStroke && currentStroke.length > 1) {
        setStrokes([...strokes, currentStroke]);
        setCurrentStroke(null);
      }
    };

    const handleMouseLeave = () => {
      if (isDrawing && currentStroke && currentStroke.length > 1) {
        setStrokes([...strokes, currentStroke]);
        setCurrentStroke(null);
        setIsDrawing(false);
      }
    };

    const handleTouchStart = (e: any) => {
      const touch = e.evt.touches[0];
      handleMouseDown({ evt: touch });
    };

    const handleTouchMove = (e: any) => {
      const touch = e.evt.touches[0];
      handleMouseMove({ evt: touch });
    };

    const handleTouchEnd = () => {
      handleMouseUp();
    };

    return (
      <div ref={containerRef} className="w-full h-full">
        {stageSize.width > 0 && (
          <Stage
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
export default DrawCanvas;
