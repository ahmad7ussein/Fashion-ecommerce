"use client";
import { useEffect, useState } from "react";
import { featureControlsApi } from "@/lib/api/featureControls";
import { useAuth } from "@/lib/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
export default function VirtualExperienceControlPage() {
    const { user } = useAuth();
    const [settings, setSettings] = useState(null);
    const [message, setMessage] = useState(null);
    const loadSettings = async () => {
        const data = await featureControlsApi.getVirtualExperienceSettings();
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
    return (<div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Virtual Clothing Experience Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.enabled} onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}/>
            Enable feature
          </label>
          <Textarea placeholder="Supported product IDs (comma separated)" value={settings.supportedProductIds.join(", ")} onChange={(event) => setSettings({
            ...settings,
            supportedProductIds: event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        })}/>
          <Textarea placeholder="Supported categories (comma separated)" value={settings.supportedCategories.join(", ")} onChange={(event) => setSettings({
            ...settings,
            supportedCategories: event.target.value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
        })}/>
          <div className="text-sm">
            <div>Usage count: {settings.usageCount}</div>
            <div>Conversion count: {settings.conversionCount}</div>
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>);
}
