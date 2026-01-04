"use client";
import { useEffect, useState } from "react";
import { featureControlsApi } from "@/lib/api/featureControls";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function SimilarProductsControlPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState(null);
    const [message, setMessage] = useState(null);
    const loadSettings = async () => {
        const data = await featureControlsApi.getSimilarProductsSettings();
        setSettings(data);
    };
    useEffect(() => {
        loadSettings();
    }, []);
    if (!user || user.role !== "admin") {
        return <div className="p-6">Access restricted.</div>;
    }
    const handleSave = async () => {
        if (!settings)
            return;
        setMessage(null);
        try {
            const data = await featureControlsApi.updateSimilarProductsSettings(settings);
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
    return (<div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Similar Products Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}/>
            Enable feature
          </label>
          <Input type="number" placeholder="Number of items" value={settings.maxItems} onChange={(event) => setSettings({ ...settings, maxItems: Number(event.target.value) })}/>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.prioritizeInStore} onChange={(event) => setSettings({ ...settings, prioritizeInStore: event.target.checked })}/>
            Prioritize in-store products
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.prioritizePartner} onChange={(event) => setSettings({ ...settings, prioritizePartner: event.target.checked })}/>
            Prioritize partner store products
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.autoWhenNoPurchase} onChange={(event) => setSettings({ ...settings, autoWhenNoPurchase: event.target.checked })}/>
            Auto-activate when no purchase is made
          </label>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>);
}
