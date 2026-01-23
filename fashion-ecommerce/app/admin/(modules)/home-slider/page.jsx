"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { featureControlsApi } from "@/lib/api/featureControls";
import { sanitizeExternalUrl } from "@/lib/api";

const buildEmptySlide = (order) => ({
  image: "",
  title: "",
  subtitle: "",
  description: "",
  buttonText: "",
  buttonLink: "",
  bgGradient: "",
  bgImage: "",
  isActive: true,
  order,
});

const defaultSlides = [
  {
    image: "/white-t-shirt-model.png",
    title: "New Collection 2025",
    subtitle: "Discover the latest fashion trends",
    description: "Premium quality clothing that defines your style",
    buttonText: "Shop Now",
    buttonLink: "/products",
    bgGradient: "linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #ffe4e6 100%)",
    bgImage: "/white-t-shirt-model.png",
    isActive: true,
    order: 0,
  },
  {
    image: "/black-hoodie-streetwear.png",
    title: "Streetwear Essentials",
    subtitle: "Urban style meets comfort",
    description: "Express yourself with our premium streetwear collection",
    buttonText: "Explore Collection",
    buttonLink: "/products?category=Hoodies",
    bgGradient: "linear-gradient(135deg, #fffbeb 0%, #fff7ed 50%, #fef3c7 100%)",
    bgImage: "/black-hoodie-streetwear.png",
    isActive: true,
    order: 1,
  },
  {
    image: "/gray-sweatshirt-casual.jpg",
    title: "Casual Comfort",
    subtitle: "Everyday elegance",
    description: "Perfect blend of style and comfort for your daily wear",
    buttonText: "Shop Casual",
    buttonLink: "/products?category=Sweatshirts",
    bgGradient: "linear-gradient(135deg, #eff6ff 0%, #eef2ff 50%, #dbeafe 100%)",
    bgImage: "/gray-sweatshirt-casual.jpg",
    isActive: true,
    order: 2,
  },
  {
    image: "/graphic-t-shirt-fashion.jpg",
    title: "Designer Collection",
    subtitle: "Unique designs for unique you",
    description: "Stand out with our exclusive designer pieces",
    buttonText: "View Collection",
    buttonLink: "/products?category=T-Shirts",
    bgGradient: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #f3e8ff 100%)",
    bgImage: "/graphic-t-shirt-fashion.jpg",
    isActive: true,
    order: 3,
  },
];

export default function HomeSliderSettingsPage() {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [message, setMessage] = useState("");
  const [editingSlideIndex, setEditingSlideIndex] = useState(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await featureControlsApi.getHomeSliderSettings();
        const loaded = Array.isArray(data?.slides) ? data.slides : [];
        setSlides(loaded.length ? loaded : defaultSlides);
      } catch (error) {
        setMessage(error?.message || "Failed to load slider settings.");
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const updateSlide = (index, key, value) => {
    setSlides((prev) =>
      prev.map((slide, slideIndex) =>
        slideIndex === index ? { ...slide, [key]: value } : slide
      )
    );
  };

  const addSlide = () => {
    setSlides((prev) => {
      const next = [...prev, buildEmptySlide(prev.length)];
      setEditingSlideIndex(next.length - 1);
      return next;
    });
  };

  const removeSlide = (index) => {
    setSlides((prev) => prev.filter((_, slideIndex) => slideIndex !== index));
    setEditingSlideIndex((current) => {
      if (current === null) return null;
      if (current === index) return null;
      return current > index ? current - 1 : current;
    });
  };

  const handleImageUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setUploadingIndex(index);
    setMessage("");
    try {
      const data = await featureControlsApi.uploadHomeSliderImage(file);
      const url = data?.url || data?.data?.url;
      if (!url) {
        throw new Error("Upload failed.");
      }
      updateSlide(index, "image", url);
    } catch (error) {
      setMessage(error?.message || "Failed to upload image.");
    } finally {
      setUploadingIndex(null);
      event.target.value = "";
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");
    try {
      const payload = {
        slides: slides.map((slide, index) => ({
          ...slide,
          order: Number.isFinite(slide.order) ? slide.order : index,
        })),
      };
      const data = await featureControlsApi.updateHomeSliderSettings(payload);
      setSlides(Array.isArray(data?.slides) ? data.slides : []);
      setMessage("Slider settings saved.");
    } catch (error) {
      setMessage(error?.message || "Failed to save slider settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading slider settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Home Slider</h1>
        <p className="text-muted-foreground">
          Manage the images and content displayed on the homepage hero slider.
        </p>
      </div>

      {message && (
        <div className="text-sm font-medium text-foreground">{message}</div>
      )}

      <div className="space-y-4">
        {slides.length === 0 && (
          <div className="text-sm text-muted-foreground">
            No slides yet. Add one to get started.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((slide, index) => (
            <Card key={`slide-${index}`} className="overflow-hidden">
              <div className="relative aspect-[4/3] w-full bg-muted">
                {slide.image ? (
                  <Image src={sanitizeExternalUrl(slide.image || "") || "/placeholder-logo.png"} alt={`Slide ${index + 1}`} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <CardContent className="space-y-3 pt-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{slide.title || `Slide ${index + 1}`}</p>
                  <p className="text-xs text-muted-foreground">{slide.subtitle || "No subtitle"}</p>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={slide.isActive === false ? "text-muted-foreground" : "text-emerald-600"}>
                    {slide.isActive === false ? "Inactive" : "Active"}
                  </span>
                  <span className="text-muted-foreground">Order: {Number.isFinite(slide.order) ? slide.order : index}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditingSlideIndex(index)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => removeSlide(index)}>
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={addSlide}>
          Add Slide
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      {editingSlideIndex !== null && slides[editingSlideIndex] && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Edit Slide {editingSlideIndex + 1}</CardTitle>
            <CardDescription>Update the content and visuals.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Slide Image
              </label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  value={slides[editingSlideIndex]?.image || ""}
                  onChange={(event) => updateSlide(editingSlideIndex, "image", event.target.value)}
                  placeholder="Paste an image URL or upload"
                  className="flex-1"
                />
                <input
                  id={`slide-upload-${editingSlideIndex}`}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => handleImageUpload(editingSlideIndex, event)}
                  disabled={uploadingIndex === editingSlideIndex}
                />
                <label
                  htmlFor={`slide-upload-${editingSlideIndex}`}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingIndex === editingSlideIndex ? "Uploading..." : "Upload"}
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a file from your device (Cloudinary) or paste a URL.
              </p>
            </div>

            {slides[editingSlideIndex]?.image && (
              <div className="relative h-48 w-full overflow-hidden rounded-lg border border-border md:col-span-2">
                <Image src={sanitizeExternalUrl(slides[editingSlideIndex].image || "") || "/placeholder-logo.png"} alt={`Slide ${editingSlideIndex + 1}`} fill className="object-cover" />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Title
              </label>
              <Input
                value={slides[editingSlideIndex]?.title || ""}
                onChange={(event) => updateSlide(editingSlideIndex, "title", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Subtitle
              </label>
              <Input
                value={slides[editingSlideIndex]?.subtitle || ""}
                onChange={(event) => updateSlide(editingSlideIndex, "subtitle", event.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Description
              </label>
              <Textarea
                value={slides[editingSlideIndex]?.description || ""}
                onChange={(event) => updateSlide(editingSlideIndex, "description", event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Button Text
              </label>
              <Input
                value={slides[editingSlideIndex]?.buttonText || ""}
                onChange={(event) => updateSlide(editingSlideIndex, "buttonText", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Button Link
              </label>
              <Input
                value={slides[editingSlideIndex]?.buttonLink || ""}
                onChange={(event) => updateSlide(editingSlideIndex, "buttonLink", event.target.value)}
                placeholder="/products"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Background Gradient
              </label>
              <Input
                value={slides[editingSlideIndex]?.bgGradient || ""}
                onChange={(event) => updateSlide(editingSlideIndex, "bgGradient", event.target.value)}
                placeholder="linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #ffe4e6 100%)"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Background Image URL
              </label>
              <Input
                value={slides[editingSlideIndex]?.bgImage || ""}
                onChange={(event) => updateSlide(editingSlideIndex, "bgImage", event.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between gap-4 md:col-span-2">
              <label className="text-sm font-medium text-foreground">
                Active
              </label>
              <input
                type="checkbox"
                checked={slides[editingSlideIndex]?.isActive !== false}
                onChange={(event) => updateSlide(editingSlideIndex, "isActive", event.target.checked)}
              />
            </div>

            <div className="flex justify-end md:col-span-2">
              <Button variant="outline" onClick={() => setEditingSlideIndex(null)}>
                Close Editor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
