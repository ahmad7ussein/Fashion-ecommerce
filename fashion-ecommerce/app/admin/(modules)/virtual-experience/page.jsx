"use client";
import { useEffect, useMemo, useState } from "react";
import { featureControlsApi } from "@/lib/api/featureControls";
import { productsAdminApi } from "@/lib/api/productsAdmin";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function VirtualExperienceControlPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState(null);
    const [message, setMessage] = useState(null);
    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const loadSettings = async () => {
        const data = await featureControlsApi.getVirtualExperienceSettings();
        setSettings(data);
    };
    useEffect(() => {
        loadSettings();
    }, []);
    useEffect(() => {
        const loadProducts = async () => {
            setProductsLoading(true);
            try {
                const response = await productsAdminApi.getAllProducts({ limit: 1000 });
                setProducts(response.data || []);
            }
            catch (error) {
                setMessage(error?.message || "Failed to load products");
            }
            finally {
                setProductsLoading(false);
            }
        };
        loadProducts();
    }, []);
    if (!user || user.role !== "admin") {
        return <div className="p-6">Access restricted.</div>;
    }
    const handleSave = async () => {
        if (!settings)
            return;
        setMessage(null);
        try {
            const data = await featureControlsApi.updateVirtualExperienceSettings(settings);
            setSettings(data);
            setMessage("Settings saved.");
        }
        catch (error) {
            setMessage(error?.message || "Failed to save settings");
        }
    };
    if (!settings) {
        return <div className="p-6">Loading...</div>;
    }
    const supportedIds = Array.isArray(settings.supportedProductIds)
        ? settings.supportedProductIds
        : [];
    const supportedProducts = useMemo(() => {
        return supportedIds.map((id) => {
            const match = products.find((product) => String(product._id || product.id) === String(id));
            return match || { _id: id, name: id };
        });
    }, [products, supportedIds]);
    const availableProducts = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const filtered = query
            ? products.filter((product) => {
                const name = (product.name || "").toLowerCase();
                const category = (product.category || "").toLowerCase();
                return name.includes(query) || category.includes(query);
            })
            : products;
        return filtered.filter((product) => !supportedIds.includes(String(product._id || product.id)));
    }, [products, searchQuery, supportedIds]);
    const handleAddProduct = () => {
        if (!selectedProductId)
            return;
        if (supportedIds.includes(selectedProductId))
            return;
        setSettings({ ...settings, supportedProductIds: [...supportedIds, selectedProductId] });
        setSelectedProductId("");
    };
    const handleRemoveProduct = (productId) => {
        setSettings({
            ...settings,
            supportedProductIds: supportedIds.filter((id) => String(id) !== String(productId)),
        });
    };
    return (<div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Virtual Try-On Products</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">Search products</label>
              <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search by name or category"/>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-foreground">Select product</label>
              <select value={selectedProductId} onChange={(event) => setSelectedProductId(event.target.value)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                <option value="">{productsLoading ? "Loading products..." : "Choose a product"}</option>
                {availableProducts.map((product) => (<option key={product._id || product.id} value={String(product._id || product.id)}>
                    {product.name} ({product.category || "Uncategorized"})
                  </option>))}
              </select>
            </div>
            <Button onClick={handleAddProduct} disabled={!selectedProductId}>
              Add Product
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {supportedProducts.length === 0 && (<div className="text-sm text-muted-foreground">
                No products added yet.
              </div>)}
            {supportedProducts.map((product) => {
            const imageUrl = product.image || product.images?.[0] || "/placeholder-logo.png";
            return (<Card key={product._id || product.id} className="overflow-hidden">
                  <div className="relative aspect-[4/3] w-full bg-muted">
                    <img src={imageUrl} alt={product.name || "Product"} className="h-full w-full object-cover"/>
                  </div>
                  <CardContent className="space-y-2 pt-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{product.name || "Product"}</p>
                      <p className="text-xs text-muted-foreground">{product.category || "Uncategorized"}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => handleRemoveProduct(product._id || product.id)}>
                      Remove
                    </Button>
                  </CardContent>
                </Card>);
        })}
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>);
}
