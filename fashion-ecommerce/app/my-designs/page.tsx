"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Search, Trash2, Edit, Download, Share2, Heart, Grid3x3, List, Plus, Loader2 } from "lucide-react"
import { Logo } from "@/components/logo"
import { designsApi, type Design } from "@/lib/api/designs"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import logger from "@/lib/logger"

export default function MyDesignsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [designs, setDesigns] = useState<Design[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }
      loadDesigns()
    }
  }, [user, authLoading])

  const loadDesigns = async () => {
    setIsLoading(true)
    try {
      const data = await designsApi.getMyDesigns()
      setDesigns(data)
    } catch (error: any) {
      logger.error("Failed to load designs:", error)
      toast({
        title: "Error",
        description: "Failed to load designs",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deleteDesign = async (id: string) => {
    if (!confirm("Are you sure you want to delete this design?")) return
    
    try {
      await designsApi.deleteDesign(id)
      setDesigns(designs.filter((d) => d._id !== id))
      toast({
        title: "Design deleted",
        description: "Your design has been deleted successfully",
      })
    } catch (error: any) {
      logger.error("Failed to delete design:", error)
      toast({
        title: "Error",
        description: "Failed to delete design",
        variant: "destructive",
      })
    }
  }

  const filteredDesigns = designs.filter((design) => {
    const matchesSearch =
      design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      design.baseProduct?.type?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo />
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/products" className="text-sm font-medium hover:text-primary transition-colors">
                Shop
              </Link>
              <Link href="/studio" className="text-sm font-medium hover:text-primary transition-colors">
                Design Studio
              </Link>
              <Link href="/my-designs" className="text-sm font-medium text-primary">
                My Designs
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/cart">
                <Button variant="ghost" size="icon">
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/profile">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                  U
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Designs</h1>
          <p className="text-muted-foreground">Manage and organize your custom clothing designs</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Designs</p>
                  <p className="text-3xl font-bold">{designs.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Grid3x3 className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Published</p>
                  <p className="text-3xl font-bold">{designs.filter((d) => d.status === "published").length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">This Month</p>
                  <p className="text-3xl font-bold">
                    {designs.filter((d) => {
                      const designDate = new Date(d.createdAt)
                      const now = new Date()
                      return designDate.getMonth() === now.getMonth() && designDate.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search designs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Link href="/studio">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Design
              </Button>
            </Link>
          </div>
        </div>


        {/* Designs Grid/List */}
        {filteredDesigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Grid3x3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No designs found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Start creating your first custom design"}
              </p>
              <Link href="/studio">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Design
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDesigns.map((design) => (
              <Card key={design._id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <Image
                    src={design.thumbnail || "/placeholder.svg"}
                    alt={design.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {design.status === "published" && (
                    <Badge className="absolute top-3 left-3 bg-green-500">Published</Badge>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link href={`/studio?design=${design._id}`}>
                      <Button size="sm" variant="secondary">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button size="sm" variant="secondary">
                      <ShoppingBag className="h-4 w-4 mr-1" />
                      Order
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1 truncate">{design.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{design.baseProduct?.type || "Product"}</p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(design.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/studio?design=${design._id}`}>
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteDesign(design._id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDesigns.map((design) => (
              <Card key={design._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="w-32 h-32 rounded-lg bg-muted overflow-hidden flex-shrink-0 relative">
                      <Image
                        src={design.thumbnail || "/placeholder.svg"}
                        alt={design.name}
                        fill
                        className="object-cover"
                        sizes="128px"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-semibold mb-1">{design.name}</h3>
                          <p className="text-sm text-muted-foreground">{design.baseProduct?.type || "Product"}</p>
                        </div>
                        {design.status === "published" && (
                          <Badge className="bg-green-500">Published</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span>Created: {new Date(design.createdAt).toLocaleDateString()}</span>
                        <span>Modified: {new Date(design.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/studio?design=${design._id}`}>
                          <Button size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Design
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteDesign(design._id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
