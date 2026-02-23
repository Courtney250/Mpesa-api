import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  console.log("M-Pesa Callback:", JSON.stringify(req.body, null, 2));
  return res.json({ ResultCode: 0, ResultDesc: "Success" });
}