"use client"

import { useEffect, useState, type ChangeEvent } from "react"
import { Upload } from "lucide-react"
import { partnersApi, type PartnerStore, type PartnerProduct, type PartnerAnalytics } from "@/lib/api/partners"
import { useAuth } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

const emptyStore = {
  name: "",
  slug: "",
  website: "",
  defaultCommissionRate: 0,
  status: "active" as "active" | "disabled",
  contactEmail: "",
  contactPhone: "",
  description: "",
}

const emptyPartnerProduct = {
  storeId: "",
  name: "",
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
  description: "",
  productUrl: "",
  commissionRate: "",
}

const categoryOptions = [
  "T-Shirts",
  "Tank Tops",
  "Tops",
  "Blouses",
  "Polo Shirts",
  "Hoodies",
  "Sweatshirts",
  "Pants",
  "Jeans",
  "Shorts",
  "Jackets",
  "Dresses",
  "Skirts",
  "Activewear",
  "Accessories",
]

const genderOptions = ["Men", "Women", "Kids", "Unisex"]
const seasonOptions = ["Spring", "Summer", "Fall", "Winter", "All Seasons"]
const styleOptions = ["Casual", "Formal", "Sport", "Streetwear", "Classic", "Minimal"]
const occasionOptions = ["Daily", "Work", "Party", "Sport", "Travel", "Outdoor"]
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "One Size"]
const colorOptions = [
  "Black",
  "White",
  "Gray",
  "Navy",
  "Blue",
  "Red",
  "Green",
  "Beige",
  "Brown",
  "Pink",
  "Purple",
  "Yellow",
  "Orange",
]

export default function PartnerStoresPage() {
  const { user } = useAuth()
  const [stores, setStores] = useState<PartnerStore[]>([])
  const [products, setProducts] = useState<PartnerProduct[]>([])
  const [storeForm, setStoreForm] = useState({ ...emptyStore })
  const [productForm, setProductForm] = useState({ ...emptyPartnerProduct })
  const [uploadedImage, setUploadedImage] = useState("")
  const [uploadedImageName, setUploadedImageName] = useState("")
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<PartnerAnalytics | null>(null)
  const [analyticsStoreId, setAnalyticsStoreId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsDataURL(file)
    })

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setMessage("File must be an image.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5MB.")
      return
    }
    try {
      const base64 = await fileToBase64(file)
      setUploadedImage(base64)
      setUploadedImageName(file.name)
      setMessage(null)
    } catch (error: any) {
      setMessage(error?.message || "Failed to upload image.")
    }
  }

  const loadStores = async () => {
    const data = await partnersApi.getPartnerStores()
    setStores(data)
  }

  const loadProducts = async () => {
    const data = await partnersApi.getPartnerProducts()
    setProducts(data)
  }

  useEffect(() => {
    loadStores()
    loadProducts()
  }, [])

  if (!user || user.role !== "admin") {
    return <div className="p-6">Access restricted.</div>
  }

  const handleStoreSubmit = async () => {
    setMessage(null)
    try {
      if (editingStoreId) {
        await partnersApi.updatePartnerStore(editingStoreId, storeForm)
      } else {
        await partnersApi.createPartnerStore(storeForm)
      }
      setStoreForm({ ...emptyStore })
      setEditingStoreId(null)
      await loadStores()
      setMessage("Partner store saved.")
    } catch (error: any) {
      setMessage(error?.message || "Failed to save store")
    }
  }

  const handleStoreEdit = (store: PartnerStore) => {
    setEditingStoreId(store._id)
    setStoreForm({
      name: store.name,
      slug: store.slug,
      website: store.website || "",
      defaultCommissionRate: store.defaultCommissionRate || 0,
      status: store.status,
      contactEmail: store.contactEmail || "",
      contactPhone: store.contactPhone || "",
      description: store.description || "",
    })
  }

  const handleStoreStatus = async (store: PartnerStore) => {
    const nextStatus = store.status === "active" ? "disabled" : "active"
    await partnersApi.updatePartnerStoreStatus(store._id, nextStatus)
    await loadStores()
  }

  const handleAnalytics = async (storeId: string) => {
    const data = await partnersApi.getPartnerAnalytics(storeId)
    setAnalytics(data)
    setAnalyticsStoreId(storeId)
  }

  const handleProductSubmit = async () => {
    setMessage(null)
    if (!productForm.storeId) {
      setMessage("Select a partner store for the product.")
      return
    }
    if (!uploadedImage && !productForm.image) {
      setMessage("Please provide an image URL or upload an image.")
      return
    }

    const payload = {
      partnerStoreId: productForm.storeId,
      productData: {
        name: productForm.name,
        description: productForm.description || undefined,
        price: Number(productForm.price),
        image: uploadedImage || productForm.image,
        category: productForm.category,
        gender: productForm.gender,
        season: productForm.season,
        style: productForm.style,
        occasion: productForm.occasion,
        sizes: productForm.sizes ? productForm.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
        colors: productForm.colors ? productForm.colors.split(",").map((s) => s.trim()).filter(Boolean) : [],
        stock: Number(productForm.stock) || 0,
        productUrl: productForm.productUrl || undefined,
        commissionRate: productForm.commissionRate ? Number(productForm.commissionRate) : undefined,
      },
    }

    try {
      await partnersApi.createPartnerProduct(payload)
      setProductForm({ ...emptyPartnerProduct })
      setUploadedImage("")
      setUploadedImageName("")
      await loadProducts()
      setMessage("Partner product submitted.")
    } catch (error: any) {
      setMessage(error?.message || "Failed to submit product")
    }
  }

  const handleApprove = async (id: string) => {
    await partnersApi.approvePartnerProduct(id)
    await loadProducts()
  }

  const handleReject = async (id: string) => {
    await partnersApi.rejectPartnerProduct(id)
    await loadProducts()
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Partner Store Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Store name"
              value={storeForm.name}
              onChange={(event) => setStoreForm({ ...storeForm, name: event.target.value })}
            />
            <Input
              placeholder="Slug (unique)"
              value={storeForm.slug}
              onChange={(event) => setStoreForm({ ...storeForm, slug: event.target.value })}
            />
            <Input
              placeholder="Website"
              value={storeForm.website}
              onChange={(event) => setStoreForm({ ...storeForm, website: event.target.value })}
            />
            <Input
              type="number"
              placeholder="Default commission rate (%)"
              value={storeForm.defaultCommissionRate}
              onChange={(event) => setStoreForm({ ...storeForm, defaultCommissionRate: Number(event.target.value) })}
            />
            <Input
              placeholder="Contact email"
              value={storeForm.contactEmail}
              onChange={(event) => setStoreForm({ ...storeForm, contactEmail: event.target.value })}
            />
            <Input
              placeholder="Contact phone"
              value={storeForm.contactPhone}
              onChange={(event) => setStoreForm({ ...storeForm, contactPhone: event.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={storeForm.description}
              onChange={(event) => setStoreForm({ ...storeForm, description: event.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleStoreSubmit}>{editingStoreId ? "Update Store" : "Create Store"}</Button>
            {editingStoreId && (
              <Button variant="outline" onClick={() => {
                setEditingStoreId(null)
                setStoreForm({ ...emptyStore })
              }}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partner Stores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store._id}>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>{store.status}</TableCell>
                  <TableCell>{store.defaultCommissionRate}%</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStoreEdit(store)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStoreStatus(store)}>
                      {store.status === "active" ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAnalytics(store._id)}>
                      Analytics
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {analytics && analyticsStoreId && (
            <div className="mt-4 text-sm">
              <div>Store: {stores.find((s) => s._id === analyticsStoreId)?.name}</div>
              <div>Clicks: {analytics.clicks}</div>
              <div>Sales: {analytics.sales}</div>
              <div>Revenue: {analytics.revenue}</div>
              <div>Commission: {analytics.earnedCommission}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Partner Product (Pending)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select
              className="h-10 rounded-md border px-3"
              value={productForm.storeId}
              onChange={(event) => setProductForm({ ...productForm, storeId: event.target.value })}
            >
              <option value="">Select partner store</option>
              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
            <Input
              placeholder="Product name"
              value={productForm.name}
              onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}
            />
            <Input
              type="number"
              placeholder="Price"
              value={productForm.price}
              onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}
            />
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Image URL (optional if uploaded)"
                  value={productForm.image}
                  onChange={(event) => setProductForm({ ...productForm, image: event.target.value })}
                  className="pr-10"
                />
                <input
                  id="partner-image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                />
                <label
                  htmlFor="partner-image-upload"
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground"
                  title="Upload image"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload image</span>
                </label>
              </div>
              {uploadedImageName && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Using uploaded image: {uploadedImageName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setUploadedImage("")
                      setUploadedImageName("")
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              {uploadedImage && (
                <img
                  src={uploadedImage}
                  alt="Uploaded preview"
                  className="h-24 w-24 rounded-md object-cover border"
                />
              )}
            </div>
            <Input
              placeholder="Category"
              value={productForm.category}
              onChange={(event) => setProductForm({ ...productForm, category: event.target.value })}
              list="partner-category-options"
            />
            <Input
              placeholder="Gender"
              value={productForm.gender}
              onChange={(event) => setProductForm({ ...productForm, gender: event.target.value })}
              list="partner-gender-options"
            />
            <Input
              placeholder="Season"
              value={productForm.season}
              onChange={(event) => setProductForm({ ...productForm, season: event.target.value })}
              list="partner-season-options"
            />
            <Input
              placeholder="Style"
              value={productForm.style}
              onChange={(event) => setProductForm({ ...productForm, style: event.target.value })}
              list="partner-style-options"
            />
            <Input
              placeholder="Occasion"
              value={productForm.occasion}
              onChange={(event) => setProductForm({ ...productForm, occasion: event.target.value })}
              list="partner-occasion-options"
            />
            <Input
              placeholder="Sizes (comma separated)"
              value={productForm.sizes}
              onChange={(event) => setProductForm({ ...productForm, sizes: event.target.value })}
              list="partner-size-options"
            />
            <Input
              placeholder="Colors (comma separated)"
              value={productForm.colors}
              onChange={(event) => setProductForm({ ...productForm, colors: event.target.value })}
              list="partner-color-options"
            />
            <Input
              type="number"
              placeholder="Stock"
              value={productForm.stock}
              onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}
            />
            <Input
              placeholder="Product URL"
              value={productForm.productUrl}
              onChange={(event) => setProductForm({ ...productForm, productUrl: event.target.value })}
            />
            <Input
              type="number"
              placeholder="Commission rate (override)"
              value={productForm.commissionRate}
              onChange={(event) => setProductForm({ ...productForm, commissionRate: event.target.value })}
            />
            <Textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}
            />
          </div>
          <datalist id="partner-category-options">
            {categoryOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <datalist id="partner-gender-options">
            {genderOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <datalist id="partner-season-options">
            {seasonOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <datalist id="partner-style-options">
            {styleOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <datalist id="partner-occasion-options">
            {occasionOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <datalist id="partner-size-options">
            {sizeOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <datalist id="partner-color-options">
            {colorOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
          <Button onClick={handleProductSubmit}>Submit Product</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Partner Products Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{typeof item.partnerStore === "string" ? item.partnerStore : item.partnerStore.name}</TableCell>
                  <TableCell>{item.productData.name}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(item._id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(item._id)}>
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
