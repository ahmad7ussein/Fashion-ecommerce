import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
export function HeroSkeleton() {
    return (<div className="relative h-[600px] w-full overflow-hidden">
      <Skeleton className="w-full h-full"/>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 w-full max-w-3xl px-4">
          <Skeleton className="h-12 w-3/4 mx-auto"/>
          <Skeleton className="h-6 w-1/2 mx-auto"/>
          <Skeleton className="h-12 w-48 mx-auto rounded-full"/>
        </div>
      </div>
    </div>);
}
export function CategoryGridSkeleton() {
    return (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (<Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full"/>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-3/4 mx-auto"/>
          </CardContent>
        </Card>))}
    </div>);
}
export function FeaturedProductsSkeleton() {
    return (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (<Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-square w-full"/>
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-3/4"/>
            <Skeleton className="h-4 w-1/2"/>
            <Skeleton className="h-6 w-20"/>
          </CardContent>
        </Card>))}
    </div>);
}
export function HomePageSkeleton() {
    return (<div className="space-y-12">
      <HeroSkeleton />
      <div className="container mx-auto px-4 space-y-12">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64"/>
          <CategoryGridSkeleton />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64"/>
          <FeaturedProductsSkeleton />
        </div>
      </div>
    </div>);
}
