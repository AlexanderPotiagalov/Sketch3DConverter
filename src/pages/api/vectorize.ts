import type { NextApiRequest, NextApiResponse } from "next";
import { RecognizedShape } from "@/utils/ShapeRecognizer";
import { Stroke } from "@/components/DrawCanvas";

type ExtrudeSpec = {
  type: "extrude";
  points: { x: number; y: number }[];
  color: string;
  height: number;
  shape?: string;
  materialType?: string;
  bevelEnabled?: boolean;
  metalness?: number;
  roughness?: number;
};

function getRandomHeight(min = 10, max = 40, baseType?: string): number {
  const baseHeight =
    {
      circle: 25,
      rectangle: 15,
      triangle: 35,
      polygon: 20,
      line: 5,
    }[baseType || ""] || 20;
  return baseHeight + Math.floor(Math.random() * (max - min)) + min;
}

function shapesToExtrusions(shapes: RecognizedShape[]): ExtrudeSpec[] {
  return shapes.map((shape): ExtrudeSpec => {
    const baseExtrusion: ExtrudeSpec = {
      type: "extrude",
      points: shape.points,
      color: shape.color,
      height: getRandomHeight(15, 50, shape.type),
      shape: shape.type,
      bevelEnabled: true,
    };
    switch (shape.type) {
      case "circle":
        return {
          ...baseExtrusion,
          materialType: "physical",
          metalness: 0.2,
          roughness: 0.3,
        };
      case "rectangle":
        return {
          ...baseExtrusion,
          materialType: "standard",
          metalness: 0.1,
          roughness: 0.6,
        };
      case "triangle":
        return {
          ...baseExtrusion,
          materialType: "physical",
          metalness: 0.4,
          roughness: 0.2,
        };
      default:
        return {
          ...baseExtrusion,
          materialType: "standard",
          metalness: 0.1,
          roughness: 0.5,
        };
    }
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Only POST allowed");
  }

  try {
    const {
      strokes,
      recognizedShapes,
    }: {
      strokes?: Stroke[];
      recognizedShapes?: RecognizedShape[];
    } = req.body;

    if (!strokes && !recognizedShapes) {
      return res.status(400).json({
        error: "Missing strokes or recognizedShapes in request body",
      });
    }

    let shapes: ExtrudeSpec[] = [];

    if (recognizedShapes && recognizedShapes.length > 0) {
      shapes = shapesToExtrusions(recognizedShapes);
    } else if (strokes && strokes.length > 0) {
      const { recognizeShapes } = require("@/utils/ShapeRecognizer");
      const detectedShapes = recognizeShapes(strokes);
      shapes = shapesToExtrusions(detectedShapes);
    } else {
      return res.status(400).json({ error: "No valid input provided" });
    }

    return res.status(200).json({ shapes });
  } catch (err: any) {
    console.error("Error processing shapes:", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}
