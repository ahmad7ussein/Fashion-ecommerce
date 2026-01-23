import OrderTrackingClient from "./OrderTrackingClient";

export async function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function OrderTrackingPage({ params }) {
  return <OrderTrackingClient orderId={params.id} />;
}
