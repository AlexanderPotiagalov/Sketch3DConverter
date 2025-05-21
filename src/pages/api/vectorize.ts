import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Allow", "POST");
  return res.status(405).end("Only POST allowed");
}
