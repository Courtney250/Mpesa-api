import type { Express } from "express";
import type { Server } from "http";
import { stkPushSchema, querySchema } from "@shared/schema";

const BASE_URL = "https://payflow.top/api/v2";

type PayflowResponse = {
  success: boolean;
  message: string;
  [key: string]: unknown;
};

function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.PAYFLOW_API_KEY;
  const apiSecret = process.env.PAYFLOW_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Payflow API credentials not configured");
  }

  return {
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
    "Content-Type": "application/json",
  };
}


async function parsePayflowResponse(response: Response): Promise<{ status: number; data: PayflowResponse }> {
  const text = await response.text();
  try {
    const data = JSON.parse(text) as PayflowResponse;
    const status = data.success === false ? 400 : 200;
    return { status, data };
  } catch {
    return {
      status: 502,
      data: { success: false, message: "Invalid response from payment gateway" },
    };
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/stk-push", async (req, res) => {
    try {
      const parsed = stkPushSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.message });
      }

      const { phoneNumber, amount } = parsed.data;
      const headers = getAuthHeaders();
      const paymentAccountId = Number(process.env.PAYFLOW_ACCOUNT_ID) || 80;

      console.log(`[payflow] STK Push for ${phoneNumber}, amount: ${amount}`);

      const response = await fetch(`${BASE_URL}/stkpush.php`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          payment_account_id: paymentAccountId,
          phone: phoneNumber,
          amount,
          reference: "CourtneyTech",
          description: "Payment via Courtney M-Pesa Pay",
        }),
      });

      const { status, data } = await parsePayflowResponse(response);
      console.log(`[payflow] STK Push response (${status}):`, data);
      return res.status(status).json(data);
    } catch (error: any) {
      console.error("STK Push error:", error);
      return res.status(500).json({ success: false, message: error.message || "STK Push failed" });
    }
  });

  app.post("/api/query", async (req, res) => {
    try {
      const parsed = querySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ success: false, message: parsed.error.message });
      }

      const { checkoutRequestId } = parsed.data;
      const headers = getAuthHeaders();

      const response = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          checkout_request_id: checkoutRequestId,
        }),
      });

      const { status, data } = await parsePayflowResponse(response);
      console.log(`[payflow] Query response (${status}):`, data);
      return res.status(status).json(data);
    } catch (error: any) {
      console.error("Query error:", error);
      return res.status(500).json({ success: false, message: error.message || "Query failed" });
    }
  });

  app.post("/api/callback", async (req, res) => {
    console.log("M-Pesa Callback:", JSON.stringify(req.body, null, 2));
    return res.json({ ResultCode: 0, ResultDesc: "Success" });
  });

  return httpServer;
}
