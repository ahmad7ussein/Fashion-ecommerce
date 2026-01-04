"use client";
import { forwardRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
const NavLink = forwardRef(({ className, activeClassName, pendingClassName, href, ...props }, ref) => {
    const pathname = usePathname();
    const target = typeof href === "string" ? href : href.pathname || "";
    const isActive = pathname === target;
    void pendingClassName;
    return (<Link ref={ref} href={href} className={cn(className, isActive && activeClassName)} {...props}/>);
});
NavLink.displayName = "NavLink";
export { NavLink };
