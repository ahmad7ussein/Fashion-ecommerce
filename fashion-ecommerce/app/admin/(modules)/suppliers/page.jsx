"use client";
import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { suppliersApi } from "@/lib/api/suppliers";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
const emptySupplier = {
    name: "",
    contactEmail: "",
    contactPhone: "",
    commissionRate: "",
    deliveryTime: "",
    returnPolicy: "",
    ratingAverage: "",
    ratingCount: "",
};
const emptySupplierProduct = {
    supplierId: "",
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
};
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
];
const genderOptions = ["Men", "Women", "Kids", "Unisex"];
const seasonOptions = ["Spring", "Summer", "Fall", "Winter", "All Seasons"];
const styleOptions = ["Casual", "Formal", "Sport", "Streetwear", "Classic", "Minimal"];
const occasionOptions = ["Daily", "Work", "Party", "Sport", "Travel", "Outdoor"];
const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
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
];
export default function SupplierManagementPage() {
    const { user } = useAuth();
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [supplierForm, setSupplierForm] = useState({ ...emptySupplier });
    const [productForm, setProductForm] = useState({ ...emptySupplierProduct });
    const [uploadedImage, setUploadedImage] = useState("");
    const [uploadedImageName, setUploadedImageName] = useState("");
    const [editingSupplierId, setEditingSupplierId] = useState(null);
    const [analytics, setAnalytics] = useState(null);
    const [analyticsSupplierId, setAnalyticsSupplierId] = useState(null);
    const [message, setMessage] = useState(null);
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (!file.type.startsWith("image/")) {
            setMessage("File must be an image.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage("Image size must be less than 5MB.");
            return;
        }
        try {
            const base64 = await fileToBase64(file);
            setUploadedImage(base64);
            setUploadedImageName(file.name);
            setMessage(null);
        }
        catch (error) {
            setMessage(error?.message || "Failed to upload image.");
        }
    };
    const loadSuppliers = async () => {
        const data = await suppliersApi.getSuppliers();
        setSuppliers(data);
    };
    const loadProducts = async () => {
        const data = await suppliersApi.getSupplierProducts();
        setProducts(data);
    };
    useEffect(() => {
        loadSuppliers();
        loadProducts();
    }, []);
    if (!user || user.role !== "admin") {
        return <div className="p-6">Access restricted.</div>;
    }
    const handleSupplierSubmit = async () => {
        setMessage(null);
        try {
            const payload = {
                ...supplierForm,
                commissionRate: Number(supplierForm.commissionRate) || 0,
                ratingAverage: Number(supplierForm.ratingAverage) || 0,
                ratingCount: Number(supplierForm.ratingCount) || 0,
            };
            if (editingSupplierId) {
                await suppliersApi.updateSupplier(editingSupplierId, payload);
            }
            else {
                await suppliersApi.createSupplier(payload);
            }
            setSupplierForm({ ...emptySupplier });
            setEditingSupplierId(null);
            await loadSuppliers();
            setMessage("Supplier saved.");
        }
        catch (error) {
            setMessage(error?.message || "Failed to save supplier");
        }
    };
    const handleSupplierEdit = (supplier) => {
        setEditingSupplierId(supplier._id);
        setSupplierForm({
            name: supplier.name,
            contactEmail: supplier.contactEmail || "",
            contactPhone: supplier.contactPhone || "",
            commissionRate: (supplier.commissionRate ?? "").toString(),
            deliveryTime: supplier.deliveryTime || "",
            returnPolicy: supplier.returnPolicy || "",
            ratingAverage: (supplier.ratingAverage ?? "").toString(),
            ratingCount: (supplier.ratingCount ?? "").toString(),
        });
    };
    const handleSupplierStatus = async (supplier) => {
        const nextStatus = supplier.status === "active" ? "disabled" : "active";
        await suppliersApi.updateSupplierStatus(supplier._id, nextStatus);
        await loadSuppliers();
    };
    const handleAnalytics = async (supplierId) => {
        const data = await suppliersApi.getSupplierAnalytics(supplierId);
        setAnalytics(data);
        setAnalyticsSupplierId(supplierId);
    };
    const handleProductSubmit = async () => {
        setMessage(null);
        if (!productForm.supplierId) {
            setMessage("Select a supplier for the product.");
            return;
        }
        if (!uploadedImage && !productForm.image) {
            setMessage("Please provide an image URL or upload an image.");
            return;
        }
        const payload = {
            supplierId: productForm.supplierId,
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
            },
        };
        try {
            await suppliersApi.createSupplierProduct(payload);
            setProductForm({ ...emptySupplierProduct });
            setUploadedImage("");
            setUploadedImageName("");
            await loadProducts();
            setMessage("Supplier product submitted.");
        }
        catch (error) {
            setMessage(error?.message || "Failed to submit product");
        }
    };
    const handleApprove = async (id) => {
        await suppliersApi.approveSupplierProduct(id);
        await loadProducts();
    };
    const handleReject = async (id) => {
        await suppliersApi.rejectSupplierProduct(id);
        await loadProducts();
    };
    return (<div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supplier Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Supplier name" value={supplierForm.name} onChange={(event) => setSupplierForm({ ...supplierForm, name: event.target.value })}/>
            <Input placeholder="Contact email" value={supplierForm.contactEmail} onChange={(event) => setSupplierForm({ ...supplierForm, contactEmail: event.target.value })}/>
            <Input placeholder="Contact phone" value={supplierForm.contactPhone} onChange={(event) => setSupplierForm({ ...supplierForm, contactPhone: event.target.value })}/>
            <Input type="number" placeholder="Commission rate (%)" value={supplierForm.commissionRate} onChange={(event) => setSupplierForm({ ...supplierForm, commissionRate: event.target.value })}/>
            <Input placeholder="Delivery time" value={supplierForm.deliveryTime} onChange={(event) => setSupplierForm({ ...supplierForm, deliveryTime: event.target.value })}/>
            <Textarea placeholder="Return policy" value={supplierForm.returnPolicy} onChange={(event) => setSupplierForm({ ...supplierForm, returnPolicy: event.target.value })}/>
            <Input type="number" placeholder="Rating average" value={supplierForm.ratingAverage} onChange={(event) => setSupplierForm({ ...supplierForm, ratingAverage: event.target.value })}/>
            <Input type="number" placeholder="Rating count" value={supplierForm.ratingCount} onChange={(event) => setSupplierForm({ ...supplierForm, ratingCount: event.target.value })}/>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSupplierSubmit}>{editingSupplierId ? "Update Supplier" : "Create Supplier"}</Button>
            {editingSupplierId && (<Button variant="outline" onClick={() => {
                setEditingSupplierId(null);
                setSupplierForm({ ...emptySupplier });
            }}>
                Cancel
              </Button>)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
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
              {suppliers.map((supplier) => (<TableRow key={supplier._id}>
                  <TableCell>{supplier.name}</TableCell>
                  <TableCell>{supplier.status}</TableCell>
                  <TableCell>{supplier.commissionRate}%</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleSupplierEdit(supplier)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleSupplierStatus(supplier)}>
                      {supplier.status === "active" ? "Disable" : "Enable"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleAnalytics(supplier._id)}>
                      Analytics
                    </Button>
                  </TableCell>
                </TableRow>))}
            </TableBody>
          </Table>
          {analytics && analyticsSupplierId && (<div className="mt-4 text-sm">
              <div>Supplier: {suppliers.find((s) => s._id === analyticsSupplierId)?.name}</div>
              <div>Total Sales: {analytics.totalSales}</div>
              <div>Revenue: {analytics.revenue}</div>
              <div>Rating: {analytics.ratings.average} ({analytics.ratings.count})</div>
            </div>)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add Supplier Product (Pending)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <select className="h-10 rounded-md border px-3" value={productForm.supplierId} onChange={(event) => setProductForm({ ...productForm, supplierId: event.target.value })}>
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (<option key={supplier._id} value={supplier._id}>
                  {supplier.name}
                </option>))}
            </select>
            <Input placeholder="Product name" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })}/>
            <Input type="number" placeholder="Price" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })}/>
            <div className="space-y-2">
              <div className="relative">
                <Input placeholder="Image URL (optional if uploaded)" value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} className="pr-10"/>
                <input id="supplier-image-upload" type="file" accept="image/*" className="sr-only" onChange={handleImageUpload}/>
                <label htmlFor="supplier-image-upload" className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-foreground" title="Upload image">
                  <Upload className="h-4 w-4"/>
                  <span className="sr-only">Upload image</span>
                </label>
              </div>
              {uploadedImageName && (<div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Using uploaded image: {uploadedImageName}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => {
                setUploadedImage("");
                setUploadedImageName("");
            }}>
                    Remove
                  </Button>
                </div>)}
              {uploadedImage && (<img src={uploadedImage} alt="Uploaded preview" className="h-24 w-24 rounded-md object-cover border"/>)}
            </div>
            <Input placeholder="Category" value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} list="supplier-category-options"/>
            <Input placeholder="Gender" value={productForm.gender} onChange={(event) => setProductForm({ ...productForm, gender: event.target.value })} list="supplier-gender-options"/>
            <Input placeholder="Season" value={productForm.season} onChange={(event) => setProductForm({ ...productForm, season: event.target.value })} list="supplier-season-options"/>
            <Input placeholder="Style" value={productForm.style} onChange={(event) => setProductForm({ ...productForm, style: event.target.value })} list="supplier-style-options"/>
            <Input placeholder="Occasion" value={productForm.occasion} onChange={(event) => setProductForm({ ...productForm, occasion: event.target.value })} list="supplier-occasion-options"/>
            <Input placeholder="Sizes (comma separated)" value={productForm.sizes} onChange={(event) => setProductForm({ ...productForm, sizes: event.target.value })} list="supplier-size-options"/>
            <Input placeholder="Colors (comma separated)" value={productForm.colors} onChange={(event) => setProductForm({ ...productForm, colors: event.target.value })} list="supplier-color-options"/>
            <Input type="number" placeholder="Stock" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })}/>
            <Textarea placeholder="Description" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })}/>
          </div>
          <datalist id="supplier-category-options">
            {categoryOptions.map((option) => (<option key={option} value={option}/>))}
          </datalist>
          <datalist id="supplier-gender-options">
            {genderOptions.map((option) => (<option key={option} value={option}/>))}
          </datalist>
          <datalist id="supplier-season-options">
            {seasonOptions.map((option) => (<option key={option} value={option}/>))}
          </datalist>
          <datalist id="supplier-style-options">
            {styleOptions.map((option) => (<option key={option} value={option}/>))}
          </datalist>
          <datalist id="supplier-occasion-options">
            {occasionOptions.map((option) => (<option key={option} value={option}/>))}
          </datalist>
          <datalist id="supplier-size-options">
            {sizeOptions.map((option) => (<option key={option} value={option}/>))}
          </datalist>
          <datalist id="supplier-color-options">
            {colorOptions.map((option) => (<option key={option} value={option}/>))}
          </datalist>
          <Button onClick={handleProductSubmit}>Submit Product</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Products Review</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (<TableRow key={item._id}>
                  <TableCell>{typeof item.supplier === "string" ? item.supplier : item.supplier.name}</TableCell>
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
                </TableRow>))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>);
}
