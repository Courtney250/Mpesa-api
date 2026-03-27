import type { Express } from "express";
import type { Server } from "http";
import { stkPushSchema, querySchema } from "@shared/schema";

const BASE_URL = "https://payflow.top/api/v2";

function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.MPESA_CONSUMER_KEY;
  const apiSecret = process.env.MPESA_CONSUMER_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("API credentials not configured");
  }

  return {
    "X-API-Key": apiKey,
    "X-API-Secret": apiSecret,
    "Content-Type": "application/json",
  };
}

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.post("/api/stk-push", async (req, res) => {
    try {
      const parsed = stkPushSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { phoneNumber, amount } = parsed.data;
      const headers = getAuthHeaders();
      const shortcode = process.env.MPESA_SHORTCODE || "174379";
      const passkey = process.env.MPESA_PASSKEY || "";
      const timestamp = getTimestamp();
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
      const callbackUrl = process.env.MPESA_CALLBACK_URL || "https://example.com/callback";

      console.log(`[payflow] STK Push for ${phoneNumber}, amount: ${amount}, shortcode: ${shortcode}`);

      const response = await fetch(
        `${BASE_URL}/mpesa/stkpush/v1/processrequest`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: "CustomerPayBillOnline",
            Amount: amount,
            PartyA: phoneNumber,
            PartyB: shortcode,
            PhoneNumber: phoneNumber,
            CallBackURL: callbackUrl,
            AccountReference: "CourtneyTech",
            TransactionDesc: "Payment",
          }),
        }
      );

      const text = await response.text();
      console.log(`[mpesa] STK Push response: ${text.substring(0, 300)}`);
      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch {
        return res.status(502).json({ error: "Invalid response from M-Pesa API" });
      }
    } catch (error: any) {
      console.error("STK Push error:", error);
      return res.status(500).json({ error: error.message || "STK Push failed" });
    }
  });

  app.post("/api/query", async (req, res) => {
    try {
      const parsed = querySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }

      const { checkoutRequestId } = parsed.data;
      const headers = getAuthHeaders();
      const shortcode = process.env.MPESA_SHORTCODE || "174379";
      const passkey = process.env.MPESA_PASSKEY || "";
      const timestamp = getTimestamp();
      const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

      const response = await fetch(
        `${BASE_URL}/mpesa/stkpushquery/v1/query`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            CheckoutRequestID: checkoutRequestId,
          }),
        }
      );

      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return res.json(data);
      } catch {
        return res.status(502).json({ error: "Invalid response from M-Pesa API" });
      }
    } catch (error: any) {
      console.error("Query error:", error);
      return res.status(500).json({ error: error.message || "Query failed" });
    }
  });

  app.post("/api/callback", async (req, res) => {
    console.log("M-Pesa Callback:", JSON.stringify(req.body, null, 2));
    return res.json({ ResultCode: 0, ResultDesc: "Success" });
  });

  return httpServer;
}