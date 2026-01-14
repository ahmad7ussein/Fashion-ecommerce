"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { featureControlsApi } from "@/lib/api/featureControls";

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

export default function HomeSliderSettingsPage() {
  const [slides, setSlides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const data = await featureControlsApi.getHomeSliderSettings();
        setSlides(Array.isArray(data?.slides) ? data.slides : []);
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
    setSlides((prev) => [...prev, buildEmptySlide(prev.length)]);
  };

  const removeSlide = (index) => {
    setSlides((prev) => prev.filter((_, slideIndex) => slideIndex !== index));
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

        {slides.map((slide, index) => (
          <Card key={`slide-${index}`}>
            <CardHeader>
              <CardTitle>Slide {index + 1}</CardTitle>
              <CardDescription>Update the content and visuals.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Slide Image
                </label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={slide.image || ""}
                    onChange={(event) => updateSlide(index, "image", event.target.value)}
                    placeholder="Paste an image URL or upload"
                    className="flex-1"
                  />
                  <input
                    id={`slide-upload-${index}`}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => handleImageUpload(index, event)}
                    disabled={uploadingIndex === index}
                  />
                  <label
                    htmlFor={`slide-upload-${index}`}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted"
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingIndex === index ? "Uploading..." : "Upload"}
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a file from your device (Cloudinary) or paste a URL.
                </p>
              </div>

              {slide.image && (
                <div className="relative h-48 w-full overflow-hidden rounded-lg border border-border md:col-span-2">
                  <Image src={slide.image} alt={`Slide ${index + 1}`} fill className="object-cover" />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Title
                </label>
                <Input
                  value={slide.title || ""}
                  onChange={(event) => updateSlide(index, "title", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Subtitle
                </label>
                <Input
                  value={slide.subtitle || ""}
                  onChange={(event) => updateSlide(index, "subtitle", event.target.value)}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Description
                </label>
                <Textarea
                  value={slide.description || ""}
                  onChange={(event) => updateSlide(index, "description", event.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Button Text
                </label>
                <Input
                  value={slide.buttonText || ""}
                  onChange={(event) => updateSlide(index, "buttonText", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Button Link
                </label>
                <Input
                  value={slide.buttonLink || ""}
                  onChange={(event) => updateSlide(index, "buttonLink", event.target.value)}
                  placeholder="/products"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Background Gradient
                </label>
                <Input
                  value={slide.bgGradient || ""}
                  onChange={(event) => updateSlide(index, "bgGradient", event.target.value)}
                  placeholder="linear-gradient(135deg, #fff1f2 0%, #fdf2f8 50%, #ffe4e6 100%)"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Background Image URL
                </label>
                <Input
                  value={slide.bgImage || ""}
                  onChange={(event) => updateSlide(index, "bgImage", event.target.value)}
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center justify-between gap-4 md:col-span-2">
                <label className="text-sm font-medium text-foreground">
                  Active
                </label>
                <input
                  type="checkbox"
                  checked={slide.isActive !== false}
                  onChange={(event) => updateSlide(index, "isActive", event.target.checked)}
                />
              </div>

              <div className="flex justify-end md:col-span-2">
                <Button variant="outline" onClick={() => removeSlide(index)}>
                  Remove Slide
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={addSlide}>
          Add Slide
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
