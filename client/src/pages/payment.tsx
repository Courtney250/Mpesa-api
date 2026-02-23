import { useState } from "react";
import { Send, Banknote, ShieldCheck, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function Payment() {
  const [step, setStep] = useState<"pay" | "details" | "verify">("pay");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState("-");
  const [status, setStatus] = useState("Pending");
  const [verifyId, setVerifyId] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyResult, setVerifyResult] = useState("Response will appear here...");
  const [statusMessage, setStatusMessage] = useState("");

  async function handlePay() {
    if (!phone || !amount) return;
    if (Number(amount) <= 80) {
      setStatusMessage("Amount must be above 80 KSH");
      return;
    }
    setLoading(true);
    setStatusMessage("Initiating payment request...");
    try {
      const res = await fetch("/api/stk-push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone, amount: Number(amount) }),
      });
      const data = await res.json();
      if (data.CheckoutRequestID) {
        setCheckoutRequestId(data.CheckoutRequestID);
        setVerifyId(data.CheckoutRequestID);
        setStatus("Pending");
        setStep("details");
        setStatusMessage("");
      } else {
        setStatusMessage(data.errorMessage || data.error || "Payment request failed");
      }
    } catch (err: any) {
      setStatusMessage(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!verifyId) return;
    setVerifyLoading(true);
    setVerifyResult("Verifying transaction status...");
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkoutRequestId: verifyId }),
      });
      const data = await res.json();
      if (data.ResultCode === "0" || data.ResultCode === 0) {
        setVerifyResult(`Transaction successful! ${data.ResultDesc || ""}`);
      } else if (data.ResultDesc) {
        setVerifyResult(data.ResultDesc);
      } else if (data.errorMessage) {
        setVerifyResult(data.errorMessage);
      } else {
        setVerifyResult(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setVerifyResult(err.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
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
                      placeholder="80"
                      min={80}
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="border-gray-200 focus-visible:ring-[#006400] h-11 text-[15px] shadow-sm rounded-lg"
                    />
                  </div>

                  {statusMessage && (
                    <p data-testid="text-status" className="text-sm text-amber-600 font-medium flex items-center gap-2">
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

            {step === "details" && (
              <div className="space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                <div>
                  <h2 className="text-[#006400] font-bold text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-[18px] h-[18px]" />
                    Transaction Details
                  </h2>
                  <Separator className="mt-3 bg-gray-100" />
                </div>

                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Checkout Request ID:</span>
                      <span data-testid="text-checkout-id" className="font-mono text-sm font-semibold text-gray-900 break-all text-right max-w-[200px]">{checkoutRequestId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span data-testid="text-payment-status" className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1.5 font-semibold text-[13px]">
                        <Clock className="w-3.5 h-3.5" /> {status}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="button-back-to-pay"
                      variant="outline"
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold h-[42px] rounded-lg"
                      onClick={() => setStep("pay")}
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="button-go-verify"
                      className="flex-1 bg-[#006400] hover:bg-[#004d00] text-white font-semibold h-[42px] rounded-lg shadow-sm"
                      onClick={() => setStep("verify")}
                    >
                      Verify Status
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === "verify" && (
              <div className="space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                <div>
                  <h2 className="text-[#006400] font-bold text-lg flex items-center gap-2">
                    <ShieldCheck className="w-[18px] h-[18px]" />
                    Verify Transaction
                  </h2>
                  <Separator className="mt-3 bg-gray-100" />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="requestId" className="text-[13px] font-bold text-gray-700">Checkout Request ID</Label>
                    <Input
                      data-testid="input-verify-id"
                      id="requestId"
                      placeholder="Enter Request ID..."
                      value={verifyId}
                      onChange={(e) => setVerifyId(e.target.value)}
                      className="border-gray-200 focus-visible:ring-[#006400] h-11 text-[15px] shadow-sm rounded-lg font-mono"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      data-testid="button-back-to-details"
                      variant="outline"
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-semibold h-[42px] rounded-lg"
                      onClick={() => setStep("details")}
                    >
                      Back
                    </Button>
                    <Button
                      data-testid="button-verify"
                      className="flex-1 bg-[#006400] hover:bg-[#004d00] text-white font-semibold h-[42px] rounded-lg shadow-sm"
                      onClick={handleVerify}
                      disabled={verifyLoading}
                    >
                      {verifyLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify Transaction"
                      )}
                    </Button>
                  </div>

                  <div data-testid="text-verify-result" className="text-center mt-6 pt-4 border-t border-dashed border-gray-100 text-[13px] text-gray-400 font-medium whitespace-pre-wrap">
                    {verifyResult}
                  </div>
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