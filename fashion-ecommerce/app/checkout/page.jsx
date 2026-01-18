"use client";
import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useRegion } from "@/lib/region";
import { ordersApi } from "@/lib/api/orders";
import { designsApi } from "@/lib/api/designs";
import { paymentsApi } from "@/lib/api/payments";
import logger from "@/lib/logger";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
const CheckoutSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(7),
    address: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    zip: z.string().min(3),
    country: z.string().min(2),
});
export default function CheckoutPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { items, clear, subtotal: cartSubtotal } = useCart();
    const { user } = useAuth();
    const { formatPrice } = useRegion();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const extractProductId = (item) => {
        if (item.product)
            return item.product;
        const [maybeId] = (item.id || "").split("-");
        if (/^[0-9a-fA-F]{24}$/.test(maybeId))
            return maybeId;
        return undefined;
    };
    const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value || ""));
    const form = useForm({
        resolver: zodResolver(CheckoutSchema),
        defaultValues: {
            country: "US",
        },
    });
    const shipping = cartSubtotal > 100 ? 0 : 9.99;
    const tax = cartSubtotal * 0.08;
    const total = cartSubtotal + shipping + tax;
    const onSubmit = async (values) => {
        if (!user) {
            toast({
                title: "Authentication Required",
                description: "Please log in to complete your order",
                variant: "destructive",
            });
            router.push("/login");
            return;
        }
        if (items.length === 0) {
            toast({
                title: "Cart is Empty",
                description: "Please add items to your cart before checkout",
                variant: "destructive",
            });
            router.push("/cart");
            return;
        }
        setIsSubmitting(true);
        try {
            const normalizedItems = items.map((item) => ({
                ...item,
                product: extractProductId(item),
            }));
            const missingProductItems = normalizedItems.filter((i) => !i.product && !i.isCustom);
            if (missingProductItems.length > 0) {
                setIsSubmitting(false);
                toast({
                    title: "Product validation failed",
                    description: "One or more items are invalid or missing product IDs. Please refresh your cart.",
                    variant: "destructive",
                });
                return;
            }
            const preparedItems = await Promise.all(normalizedItems.map(async (item) => {
                if (item.isCustom && !item.design && item.designMetadata && isValidObjectId(item.baseProductId)) {
                    try {
                        const created = await designsApi.createDesign({
                            name: item.name || "Custom design",
                            baseProductId: item.baseProductId,
                            baseProduct: item.baseProduct || {
                                type: item.name || "Studio Product",
                                color: item.color,
                                size: item.size,
                            },
                            thumbnail: item.image,
                            elements: [],
                            views: [],
                            designMetadata: item.designMetadata,
                        });
                        return {
                            ...item,
                            design: created?._id || created?.id,
                        };
                    }
                    catch (error) {
                        throw new Error(error?.message || "Failed to create design for checkout");
                    }
                }
                return item;
            }));
            const orderData = {
                items: preparedItems.map(item => ({
                    product: item.product,
                    design: item.design,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color,
                    image: item.image,
                    isCustom: item.isCustom || false,
                    notes: item.notes || "",
                    designMetadata: item.designMetadata || undefined,
                })),
                shippingAddress: {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    phone: values.phone,
                    street: values.address,
                    city: values.city,
                    state: values.state,
                    zip: values.zip,
                    country: values.country,
                },
                paymentInfo: {
                    method: "card",
                    status: "pending",
                },
                subtotal: cartSubtotal,
                tax: tax,
                shipping: shipping,
                total: total,
            };
            const order = await ordersApi.createOrder(orderData);
            logger.log("Order created successfully:", order);
            const checkoutSession = await paymentsApi.createCheckoutSession(order._id);
            if (!checkoutSession?.url) {
                throw new Error("Failed to start Stripe checkout session");
            }
            clear();
            window.location.href = checkoutSession.url;
        }
        catch (error) {
            logger.error("Order creation error:", error);
            toast({
                title: "Order Failed",
                description: error.message || "Failed to place order. Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="min-h-screen bg-gradient-to-b from-white via-rose-50/30 to-white pt-24">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-6xl mx-auto">
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-5xl md:text-6xl font-bold mb-12 text-gray-900">
            Checkout
          </motion.h1>

          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              <div className="lg:col-span-2 space-y-6">
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5"/>
                      Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" {...form.register("firstName")}/>
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" {...form.register("lastName")}/>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" {...form.register("email")}/>
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" {...form.register("phone")}/>
                    </div>

                    <div>
                      <Label htmlFor="address">Street Address</Label>
                      <Input id="address" {...form.register("address")}/>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input id="city" {...form.register("city")}/>
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input id="state" {...form.register("state")}/>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input id="zip" {...form.register("zip")}/>
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" {...form.register("country")}/>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                
              </div>

              
              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {items.map((item) => (<div key={item.id} className="flex gap-3 pb-3 border-b border-border">
                          <div className="w-16 h-16 rounded bg-muted flex-shrink-0 overflow-hidden relative">
                            <Image src={item.image || "/placeholder-logo.png"} alt={item.name} fill className="object-cover" sizes="64px"/>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Size: {item.size} - Qty: {item.quantity}</p>
                            <p className="text-sm font-semibold mt-1">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                        </div>))}
                    </div>

                    <div className="space-y-2 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(cartSubtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className={shipping === 0 ? "text-green-600 font-medium" : ""}>{shipping === 0 ? "FREE" : formatPrice(shipping)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax</span>
                        <span>{formatPrice(tax)}</span>
                      </div>
                      <div className="border-t border-border pt-3 mt-3">
                        <div className="flex justify-between">
                          <span className="font-semibold">Total</span>
                          <span className="text-2xl font-bold">{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                      <Lock className="mr-2 h-4 w-4"/>
                      {isSubmitting ? "Processing..." : "Place Order"}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By placing your order, you agree to our Terms of Service and Privacy Policy
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>);
}
