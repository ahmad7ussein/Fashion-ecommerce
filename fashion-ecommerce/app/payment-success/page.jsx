"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AppLoader } from "@/components/ui/app-loader";
import { paymentsApi } from "@/lib/api/payments";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { clear } = useCart();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Confirming your payment...");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setStatus("error");
      setMessage("Missing payment session. Please contact support.");
      return;
    }

    let isMounted = true;
    const verifyPayment = async () => {
      try {
        const result = await paymentsApi.verifyCheckoutSession(sessionId);
        if (!isMounted) return;
        setStatus("success");
        setMessage("Payment verified. Redirecting to your order...");
        clear();
        const orderNumber = result?.orderNumber || result?.orderId;
        if (orderNumber) {
          router.push(`/order-success?order=${orderNumber}`);
        } else {
          router.push("/order-success");
        }
      } catch (error) {
        if (!isMounted) return;
        setStatus("error");
        setMessage(error?.message || "Payment verification failed.");
        toast({
          title: "Payment Verification Failed",
          description: error?.message || "Please try again or contact support.",
          variant: "destructive",
        });
      }
    };

    verifyPayment();
    return () => {
      isMounted = false;
    };
  }, [router, searchParams, toast]);

  return (
    <div className="min-h-[100svh] bg-white pt-24 pb-12 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-white border border-gray-200 shadow-xl rounded-3xl">
          <CardContent className="p-6 md:p-8 text-center space-y-4">
            {status === "verifying" ? (
              <AppLoader label="Verifying payment..." size="lg" />
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {status === "success" ? "Payment Confirmed" : "Payment Issue"}
                </h1>
                <p className="text-gray-600">{message}</p>
                {status === "error" && (
                  <div className="flex flex-col gap-3">
                    <Button asChild className="w-full">
                      <Link href="/checkout">Return to Checkout</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/cart">Back to Cart</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] bg-white pt-24 flex items-center justify-center">
          <AppLoader label="Loading..." size="lg" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
