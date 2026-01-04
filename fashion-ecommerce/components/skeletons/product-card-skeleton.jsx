import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export function ProductCardSkeleton() {
    return (<Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Skeleton className="w-full h-full"/>
      </div>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4"/>
        <Skeleton className="h-4 w-1/2"/>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20"/>
          <Skeleton className="h-9 w-24 rounded-full"/>
        </div>
      </CardContent>
    </Card>);
}
export function ProductGridSkeleton({ count = 8 }) {
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (<ProductCardSkeleton key={i}/>))}
    </div>);
}
