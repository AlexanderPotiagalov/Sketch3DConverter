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
  const [color, setColor] = useState("#0077ff");
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [recognizedShapes, setRecognizedShapes] = useState<RecognizedShape[]>(
    []
  );
  const [shapes3D, setShapes3D] = useState<any[]>([]);
  const [show3D, setShow3D] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

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
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const { shapes } = await res.json();
      setShapes3D(shapes);
      setShow3D(true);
    } catch {
      alert("Conversion failed. Please try again.");
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

  return (
    <div className="relative w-full h-screen bg-white">
      {!show3D && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center space-x-4 bg-white p-2 rounded shadow">
          <label>Color:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
          <label>Width:</label>
          <input
            type="range"
            min={1}
            max={30}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(+e.target.value)}
          />
          <button
            className={`px-3 py-1 rounded ${
              isConverting ? "bg-gray-400" : "bg-blue-600"
            } text-white`}
            onClick={handleConvert}
            disabled={isConverting}
          >
            {isConverting ? "Converting..." : "Convert to 3D"}
          </button>
          <button
            className="px-3 py-1 bg-red-100 text-red-600 rounded"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      )}

      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            show3D ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <DrawCanvas
            ref={drawRef}
            color={color}
            strokeWidth={strokeWidth}
            onStrokesChange={handleStrokesChange}
            onShapesRecognized={handleShapesRecognized}
          />
        </div>
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            show3D ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ThreeView
            className="w-full h-full"
            shapes={shapes3D}
            autoRotate
            showGrid
          />
          {show3D && (
            <button
              className="absolute top-4 left-4 px-3 py-1 bg-slate-100 rounded"
              onClick={handleBackToDrawing}
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
