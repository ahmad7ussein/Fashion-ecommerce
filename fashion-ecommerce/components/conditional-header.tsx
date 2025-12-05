"use client"

import { usePathname } from "next/navigation"
import { ProfessionalNavbar } from "./professional-navbar"

export function ConditionalHeader() {
  const pathname = usePathname()

  // Hide header on login, signup, home, admin, employee, and order-success pages
  const hideHeader = 
    pathname === "/login" || 
    pathname === "/signup" || 
    pathname === "/" ||
    pathname === "/order-success" ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/employee")

  if (hideHeader) {
    return null
  }

  return <ProfessionalNavbar />
}
