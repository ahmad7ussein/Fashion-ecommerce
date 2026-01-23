"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentCancelPage() {
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Payment Canceled
            </h1>
            <p className="text-gray-600">
              Your payment was canceled. You can return to checkout whenever
              you are ready.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/checkout">Return to Checkout</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/cart">Back to Cart</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
