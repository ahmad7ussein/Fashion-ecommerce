"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { roleAssignmentsApi } from "@/lib/api/roleAssignments";
import { partnerPanelApi, } from "@/lib/api/partnerPanel";
const defaultFormState = {
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
    productUrl: "",
    commissionRate: "",
};
export default function PartnerPanelPage() {
    const { user, isLoading: authLoading, logout } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [hasAccess, setHasAccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [store, setStore] = useState(null);
    const [storeError, setStoreError] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [products, setProducts] = useState([]);
    const [formState, setFormState] = useState(defaultFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    useEffect(() => {
        if (authLoading)
            return;
        if (!user) {
            router.replace("/partner/login");
            return;
        }
        if (user.role === "admin") {
            setHasAccess(true);
            return;
        }
        roleAssignmentsApi
            .getMyAssignments()
            .then((assignments) => {
            const isActive = assignments.some((assignment) => assignment.role === "partner" && assignment.status === "active");
            setHasAccess(isActive);
        })
            .catch(() => setHasAccess(false));
    }, [authLoading, router, user]);
    const loadData = async () => {
        try {
            setLoading(true);
            setStoreError(null);
            const [storeResult, analyticsResult, productsResult] = await Promise.allSettled([
                partnerPanelApi.getStore(),
                partnerPanelApi.getAnalytics(),
                partnerPanelApi.getProducts(),
            ]);
            if (storeResult.status === "fulfilled") {
                setStore(storeResult.value);
            }
            else {
                setStore(null);
                setStoreError(storeResult.reason?.message || "Partner store not found.");
            }
            if (analyticsResult.status === "fulfilled") {
                setAnalytics(analyticsResult.value);
            }
            else {
                setAnalytics(null);
            }
            if (productsResult.status === "fulfilled") {
                setProducts(productsResult.value || []);
            }
            else {
                setProducts([]);
            }
        }
        catch (error) {
            toast({
                title: "Failed to load partner data",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        if (!user || !hasAccess)
            return;
        loadData();
    }, [user, hasAccess]);
    const parseList = (value) => value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    const resetForm = () => {
        setFormState(defaultFormState);
        setEditingProductId(null);
    };
    const handleEdit = (product) => {
        setEditingProductId(product._id);
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
            productUrl: product.productData.productUrl || "",
            commissionRate: product.productData.commissionRate?.toString() || "",
        });
    };
    const handleSubmit = async (event) => {
        event.preventDefault();
        const requiredFields = [
            formState.name,
            formState.price,
            formState.image,
            formState.category,
            formState.gender,
            formState.season,
            formState.style,
            formState.occasion,
        ];
        if (requiredFields.some((value) => !value.trim())) {
            toast({
                title: "Missing fields",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }
        const priceValue = Number(formState.price);
        if (Number.isNaN(priceValue) || priceValue <= 0) {
            toast({
                title: "Invalid price",
                description: "Price must be a positive number.",
                variant: "destructive",
            });
            return;
        }
        const stockValue = formState.stock.trim() ? Number(formState.stock) : undefined;
        if (formState.stock.trim() && (Number.isNaN(stockValue) || (stockValue ?? 0) < 0)) {
            toast({
                title: "Invalid stock",
                description: "Stock must be zero or more.",
                variant: "destructive",
            });
            return;
        }
        const commissionValue = formState.commissionRate.trim()
            ? Number(formState.commissionRate)
            : undefined;
        if (formState.commissionRate.trim() &&
            (Number.isNaN(commissionValue) || (commissionValue ?? 0) < 0 || (commissionValue ?? 0) > 100)) {
            toast({
                title: "Invalid commission",
                description: "Commission rate must be between 0 and 100.",
                variant: "destructive",
            });
            return;
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
                productUrl: formState.productUrl.trim() || undefined,
                commissionRate: commissionValue,
            },
        };
        if (!payload.productData.sizes?.length) {
            delete payload.productData.sizes;
        }
        if (!payload.productData.colors?.length) {
            delete payload.productData.colors;
        }
        try {
            setIsSubmitting(true);
            if (editingProductId) {
                await partnerPanelApi.updateProduct(editingProductId, payload);
                toast({ title: "Product updated", description: "Pending product updated." });
            }
            else {
                await partnerPanelApi.createProduct(payload);
                toast({ title: "Product submitted", description: "Product added in pending status." });
            }
            resetForm();
            loadData();
        }
        catch (error) {
            toast({
                title: "Action failed",
                description: error.message || "Please try again.",
                variant: "destructive",
            });
        }
        finally {
            setIsSubmitting(false);
        }
    };
    if (authLoading || hasAccess === null) {
        return (<div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading partner panel...
      </div>);
    }
    if (!user) {
        return null;
    }
    if (!hasAccess) {
        return (<div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>Partner access required</CardTitle>
            <CardDescription>Your account does not have partner permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Ask an administrator to assign a partner store to your account.
            </p>
            <Button variant="outline" onClick={logout}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>);
    }
    return (<div className="min-h-screen bg-muted/20 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Partner Store Panel</h1>
          <p className="text-sm text-muted-foreground">
            Track referral performance and manage partner products.
          </p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
            <CardDescription>Basic details for the assigned partner store.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            {storeError ? (<p className="text-destructive">{storeError}</p>) : store ? (<>
                <div className="flex items-center justify-between">
                  <span>Name</span>
                  <span className="font-medium">{store.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="capitalize">{store.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Default Commission</span>
                  <span>{store.defaultCommissionRate}%</span>
                </div>
                {store.website && (<div className="flex items-center justify-between">
                    <span>Website</span>
                    <span className="truncate">{store.website}</span>
                  </div>)}
              </>) : (<p className="text-muted-foreground">No store data available.</p>)}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Referral Activity</CardTitle>
              <CardDescription>Summary for this partner store.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Clicks</span>
                <span className="font-medium">{analytics?.clicks ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sales</span>
                <span className="font-medium">{analytics?.sales ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revenue</span>
                <span className="font-medium">${(analytics?.revenue ?? 0).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Earned Commission</span>
                <span className="font-medium">${(analytics?.earnedCommission ?? 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Quick Notes</CardTitle>
              <CardDescription>Partner products require admin approval.</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Only pending or rejected products can be edited.</p>
              <p>Approved products are visible when the admin enables them.</p>
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
                <Input id="name" value={formState.name} onChange={(event) => setFormState({ ...formState, name: event.target.value })} required/>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formState.description} onChange={(event) => setFormState({ ...formState, description: event.target.value })}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <Input id="price" type="number" min="0" step="0.01" value={formState.price} onChange={(event) => setFormState({ ...formState, price: event.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0" value={formState.stock} onChange={(event) => setFormState({ ...formState, stock: event.target.value })}/>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="image">Main Image URL *</Label>
                <Input id="image" value={formState.image} onChange={(event) => setFormState({ ...formState, image: event.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Input id="category" value={formState.category} onChange={(event) => setFormState({ ...formState, category: event.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Input id="gender" value={formState.gender} onChange={(event) => setFormState({ ...formState, gender: event.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="season">Season *</Label>
                <Input id="season" value={formState.season} onChange={(event) => setFormState({ ...formState, season: event.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="style">Style *</Label>
                <Input id="style" value={formState.style} onChange={(event) => setFormState({ ...formState, style: event.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion *</Label>
                <Input id="occasion" value={formState.occasion} onChange={(event) => setFormState({ ...formState, occasion: event.target.value })} required/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sizes">Sizes</Label>
                <Input id="sizes" value={formState.sizes} onChange={(event) => setFormState({ ...formState, sizes: event.target.value })} placeholder="S, M, L"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="colors">Colors</Label>
                <Input id="colors" value={formState.colors} onChange={(event) => setFormState({ ...formState, colors: event.target.value })} placeholder="Black, White"/>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="productUrl">Product URL</Label>
                <Input id="productUrl" value={formState.productUrl} onChange={(event) => setFormState({ ...formState, productUrl: event.target.value })} placeholder="https://partner-store.com/product/123"/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                <Input id="commissionRate" type="number" min="0" max="100" step="0.1" value={formState.commissionRate} onChange={(event) => setFormState({ ...formState, commissionRate: event.target.value })}/>
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
            <CardTitle>Partner Products</CardTitle>
            <CardDescription>Pending products are waiting for admin approval.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (<p className="text-sm text-muted-foreground">Loading products...</p>) : products.length === 0 ? (<p className="text-sm text-muted-foreground">No partner products yet.</p>) : (<Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (<TableRow key={product._id}>
                      <TableCell>{product.productData.name}</TableCell>
                      <TableCell className="capitalize">{product.status}</TableCell>
                      <TableCell>${product.productData.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(product)} disabled={product.status === "approved"}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>))}
                </TableBody>
              </Table>)}
          </CardContent>
        </Card>
      </div>
    </div>);
}
