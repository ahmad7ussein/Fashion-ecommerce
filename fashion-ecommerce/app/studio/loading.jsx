import { AppLoader } from "@/components/ui/app-loader";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <AppLoader label="Loading studio..." size="lg" />
    </div>
  );
}
