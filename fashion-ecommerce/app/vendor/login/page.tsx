"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth"
import { roleAssignmentsApi } from "@/lib/api/roleAssignments"

export default function VendorLoginPage() {
  const [identifier, setIdentifier] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { login, logout } = useAuth()
  const router = useRouter()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      await login(identifier, password)
      const assignments = await roleAssignmentsApi.getMyAssignments()
      const hasAccess = assignments.some(
        (assignment) => assignment.role === "service_provider" && assignment.status === "active"
      )

      if (!hasAccess) {
        logout()
        toast({
          title: "Access denied",
          description: "Your account is not assigned to the vendor role.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Login successful",
        description: "Welcome to the vendor panel.",
      })
      router.push("/vendor")
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Vendor Login</CardTitle>
          <CardDescription>Use your account credentials to access vendor tools.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email or User ID</Label>
              <Input
                id="identifier"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <p>Vendor access must be approved by an administrator.</p>
            <div className="flex gap-4">
              <Link href="/login" className="text-primary hover:underline">
                Customer Login
              </Link>
              <Link href="/admin/login" className="text-primary hover:underline">
                Admin Login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
