"use client"

import { useEffect, useState } from "react"
import { featureControlsApi, type CustomDesignSettings } from "@/lib/api/featureControls"
import { customDesignRequestsApi, type CustomDesignRequest } from "@/lib/api/customDesignRequests"
import { useAuth } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default function CustomDesignControlPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<CustomDesignSettings | null>(null)
  const [requests, setRequests] = useState<CustomDesignRequest[]>([])
  const [printAreasText, setPrintAreasText] = useState("[]")
  const [message, setMessage] = useState<string | null>(null)

  const loadData = async () => {
    const settingsData = await featureControlsApi.getCustomDesignSettings()
    const requestsData = await customDesignRequestsApi.getRequests()
    setSettings(settingsData)
    setRequests(requestsData)
    setPrintAreasText(JSON.stringify(settingsData.printAreas || [], null, 2))
  }

  useEffect(() => {
    loadData()
  }, [])

  if (!user || user.role !== "admin") {
    return <div className="p-6">Access restricted.</div>
  }

  const handleSave = async () => {
    if (!settings) return
    setMessage(null)
    try {
      const parsedAreas = JSON.parse(printAreasText || "[]")
      const data = await featureControlsApi.updateCustomDesignSettings({
        ...settings,
        printAreas: parsedAreas,
      })
      setSettings(data)
      setMessage("Settings saved.")
    } catch (error: any) {
      setMessage(error?.message || "Invalid print areas JSON")
    }
  }

  const updateRequest = async (id: string, status: "approved" | "rejected") => {
    await customDesignRequestsApi.updateRequestStatus(id, { status })
    await loadData()
  }

  if (!settings) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Custom Design Control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && <div className="text-sm text-muted-foreground">{message}</div>}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => setSettings({ ...settings, enabled: event.target.checked })}
            />
            Enable customization
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.allowText}
              onChange={(event) => setSettings({ ...settings, allowText: event.target.checked })}
            />
            Allow text
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.allowImages}
              onChange={(event) => setSettings({ ...settings, allowImages: event.target.checked })}
            />
            Allow images
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.requireApproval}
              onChange={(event) => setSettings({ ...settings, requireApproval: event.target.checked })}
            />
            Require admin approval
          </label>
          <Input
            type="number"
            placeholder="Max text length"
            value={settings.maxTextLength}
            onChange={(event) => setSettings({ ...settings, maxTextLength: Number(event.target.value) })}
          />
          <Textarea
            placeholder="Allowed fonts (comma separated)"
            value={settings.allowedFonts.join(", ")}
            onChange={(event) =>
              setSettings({
                ...settings,
                allowedFonts: event.target.value
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              })
            }
          />
          <Textarea
            placeholder="Print areas JSON"
            value={printAreasText}
            onChange={(event) => setPrintAreasText(event.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              placeholder="Extra price (text)"
              value={settings.additionalPrices.text}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  additionalPrices: { ...settings.additionalPrices, text: Number(event.target.value) },
                })
              }
            />
            <Input
              type="number"
              placeholder="Extra price (image)"
              value={settings.additionalPrices.image}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  additionalPrices: { ...settings.additionalPrices, image: Number(event.target.value) },
                })
              }
            />
            <Input
              type="number"
              placeholder="Extra price (size)"
              value={settings.additionalPrices.size}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  additionalPrices: { ...settings.additionalPrices, size: Number(event.target.value) },
                })
              }
            />
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customization Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Design</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>{request.designName}</TableCell>
                  <TableCell>{request.status}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateRequest(request._id, "approved")}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateRequest(request._id, "rejected")}>
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
