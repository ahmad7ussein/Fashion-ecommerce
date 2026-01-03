"use client"

import React from "react"
import { authApi, type UserResponse } from "@/lib/api/auth"
import logger from "@/lib/logger"

export type UserRole = "customer" | "employee" | "admin"
export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
  employeeId?: string
  adminId?: string
}

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (identifier: string, password: string) => Promise<User>
  register: (userData: { firstName: string; lastName: string; email: string; password: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const TOKEN_KEY = "auth_token"

const AuthContext = React.createContext<AuthContextValue | null>(null)

function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
    logger.log("💾 Token saved to localStorage")
  } else {
    localStorage.removeItem(TOKEN_KEY)
    logger.log("🗑️ Token removed from localStorage")
  }
}

function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const hasCheckedAuth = React.useRef(false)

  
  React.useEffect(() => {
    
    if (hasCheckedAuth.current) {
      return
    }
    hasCheckedAuth.current = true

    const token = getToken()

    if (token) {
      
      authApi
        .getMe()
        .then((userData) => {
          if (!userData) {
            logger.warn("⚠️ getMe returned null/undefined")
            setUser(null)
            setToken(null)
            return
          }
          
          const newUser: User = {
            id: (userData as any)._id || (userData as any).id || '',
            name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
            email: userData.email,
            role: userData.role,
            firstName: userData.firstName,
            lastName: userData.lastName,
            employeeId: (userData as any).employeeId,
            adminId: (userData as any).adminId,
          }
          logger.log("✅ User loaded from database:", newUser)
          setUser(newUser)
        })
        .catch((error: any) => {
          
          logger.warn("⚠️ Failed to get user from database:", error?.message || "Unknown error")
          setUser(null)
          setToken(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (identifier: string, password: string): Promise<User> => {
    try {
      const response = await authApi.login(identifier, password)
      
      logger.log("🔍 Login API Response:", response)
      
      
      const userData: User = {
        id: (response.user?.id || (response.user as any)?._id || "").toString(),
        name: `${response.user?.firstName || ""} ${response.user?.lastName || ""}`,
        email: response.user?.email || "",
        role: response.user?.role || "customer",
        firstName: response.user?.firstName,
        lastName: response.user?.lastName,
      }
      
      logger.log("🔍 Parsed User Data:", userData)
      
      if (response.token) {
        setToken(response.token)
      }
      setUser(userData)
      
      logger.log("✅ User state updated:", userData)
      logger.log("✅ Token saved:", !!response.token)
      logger.log("✅ User role:", userData.role)
      
      return userData
    } catch (error: any) {
      
      console.error("=".repeat(50))
      console.error("❌ LOGIN ERROR - Full Details")
      console.error("=".repeat(50))
      
      const errorDetails: any = {
        message: error?.message || "Unknown error",
        name: error?.name || "Error",
        type: error?.constructor?.name || typeof error,
      }
      
      
      if (error?.status) {
        errorDetails.status = error.status
      }
      
      
      if (error?.stack) {
        errorDetails.stack = error.stack
      }
      
      
      console.error("Error Message:", errorDetails.message)
      console.error("Error Name:", errorDetails.name)
      console.error("Error Type:", errorDetails.type)
      if (errorDetails.status) {
        console.error("HTTP Status:", errorDetails.status)
      }
      if (errorDetails.stack) {
        console.error("Stack Trace:", errorDetails.stack)
      }
      console.error("Full Error Object:", error)
      console.error("=".repeat(50))
      
      
      logger.error("❌ Login Error:", error)
      console.error("Login Error Details:", errorDetails)
      
      throw new Error(error?.message || "Login failed")
    }
  }

  const register = async (userData: { firstName: string; lastName: string; email: string; password: string }) => {
    try {
      logger.log("Registering user:", { ...userData, password: "***" })
      const response = await authApi.register(userData)
      logger.log("Registration response:", response)
      
      if (!response || !response.user) {
        throw new Error("Invalid response from server")
      }

      const userDataFormatted: User = {
        id: response.user.id?.toString() || response.user._id?.toString() || "",
        name: `${response.user.firstName} ${response.user.lastName}`,
        email: response.user.email,
        role: response.user.role,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
      }
      
      if (response.token) {
        setToken(response.token)
      } else {
        logger.warn("No token received from registration")
      }
      
      setUser(userDataFormatted)
    } catch (error: any) {
      logger.error("Registration error in auth.tsx:", error)
      
      
      let errorMessage = "Registration failed. Please try again."
      
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === "string") {
        errorMessage = error
      }
      
      throw new Error(errorMessage)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
  }

  const refreshUser = async () => {
    try {
      const userData = await authApi.getMe()
      const newUser: User = {
        id: userData._id,
        name: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        employeeId: userData.employeeId,
        adminId: userData.adminId,
      }
      setUser(newUser)
    } catch (error) {
      
      logout()
    }
  }

  const isAuthenticated = !!user
  const value: AuthContextValue = { user, isLoading, isAuthenticated, login, register, logout, refreshUser }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}


