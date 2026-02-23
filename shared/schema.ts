import { z } from "zod";

export const stkPushSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  amount: z.number().min(1),
});

export const querySchema = z.object({
  checkoutRequestId: z.string().min(1),
});

export type StkPushRequest = z.infer<typeof stkPushSchema>;
export type QueryRequest = z.infer<typeof querySchema>;

export interface StkPushResponse {
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResponseCode?: string;
  ResponseDescription?: string;
  CustomerMessage?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface QueryResponse {
  ResponseCode?: string;
  ResponseDescription?: string;
  MerchantRequestID?: string;
  CheckoutRequestID?: string;
  ResultCode?: string;
  ResultDesc?: string;
  errorCode?: string;
  errorMessage?: string;
}