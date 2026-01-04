import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export function ProductDetailSkeleton() {
    return (<div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-lg"/>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="aspect-square rounded-lg"/>))}
          </div>
        </div>

        
        <div className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4"/>
            <Skeleton className="h-6 w-1/2"/>
            <Skeleton className="h-10 w-32"/>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-4 w-full"/>
            <Skeleton className="h-4 w-full"/>
            <Skeleton className="h-4 w-2/3"/>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-5 w-24"/>
            <div className="flex gap-2">
              {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-10 w-10 rounded-full"/>))}
            </div>
          </div>

          <div className="space-y-4">
            <Skeleton className="h-5 w-24"/>
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-10 w-16 rounded-md"/>))}
            </div>
          </div>

          <div className="flex gap-4">
            <Skeleton className="h-12 flex-1 rounded-lg"/>
            <Skeleton className="h-12 w-12 rounded-lg"/>
            <Skeleton className="h-12 w-12 rounded-lg"/>
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-32"/>
              <Skeleton className="h-4 w-full"/>
              <Skeleton className="h-4 w-3/4"/>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
}
