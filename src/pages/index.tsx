import { useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Stroke } from "@/components/DrawCanvas";
import type { DrawCanvasHandle } from "@/components/DrawCanvas";
import type { RecognizedShape } from "@/utils/ShapeRecognizer";

const DrawCanvas = dynamic(() => import("@/components/DrawCanvas"), {
  ssr: false,
});
const ThreeView = dynamic(() => import("@/components/ThreeView"), {
  ssr: false,
});

export default function Home() {
  const drawRef = useRef<DrawCanvasHandle>(null);
  const [color, setColor] = useState("#6366f1");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [tool, setTool] = useState<"pen" | "eraser" | "shape">("pen");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [recognizedShapes, setRecognizedShapes] = useState<RecognizedShape[]>(
    []
  );
  const [shapes3D, setShapes3D] = useState<any[]>([]);
  const [show3D, setShow3D] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [showRecognition, setShowRecognition] = useState(true);

  const colorPresets = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#ef4444",
    "#3b82f6",
    "#000000",
  ];

  const handleStrokesChange = useCallback((s: Stroke[]) => setStrokes(s), []);
  const handleShapesRecognized = useCallback(
    (s: RecognizedShape[]) => setRecognizedShapes(s),
    []
  );

  async function handleConvert() {
    if (!strokes.length && !recognizedShapes.length) {
      alert("Draw something first!");
      return;
    }
    setIsConverting(true);
    try {
      const payload = recognizedShapes.length
        ? { recognizedShapes }
        : { strokes };
      const res = await fetch("/api/vectorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Conversion error");
      const { shapes } = await res.json();
      setShapes3D(shapes);
      setShow3D(true);
    } catch {
      alert("Conversion failed.");
    } finally {
      setIsConverting(false);
    }
  }

  function handleBackToDrawing() {
    setShow3D(false);
  }
  function handleClear() {
    drawRef.current?.clearCanvas();
    setStrokes([]);
    setRecognizedShapes([]);
    setShapes3D([]);
  }

  const getShapeCounts = () => {
    const counts = recognizedShapes.reduce((a, sh) => {
      a[sh.type] = (a[sh.type] || 0) + 1;
      return a;
    }, {} as Record<string, number>);
    return Object.entries(counts)
      .map(([t, c]) => `${c} ${t}${c > 1 ? "s" : ""}`)
      .join(", ");
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/20 to-orange-600/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Sketch to 3D
          </h1>
          {!show3D && (
            <div className="text-sm text-slate-700">
              {strokes.length} strokes
              {showRecognition ? `, ${recognizedShapes.length} shapes` : ``}
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      {!show3D ? (
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 max-w-4xl">
          {/* Tools row */}
          <div className="flex items-center justify-center space-x-6 mb-6">
            <div className="flex space-x-2 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setTool("pen")}
                className={
                  tool === "pen" ? "bg-white text-indigo-600 shadow-sm" : ""
                }
              >
                ✏️ Draw
              </button>
              <button
                onClick={() => setTool("eraser")}
                className={
                  tool === "eraser" ? "bg-white text-indigo-600 shadow-sm" : ""
                }
              >
                🧹 Erase
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {colorPresets.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-lg border-2 ${
                    color === c
                      ? "border-slate-400 shadow-lg"
                      : "border-slate-200"
                  }`}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border-2 border-slate-200"
              />
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min={1}
                max={30}
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(+e.target.value)}
                className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="w-12 text-sm text-slate-600 text-center">
                {strokeWidth}px
              </div>
            </div>
          </div>
          {/* Actions row */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRecognition(!showRecognition)}
                className={`px-4 py-2 rounded-xl text-sm ${
                  showRecognition
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {showRecognition ? "✨ Smart Recognition" : "○ Recognition"}
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600"
              >
                🗑️ Clear
              </button>
            </div>
            <button
              onClick={handleConvert}
              disabled={isConverting}
              className={`px-8 py-3 rounded-xl text-sm font-semibold ${
                isConverting
                  ? "bg-slate-300 text-slate-500"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
              }`}
            >
              {isConverting ? "⏳ Converting..." : "🚀 Convert to 3D"}
            </button>
          </div>
        </div>
      ) : (
        /* 3D toolbar */
        <div className="absolute top-24 left-1/2 transform -translate-x-1/2 z-10 p-4 bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl">
          <button
            onClick={handleBackToDrawing}
            className="px-6 py-3 bg-slate-100 rounded-xl"
          >
            ← Back to Drawing
          </button>
        </div>
      )}

      {/* Status card */}
      {!show3D && showRecognition && recognizedShapes.length > 0 && (
        <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-xl max-w-sm">
          <div className="text-sm font-semibold text-slate-800">
            {recognizedShapes.length} Shape
            {recognizedShapes.length > 1 ? "s" : ""} Detected
          </div>
          <div className="text-xs text-slate-600">{getShapeCounts()}</div>
        </div>
      )}

      {/* Canvas & 3D overlay */}
      <div className="absolute inset-0 pt-20">
        <div
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            show3D ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}
        >
          <DrawCanvas
            ref={drawRef}
            color={tool === "eraser" ? "#ffffff" : color}
            strokeWidth={strokeWidth}
            tool={tool}
            showRecognizedShapes={showRecognition}
            onStrokesChange={handleStrokesChange}
            onShapesRecognized={handleShapesRecognized}
          />
        </div>
        <div
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            show3D
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105 pointer-events-none"
          }`}
        >
          <ThreeView
            className="w-full h-full rounded-2xl overflow-hidden"
            shapes={shapes3D}
            autoRotate
            showGrid
          />
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
}
