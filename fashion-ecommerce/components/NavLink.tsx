"use client"

import type { ComponentProps } from "react"
import { forwardRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavLinkCompatProps extends Omit<ComponentProps<typeof Link>, "className"> {
  className?: string
  activeClassName?: string
  pendingClassName?: string
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, href, ...props }, ref) => {
    const pathname = usePathname()
    const target = typeof href === "string" ? href : href.pathname || ""
    const isActive = pathname === target
    void pendingClassName

    return (
      <Link ref={ref} href={href} className={cn(className, isActive && activeClassName)} {...props} />
    )
  },
)

NavLink.displayName = "NavLink"

export { NavLink }
