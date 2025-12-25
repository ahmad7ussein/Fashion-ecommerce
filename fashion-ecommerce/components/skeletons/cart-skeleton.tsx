import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function CartItemSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CartSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CartItemSkeleton key={i} />
          ))}
        </div>
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-12 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

