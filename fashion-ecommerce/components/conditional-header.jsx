"use client";
import { usePathname } from "next/navigation";
import { ProfessionalNavbar } from "./professional-navbar";
export function ConditionalHeader() {
    const pathname = usePathname();
    const hideHeader = pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password" ||
        pathname === "/" ||
        pathname === "/order-success" ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/employee");
    if (hideHeader) {
        return null;
    }
    return <ProfessionalNavbar />;
}
