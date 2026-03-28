import { useState, useEffect, useRef } from "react";
import { Send, Banknote, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type PollStatus = "polling" | "success" | "failed" | "timeout";

export default function Payment() {
  const [step, setStep] = useState<"pay" | "waiting">("pay");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState("");
  const [pollStatus, setPollStatus] = useState<PollStatus>("polling");
  const [pollMessage, setPollMessage] = useState("");
  const [transactionCode, setTransactionCode] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MAX_ATTEMPTS = 24;
  const POLL_INTERVAL = 5000;

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function checkStatus(requestId: string, attempt: number) {
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutRequestId: requestId }),
      });
      const data = await res.json();

      if (data.success && (data.status === "success" || data.status === "completed")) {
        stopPolling();
        setTransactionCode(data.transaction_code || null);
        setPollStatus("success");
        setPollMessage(`KSH ${data.amount} paid successfully from ${data.phone}`);
      } else if (data.success && data.status === "failed") {
        stopPolling();
        setPollStatus("failed");
        setPollMessage("Payment was cancelled or failed. Please try again.");
      } else if (attempt >= MAX_ATTEMPTS) {
        stopPolling();
        setPollStatus("timeout");
        setPollMessage("Verification timed out. Please check your M-Pesa messages.");
      } else {
        setPollMessage(`Waiting for M-Pesa confirmation... (${attempt}/${MAX_ATTEMPTS})`);
      }
    } catch {
      if (attempt >= MAX_ATTEMPTS) {
        stopPolling();
        setPollStatus("timeout");
        setPollMessage("Could not reach server. Please check your M-Pesa messages.");
      }
    }
  }

  function startPolling(requestId: string) {
    let attempt = 1;
    setAttemptCount(attempt);
    checkStatus(requestId, attempt);

    pollRef.current = setInterval(() => {
      attempt += 1;
      setAttemptCount(attempt);
      checkStatus(requestId, attempt);
    }, POLL_INTERVAL);
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  function resetForm() {
    stopPolling();
    setStep("pay");
    setCheckoutRequestId("");
    setPollStatus("polling");
    setPollMessage("");
    setTransactionCode(null);
    setAttemptCount(0);
    setStatusMessage("");
  }

  async function handlePay() {
    if (!phone || !amount) return;
    setLoading(true);
    setStatusMessage("Initiating payment request...");
    try {
      const res = await fetch("/api/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.success && data.checkout_request_id) {
        setCheckoutRequestId(data.checkout_request_id);
        setPollStatus("polling");
        setPollMessage("Waiting for M-Pesa confirmation...");
        setStep("waiting");
        startPolling(data.checkout_request_id);
        setStatusMessage("");
      } else {
        setStatusMessage(data.message || "Payment request failed");
      }
    } catch (err: any) {
      setStatusMessage(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 font-sans bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: `url('/ocean-bg.jpg')` }}
    >
      <div className="absolute inset-0 bg-black/15 backdrop-blur-[2px]"></div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <Card className="w-full max-w-[480px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl overflow-hidden border-0">
          <div className="bg-[#006400] px-6 py-5 text-center text-white">
            <h1 data-testid="text-title" className="text-xl font-bold flex items-center justify-center gap-2 tracking-tight">
              <Banknote className="w-6 h-6" />
              Courtney M-Pesa Pay
            </h1>
            <p className="text-[13px] mt-1.5 text-green-100/90 font-medium">
              Enter your Mpesa Number and amount to make payment securely
            </p>
          </div>

          <CardContent className="p-6 bg-white">
            {step === "pay" && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                <div>
                  <h2 className="text-[#006400] font-bold text-lg flex items-center gap-2">
                    <Send className="w-[18px] h-[18px]" />
                    Pay Now
                  </h2>
                  <Separator className="mt-3 bg-gray-100" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[13px] font-bold text-gray-700">Phone Number (254...)</Label>
                    <Input
                      data-testid="input-phone"
                      id="phone"
                      placeholder="2547xxxxxxxxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="border-gray-200 focus-visible:ring-[#006400] h-11 text-[15px] shadow-sm rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-[13px] font-bold text-gray-700">Amount (KSH)</Label>
                    <Input
                      data-testid="input-amount"
                      id="amount"
                      placeholder="Enter amount"
                      min={1}
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-gray-200 focus-visible:ring-[#006400] h-11 text-[15px] shadow-sm rounded-lg"
                    />
                  </div>

                  {statusMessage && (
                    <p data-testid="text-status" className="text-sm text-red-500 font-medium flex items-center gap-2">
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {statusMessage}
                    </p>
                  )}

                  <Button
                    data-testid="button-pay"
                    className="bg-[#006400] hover:bg-[#004d00] text-white font-semibold px-6 h-[42px] w-[130px] rounded-lg shadow-sm transition-all flex items-center justify-center"
                    onClick={handlePay}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Pay Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === "waiting" && (
              <div className="space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                <div>
                  <h2 className="text-[#006400] font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-[18px] h-[18px]" />
                    Payment Status
                  </h2>
                  <Separator className="mt-3 bg-gray-100" />
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-sm font-medium text-gray-500 shrink-0">Request ID:</span>
                      <span data-testid="text-checkout-id" className="font-mono text-xs font-semibold text-gray-700 break-all text-right">{checkoutRequestId}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      {pollStatus === "polling" && (
                        <span data-testid="text-payment-status" className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1.5 font-semibold text-[13px]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking...
                        </span>
                      )}
                      {pollStatus === "success" && (
                        <span data-testid="text-payment-status" className="text-green-700 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1.5 font-semibold text-[13px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                        </span>
                      )}
                      {(pollStatus === "failed" || pollStatus === "timeout") && (
                        <span data-testid="text-payment-status" className="text-red-600 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1.5 font-semibold text-[13px]">
                          <XCircle className="w-3.5 h-3.5" /> {pollStatus === "timeout" ? "Timed out" : "Failed"}
                        </span>
                      )}
                    </div>

                    {transactionCode && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Transaction Code:</span>
                        <span className="font-mono text-sm font-bold text-green-700">{transactionCode}</span>
                      </div>
                    )}
                  </div>

                  <p data-testid="text-poll-message" className="text-center text-[13px] text-gray-500 font-medium flex items-center justify-center gap-2">
                    {pollStatus === "polling" && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />}
                    {pollStatus === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                    {(pollStatus === "failed" || pollStatus === "timeout") && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                    {pollMessage || "Waiting for M-Pesa confirmation..."}
                  </p>

                  {pollStatus === "polling" && (
                    <p className="text-center text-[11px] text-gray-400">
                      Check your phone and enter your M-Pesa PIN to complete the payment
                    </p>
                  )}

                  <Button
                    data-testid="button-new-payment"
                    variant="outline"
                    className="w-full border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold h-[42px] rounded-lg"
                    onClick={resetForm}
                  >
                    {pollStatus === "polling" ? "Cancel" : "Make Another Payment"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-8 text-white text-[13px] tracking-wide font-medium drop-shadow-md">
          ©2025 Secured by Courtney Tech
        </p>
      </div>
    </div>
  );
}
