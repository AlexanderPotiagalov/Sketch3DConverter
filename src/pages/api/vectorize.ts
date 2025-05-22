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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Allow", "POST");
  return res.status(405).end("Only POST allowed");
}
