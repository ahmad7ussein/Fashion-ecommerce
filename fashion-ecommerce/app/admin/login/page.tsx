"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { Shield, Lock } from "lucide-react"
import { Logo } from "@/components/logo"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate email format
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      await login(email, password)
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the admin dashboard!",
      })
      setTimeout(() => {
        router.push("/admin")
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid admin credentials",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Logo className="mx-auto" />
          </Link>
          <div className="flex items-center justify-center gap-2 text-white mb-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
          </div>
          <p className="text-slate-300">Secure access for administrators</p>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Admin Login</CardTitle>
            <CardDescription className="text-slate-300">
              Enter your admin email and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@fashionhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
                <p className="text-xs text-slate-400 mt-1">Enter your admin email address</p>
              </div>

              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                disabled={isLoading}
              >
                <Lock className="mr-2 h-4 w-4" />
                {isLoading ? "Authenticating..." : "Login as Admin"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Not an admin?{" "}
                <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                  Customer Login
                </Link>
              </p>
              <p className="text-sm text-slate-400 mt-2">
                <Link href="/employee/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Employee Login
                </Link>
              </p>
            </div>

            <div className="mt-6 p-3 bg-slate-700/50 rounded-lg">
              <p className="text-xs text-slate-300 font-semibold mb-1">Admin Credentials:</p>
              <p className="text-xs text-slate-400">Email: admin@fashionhub.com</p>
              <p className="text-xs text-slate-400">Password: Admin@123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

