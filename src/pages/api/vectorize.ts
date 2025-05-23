import type { NextApiRequest, NextApiResponse } from "next";

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Allow", "POST");
  return res.status(405).end("Only POST allowed");
}
