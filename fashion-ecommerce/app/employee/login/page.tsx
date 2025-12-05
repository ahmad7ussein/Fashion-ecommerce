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
import { Briefcase, Lock } from "lucide-react"
import { Logo } from "@/components/logo"

export default function EmployeeLoginPage() {
  const [employeeId, setEmployeeId] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate employee ID format (6 digits)
    if (!/^\d{6}$/.test(employeeId)) {
      toast({
        title: "Invalid Employee ID",
        description: "Employee ID must be 6 digits",
        variant: "destructive",
      })
      setIsLoading(false)
      return
    }

    try {
      await login(employeeId, password)
      toast({
        title: "Employee Login Successful",
        description: "Welcome to the employee dashboard!",
      })
      setTimeout(() => {
        router.push("/employee")
      }, 1000)
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid employee credentials",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Logo className="mx-auto" />
          </Link>
          <div className="flex items-center justify-center gap-2 text-white mb-2">
            <Briefcase className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Employee Portal</h1>
          </div>
          <p className="text-blue-200">Access for team members</p>
        </div>

        <Card className="border-blue-700 bg-blue-800/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Employee Login</CardTitle>
            <CardDescription className="text-blue-200">
              Enter your 6-digit employee ID and password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="employeeId" className="text-white">Employee ID</Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="123456"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  maxLength={6}
                  required
                  className="bg-blue-700 border-blue-600 text-white placeholder:text-blue-300"
                />
                <p className="text-xs text-blue-300 mt-1">6-digit employee identification number</p>
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
                  className="bg-blue-700 border-blue-600 text-white placeholder:text-blue-300"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-indigo-600 hover:bg-indigo-700" 
                disabled={isLoading}
              >
                <Lock className="mr-2 h-4 w-4" />
                {isLoading ? "Authenticating..." : "Login as Employee"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-blue-200">
                Not an employee?{" "}
                <Link href="/login" className="text-blue-300 hover:text-blue-200 font-medium">
                  Customer Login
                </Link>
              </p>
              <p className="text-sm text-blue-200 mt-2">
                <Link href="/admin/login" className="text-purple-300 hover:text-purple-200 font-medium">
                  Admin Login
                </Link>
              </p>
            </div>

            <div className="mt-6 p-3 bg-blue-700/50 rounded-lg">
              <p className="text-xs text-blue-200 font-semibold mb-1">Demo Credentials:</p>
              <p className="text-xs text-blue-300">ID: 123456</p>
              <p className="text-xs text-blue-300">Password: Employee@123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

