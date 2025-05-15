import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { DrawCanvasHandle } from "@/components/DrawCanvas";

const DrawCanvas = dynamic(() => import("@/components/DrawCanvas"), {
  ssr: false,
});
const ThreeView = dynamic(() => import("@/components/ThreeView"), {
  ssr: false,
});

export default function Home() {
  const drawRef = useRef<DrawCanvasHandle>(null);
  const [show3D, setShow3D] = useState(false);

  const handleConvert = () => {
    setShow3D(true);
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/2 border-r">
        <DrawCanvas ref={drawRef} />
        <button
          className="m-4 px-4 py-2 bg-blue-600 text-white rounded"
          onClick={handleConvert}
        >
          Convert to 3D
        </button>
      </div>
      <div className="w-1/2">
        {show3D ? (
          <ThreeView />
        ) : (
          <div className="p-4 text-gray-500">
            Draw something & click Convert
          </div>
        )}
      </div>
    </div>
  );
}
