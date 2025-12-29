"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { roleAssignmentsApi } from "@/lib/api/roleAssignments"
import { vendorApi, type VendorProduct } from "@/lib/api/vendor"

type VendorFormState = {
  name: string
  description: string
  price: string
  image: string
  category: string
  gender: string
  season: string
  style: string
  occasion: string
  sizes: string
  colors: string
  stock: string
}

const defaultFormState: VendorFormState = {
  name: "",
  description: "",
  price: "",
  image: "",
  category: "",
  gender: "",
  season: "",
  style: "",
  occasion: "",
  sizes: "",
  colors: "",
  stock: "",
}

export default function VendorPanelPage() {
  const { user, isLoading: authLoading, logout } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<VendorProduct[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [report, setReport] = useState({ totalSales: 0, revenue: 0 })
  const [formState, setFormState] = useState<VendorFormState>(defaultFormState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/vendor/login")
      return
    }
    if (user.role === "admin") {
      setHasAccess(true)
      return
    }

    roleAssignmentsApi
      .getMyAssignments()
      .then((assignments) => {
        const isActive = assignments.some(
          (assignment) => assignment.role === "service_provider" && assignment.status === "active"
        )
        setHasAccess(isActive)
      })
      .catch(() => setHasAccess(false))
  }, [authLoading, router, user])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsData, ordersData, reportData] = await Promise.all([
        vendorApi.getProducts(),
        vendorApi.getOrders(),
        vendorApi.getReport(),
      ])
      setProducts(productsData || [])
      setOrders(ordersData?.orders || [])
      setReport({
        totalSales: reportData?.totalSales || 0,
        revenue: reportData?.revenue || 0,
      })
    } catch (error: any) {
      toast({
        title: "Failed to load vendor data",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user || !hasAccess) return
    loadData()
  }, [user, hasAccess])

  const parseList = (value: string) =>
    value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)

  const resetForm = () => {
    setFormState(defaultFormState)
    setEditingProductId(null)
  }

  const handleEdit = (product: VendorProduct) => {
    setEditingProductId(product._id)
    setFormState({
      name: product.productData.name || "",
      description: product.productData.description || "",
      price: product.productData.price?.toString() || "",
      image: product.productData.image || "",
      category: product.productData.category || "",
      gender: product.productData.gender || "",
      season: product.productData.season || "",
      style: product.productData.style || "",
      occasion: product.productData.occasion || "",
      sizes: product.productData.sizes?.join(", ") || "",
      colors: product.productData.colors?.join(", ") || "",
      stock: product.productData.stock?.toString() || "",
    })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const requiredFields = [
      formState.name,
      formState.price,
      formState.image,
      formState.category,
      formState.gender,
      formState.season,
      formState.style,
      formState.occasion,
    ]

    if (requiredFields.some((value) => !value.trim())) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const priceValue = Number(formState.price)
    if (Number.isNaN(priceValue) || priceValue <= 0) {
      toast({
        title: "Invalid price",
        description: "Price must be a positive number.",
        variant: "destructive",
      })
      return
    }

    const stockValue = formState.stock.trim() ? Number(formState.stock) : undefined
    if (formState.stock.trim() && (Number.isNaN(stockValue) || (stockValue ?? 0) < 0)) {
      toast({
        title: "Invalid stock",
        description: "Stock must be zero or more.",
        variant: "destructive",
      })
      return
    }

    const payload = {
      productData: {
        name: formState.name.trim(),
        description: formState.description.trim() || undefined,
        price: priceValue,
        image: formState.image.trim(),
        category: formState.category.trim(),
        gender: formState.gender.trim(),
        season: formState.season.trim(),
        style: formState.style.trim(),
        occasion: formState.occasion.trim(),
        stock: stockValue,
        sizes: parseList(formState.sizes),
        colors: parseList(formState.colors),
      },
    }

    if (!payload.productData.sizes?.length) {
      delete payload.productData.sizes
    }
    if (!payload.productData.colors?.length) {
      delete payload.productData.colors
    }

    try {
      setIsSubmitting(true)
      if (editingProductId) {
        await vendorApi.updateProduct(editingProductId, payload)
        toast({ title: "Product updated", description: "Pending product updated." })
      } else {
        await vendorApi.createProduct(payload)
        toast({ title: "Product submitted", description: "Product added in pending status." })
      }
      resetForm()
      loadData()
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || hasAccess === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading vendor panel...
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Vendor access required</CardTitle>
            <CardDescription>Your account does not have vendor permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask an administrator to assign the service provider role to your account.
            </p>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Vendor Control Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage custom products and view your performance.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
              <CardDescription>Totals from approved vendor products.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Total Sales</span>
                <span className="font-medium">{report.totalSales}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revenue</span>
                <span className="font-medium">${report.revenue.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Notes</CardTitle>
              <CardDescription>Products stay pending until admin approval.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Only pending or rejected products can be edited.</p>
              <p>Approved products are published by the admin team.</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{editingProductId ? "Edit Product" : "Add New Product"}</CardTitle>
            <CardDescription>Required fields are marked with *.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formState.description}
                  onChange={(event) => setFormState({ ...formState, description: event.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.price}
                  onChange={(event) => setFormState({ ...formState, price: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formState.stock}
                  onChange={(event) => setFormState({ ...formState, stock: event.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Main Image URL *</Label>
                <Input
                  id="image"
                  value={formState.image}
                  onChange={(event) => setFormState({ ...formState, image: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input
                  id="category"
                  value={formState.category}
                  onChange={(event) => setFormState({ ...formState, category: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Input
                  id="gender"
                  value={formState.gender}
                  onChange={(event) => setFormState({ ...formState, gender: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="season">Season *</Label>
                <Input
                  id="season"
                  value={formState.season}
                  onChange={(event) => setFormState({ ...formState, season: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Style *</Label>
                <Input
                  id="style"
                  value={formState.style}
                  onChange={(event) => setFormState({ ...formState, style: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion *</Label>
                <Input
                  id="occasion"
                  value={formState.occasion}
                  onChange={(event) => setFormState({ ...formState, occasion: event.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sizes">Sizes</Label>
                <Input
                  id="sizes"
                  value={formState.sizes}
                  onChange={(event) => setFormState({ ...formState, sizes: event.target.value })}
                  placeholder="S, M, L"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="colors">Colors</Label>
                <Input
                  id="colors"
                  value={formState.colors}
                  onChange={(event) => setFormState({ ...formState, colors: event.target.value })}
                  placeholder="Black, White"
                />
              </div>
              <div className="md:col-span-2 flex flex-wrap gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingProductId ? "Save Changes" : "Submit Product"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Products</CardTitle>
            <CardDescription>Pending products are waiting for admin approval.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vendor products yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell>{product.productData.name}</TableCell>
                      <TableCell className="capitalize">{product.status}</TableCell>
                      <TableCell>${product.productData.price.toFixed(2)}</TableCell>
                      <TableCell>{product.productData.stock ?? 0}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                          disabled={product.status === "approved"}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Orders</CardTitle>
            <CardDescription>Orders that include your approved products.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading orders...</p>
            ) : orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders found yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow key={order._id}>
                      <TableCell>{order.orderNumber || order._id?.slice(-6)}</TableCell>
                      <TableCell className="capitalize">{order.status}</TableCell>
                      <TableCell>
                        {typeof order.total === "number" ? `$${order.total.toFixed(2)}` : "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
