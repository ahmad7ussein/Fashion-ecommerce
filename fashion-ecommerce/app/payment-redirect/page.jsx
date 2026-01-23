"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLoader } from "@/components/ui/app-loader";
import { paymentsApi } from "@/lib/api/payments";
import { useToast } from "@/hooks/use-toast";

function PaymentRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [message, setMessage] = useState("Redirecting to secure payment verification...");

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId) {
      setMessage("Missing payment session. Redirecting...");
      router.push("/payment-cancel");
      return;
    }

    let isMounted = true;
    const verifyPayment = async () => {
      try {
        const result = await paymentsApi.verifyCheckoutSession(sessionId);
        if (!isMounted) return;
        const orderRef = result?.orderNumber || result?.orderId;
        // Send the user to the existing order success page.
        router.push(orderRef ? `/order-success?order=${orderRef}` : "/order-success");
      } catch (error) {
        if (!isMounted) return;
        toast({
          title: "Payment Verification Failed",
          description: error?.message || "Unable to confirm payment.",
          variant: "destructive",
        });
        router.push("/payment-cancel");
      }
    };

    verifyPayment();
    return () => {
      isMounted = false;
    };
  }, [router, searchParams, toast]);

  return (
    <div className="min-h-[100svh] bg-white pt-24 pb-12 flex items-center justify-center px-4">
      <div className="w-full max-w-lg text-center space-y-4">
        <AppLoader label="Verifying payment..." size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export default function PaymentRedirectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100svh] bg-white pt-24 flex items-center justify-center">
          <AppLoader label="Loading..." size="lg" />
        </div>
      }
    >
      <PaymentRedirectContent />
    </Suspense>
  );
}
