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
  const [show3D, setShow3D] = useState(false);

  // callbacks to receive data from DrawCanvas
  const handleStrokesChange = useCallback((newStrokes: Stroke[]) => {
    setStrokes(newStrokes);
  }, []);
  const handleShapesRecognized = useCallback((shapes: RecognizedShape[]) => {
    setRecognizedShapes(shapes);
  }, []);

  const handleConvert = () => {
    setShow3D(true);
  };

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
            className="px-3 py-1 bg-blue-600 text-white rounded"
            onClick={handleConvert}
          >
            Convert to 3D
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
          <ThreeView className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
