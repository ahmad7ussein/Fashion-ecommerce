"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Menu, X, ChevronDown, User, UserCircle2, Package, Settings, LogOut, Languages, Moon, Sun } from "lucide-react"
import { Logo } from "@/components/logo"
import { useCart } from "@/lib/cart"
import { useAuth } from "@/lib/auth"
import { useLanguage } from "@/lib/language"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export function Header() {
  const { items } = useCart()
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  
  useEffect(() => {
    setMounted(true)
  }, [])

  const productCategories = [
    { name: "T-Shirts", href: "/products?category=T-Shirts" },
    { name: "Hoodies", href: "/products?category=Hoodies" },
    { name: "Sweatshirts", href: "/products?category=Sweatshirts" },
    { name: "Jackets", href: "/products?category=Jackets" },
    { name: "Pants", href: "/products?category=Pants" },
    { name: "Shorts", href: "/products?category=Shorts" },
    { name: "Tank Tops", href: "/products?category=Tank Tops" },
    { name: "Polo Shirts", href: "/products?category=Polo Shirts" },
  ]

  const menCategories = productCategories.map((cat) => ({
    ...cat,
    href: `${cat.href}&gender=Men`,
  }))

  const womenCategories = productCategories.map((cat) => ({
    ...cat,
    href: `${cat.href}&gender=Women`,
  }))

  const kidsCategories = productCategories.map((cat) => ({
    ...cat,
    href: `${cat.href}&gender=Kids`,
  }))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          { }
          <Link href="/" className="flex items-center space-x-2">
            <Logo />
          </Link>

          { }
          <nav className="hidden lg:flex items-center gap-2">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold group relative overflow-hidden transition-all hover:bg-accent/80 hover:scale-105">
                    <span className="flex items-center gap-1.5 relative z-10">
                      👔 {t("men")}
                    </span>
                    <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[550px] gap-2 p-4 md:grid-cols-2">
                      {menCategories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="group/item block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-105 focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-primary/30 hover:shadow-md"
                        >
                          <div className="text-sm font-medium leading-none relative z-10">
                            {category.name}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-lg" />
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold group relative overflow-hidden transition-all hover:bg-accent/80 hover:scale-105">
                    <span className="flex items-center gap-1.5 relative z-10">
                      👗 {t("women")}
                    </span>
                    <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[550px] gap-2 p-4 md:grid-cols-2">
                      {womenCategories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="group/item block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-105 focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-primary/30 hover:shadow-md"
                        >
                          <div className="text-sm font-medium leading-none relative z-10">
                            {category.name}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-lg" />
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm font-semibold group relative overflow-hidden transition-all hover:bg-accent/80 hover:scale-105">
                    <span className="flex items-center gap-1.5 relative z-10">
                      👶 {t("kids")}
                    </span>
                    <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[550px] gap-2 p-4 md:grid-cols-2">
                      {kidsCategories.map((category) => (
                        <Link
                          key={category.name}
                          href={category.href}
                          className="group/item block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-primary/10 hover:text-primary hover:scale-105 focus:bg-accent focus:text-accent-foreground border border-transparent hover:border-primary/30 hover:shadow-md"
                        >
                          <div className="text-sm font-medium leading-none relative z-10">
                            {category.name}
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 rounded-lg" />
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/products">
                    <Button variant="ghost" className="text-sm font-semibold group relative overflow-hidden transition-all hover:scale-105">
                      <Package className="mr-1.5 h-4 w-4 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                      <span className="relative z-10">{t("allProducts")}</span>
                      <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </Button>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/new-arrival">
                    <Button variant="ghost" className="text-sm font-semibold group relative overflow-hidden transition-all hover:scale-105">
                      <span className="relative z-10">{language === "ar" ? "وصل جديد" : "New Arrival"}</span>
                      <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </Button>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/collection">
                    <Button variant="ghost" className="text-sm font-semibold group relative overflow-hidden transition-all hover:scale-105">
                      <span className="relative z-10">{language === "ar" ? "المجموعة" : "Collection"}</span>
                      <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </Button>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/studio">
                    <Button variant="ghost" className="text-sm font-semibold group relative overflow-hidden transition-all hover:scale-105">
                      <span className="relative z-10">{t("designStudio")}</span>
                      <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </Button>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/about">
                    <Button variant="ghost" className="text-sm font-semibold group relative overflow-hidden transition-all hover:scale-105">
                      <span className="relative z-10">{language === "ar" ? "من نحن" : "About"}</span>
                      <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </Button>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          { }
          <div className="flex items-center gap-2">
            { }
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group hover:scale-110 transition-all duration-300 text-gray-900 hover:text-rose-600">
                  <Languages className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="sr-only">Change Language</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem 
                  onClick={() => setLanguage("en")}
                  className={language === "en" ? "bg-accent" : ""}
                >
                  🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setLanguage("ar")}
                  className={language === "ar" ? "bg-accent" : ""}
                >
                  🇸🇦 العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            { }
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="relative group hover:scale-110 transition-all duration-300 text-gray-900 hover:text-rose-600"
              title={theme === "dark" ? (language === "ar" ? "الوضع الفاتح" : "Light Mode") : (language === "ar" ? "الوضع الداكن" : "Dark Mode")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              <span className="sr-only">Toggle Theme</span>
            </Button>

            { }
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative group hover:scale-110 transition-all duration-300 text-gray-900 hover:text-rose-600">
                <ShoppingBag className="h-5 w-5 group-hover:animate-bounce" />
                {itemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary animate-pulse">
                    {itemCount > 9 ? "9+" : itemCount}
                  </Badge>
                )}
              </Button>
            </Link>

            { }
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-full group hover:scale-110 transition-all duration-300 hover:ring-2 hover:ring-primary">
                    <Avatar className="h-9 w-9 group-hover:ring-2 group-hover:ring-primary transition-all">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer group/item transition-all hover:bg-primary/10 hover:text-primary">
                      <UserCircle2 className="mr-2 h-4 w-4 group-hover/item:scale-110 transition-transform" />
                      <span>{t("myProfile")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=orders" className="cursor-pointer group/item transition-all hover:bg-primary/10 hover:text-primary">
                      <Package className="mr-2 h-4 w-4 group-hover/item:rotate-12 transition-transform" />
                      <span>{t("myOrders")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile?tab=designs" className="cursor-pointer group/item transition-all hover:bg-primary/10 hover:text-primary">
                      <Settings className="mr-2 h-4 w-4 group-hover/item:rotate-90 transition-transform duration-500" />
                      <span>{t("myDesigns")}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive group/item hover:bg-destructive/10">
                    <LogOut className="mr-2 h-4 w-4 group-hover/item:translate-x-1 transition-transform" />
                    <span>{t("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="group relative overflow-hidden transition-all hover:scale-105">
                  <User className="mr-2 h-4 w-4 relative z-10 group-hover:animate-pulse" />
                  <span className="relative z-10">{t("signIn")}</span>
                  <span className="absolute inset-0 bg-primary/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                </Button>
              </Link>
            )}

            { }
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[320px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-xl font-bold">Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-2 mt-6">
                  <Accordion type="multiple" className="w-full">
                    { }
                    <AccordionItem value="men" className="border-b">
                      <AccordionTrigger className="px-3 py-3 text-base font-semibold hover:no-underline hover:bg-primary/5 transition-all">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">👔</span>
                          {t("men")}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="grid grid-cols-2 gap-2 px-3">
                          {menCategories.map((category) => (
                            <Link
                              key={category.name}
                              href={category.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 border border-transparent hover:border-primary/30 hover:shadow-md"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    { }
                    <AccordionItem value="women" className="border-b">
                      <AccordionTrigger className="px-3 py-3 text-base font-semibold hover:no-underline hover:bg-primary/5 transition-all">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">👗</span>
                          {t("women")}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="grid grid-cols-2 gap-2 px-3">
                          {womenCategories.map((category) => (
                            <Link
                              key={category.name}
                              href={category.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 border border-transparent hover:border-primary/30 hover:shadow-md"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    { }
                    <AccordionItem value="kids" className="border-b">
                      <AccordionTrigger className="px-3 py-3 text-base font-semibold hover:no-underline hover:bg-primary/5 transition-all">
                        <span className="flex items-center gap-2">
                          <span className="text-lg">👶</span>
                          {t("kids")}
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="grid grid-cols-2 gap-2 px-3">
                          {kidsCategories.map((category) => (
                            <Link
                              key={category.name}
                              href={category.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 border border-transparent hover:border-primary/30 hover:shadow-md"
                            >
                              {category.name}
                            </Link>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  { }
                  <div className="border-t pt-4 mt-2 space-y-1">
                    <Link
                      href="/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 hover:shadow-md"
                    >
                      <Package className="h-4 w-4" />
                      {t("allProducts")}
                    </Link>
                    <Link
                      href="/new-arrival"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 hover:shadow-md"
                    >
                      {language === "ar" ? "وصل جديد" : "New Arrival"}
                    </Link>
                    <Link
                      href="/collection"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 hover:shadow-md"
                    >
                      {language === "ar" ? "المجموعة" : "Collection"}
                    </Link>
                    <Link
                      href="/studio"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-3 text-sm font-semibold rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-300 hover:scale-105 hover:shadow-md"
                    >
                      {t("designStudio")}
                    </Link>
                  </div>
                  {user && (
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                      >
                        <UserCircle2 className="h-4 w-4" />
                        {t("myProfile")}
                      </Link>
                      <Link
                        href="/profile?tab=orders"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                      >
                        <Package className="h-4 w-4" />
                        {t("myOrders")}
                      </Link>
                      <Link
                        href="/profile?tab=designs"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                      >
                        <Settings className="h-4 w-4" />
                        {t("myDesigns")}
                      </Link>
                      <button
                        onClick={() => {
                          logout()
                          setMobileMenuOpen(false)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md hover:bg-accent text-destructive"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("logout")}
                      </button>
                    </div>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
