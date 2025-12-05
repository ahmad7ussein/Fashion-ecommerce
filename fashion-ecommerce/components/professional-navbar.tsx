"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  ShoppingBag,
  Menu,
  X,
  User,
  Sparkles,
  Palette,
  Package,
  LogOut,
  Settings,
  Heart,
  Search,
  ChevronDown,
  Snowflake,
  Sun,
  Moon,
  Languages,
  Globe,
  MapPin
} from "lucide-react"
import { Logo } from "@/components/logo"
import { useCart } from "@/lib/cart"
import { useAuth } from "@/lib/auth"
import { useLanguage } from "@/lib/language"
import { useRegion, type Region } from "@/lib/region"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Categories with subcategories
const categories = [
  {
    name: "Men",
    href: "/products?gender=Men",
    subcategories: [
      { name: "Summer Collection", href: "/products?gender=Men&season=Summer", icon: <Sun className="h-4 w-4" /> },
      { name: "Winter Collection", href: "/products?gender=Men&season=Winter", icon: <Snowflake className="h-4 w-4" /> },
    ]
  },
  {
    name: "Women",
    href: "/products?gender=Women",
    subcategories: [
      { name: "Summer Collection", href: "/products?gender=Women&season=Summer", icon: <Sun className="h-4 w-4" /> },
      { name: "Winter Collection", href: "/products?gender=Women&season=Winter", icon: <Snowflake className="h-4 w-4" /> },
    ]
  },
  {
    name: "Kids",
    href: "/products?gender=Kids",
    subcategories: [
      { name: "Summer Collection", href: "/products?gender=Kids&season=Summer", icon: <Sun className="h-4 w-4" /> },
      { name: "Winter Collection", href: "/products?gender=Kids&season=Winter", icon: <Snowflake className="h-4 w-4" /> },
    ]
  },
]

export function ProfessionalNavbar() {
  const { items } = useCart()
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const { region, regionInfo, setRegion, detectRegion } = useRegion()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  // Handle theme mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Force re-render when language changes
  useEffect(() => {
    // This ensures the component re-renders when language changes
    // The language state from useLanguage hook will trigger the re-render
  }, [language])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { name: language === "ar" ? "الرئيسية" : "Home", href: "/" },
    { name: language === "ar" ? "استوديو التصميم" : "Design Studio", href: "/studio", icon: <Palette className="h-4 w-4" /> },
    { name: language === "ar" ? "تصاميمي" : "My Designs", href: "/my-designs" },
    { name: language === "ar" ? "حول" : "About", href: "/about" },
  ]

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-6 md:px-12 lg:px-24">
          <div className="flex h-20 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.3 }}
              >
                <Logo />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-2">
              {navLinks.map((link, index) => (
                <Link key={link.href} href={link.href}>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Button
                      variant="ghost"
                      className="text-base font-medium text-white/80 hover:text-white hover:bg-white/10 px-5 py-2.5 rounded-full transition-all duration-300 group"
                    >
                      {link.icon && (
                        <span className={`${language === "ar" ? "ml-2" : "mr-2"} group-hover:rotate-12 transition-transform`}>
                          {link.icon}
                        </span>
                      )}
                      {link.name}
                    </Button>
                  </motion.div>
                </Link>
              ))}

              {/* Categories with Dropdowns */}
              {categories.map((category, index) => (
                <div
                  key={category.name}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(category.name)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: (navLinks.length + index) * 0.1 }}
                  >
                    <Link href={category.href}>
                      <Button
                        variant="ghost"
                        className="text-base font-medium text-white/80 hover:text-white hover:bg-white/10 px-5 py-2.5 rounded-full transition-all duration-300 group"
                      >
                        {category.name}
                        <ChevronDown className={`${language === "ar" ? "mr-1" : "ml-1"} h-4 w-4 transition-transform group-hover:rotate-180`} />
                      </Button>
                    </Link>
                  </motion.div>

                  {/* Dropdown Menu */}
                  <AnimatePresence>
                    {openDropdown === category.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-2 w-64 bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                      >
                        <div className="p-2">
                          {category.subcategories.map((sub) => (
                            <Link key={sub.href} href={sub.href}>
                              <motion.div
                                whileHover={{ x: 4 }}
                                className="flex items-center gap-3 px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                              >
                                {sub.icon}
                                <span className="text-sm font-medium">{sub.name}</span>
                              </motion.div>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              {mounted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="hidden md:block"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="relative text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group"
                    title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                  >
                    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute inset-0 m-auto h-5 w-5 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </motion.div>
              )}

              {/* Language Toggle */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="hidden md:block"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group"
                    >
                      <Languages className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="sr-only">Change Language</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align={language === "ar" ? "start" : "end"} 
                    className="w-40 bg-black/95 backdrop-blur-xl border border-white/10"
                  >
                    <DropdownMenuItem
                      onClick={() => {
                        setLanguage("en")
                        setMobileMenuOpen(false)
                      }}
                      className={`cursor-pointer ${language === "en" ? "bg-white/10" : ""}`}
                    >
                      🇺🇸 English
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setLanguage("ar")
                        setMobileMenuOpen(false)
                      }}
                      className={`cursor-pointer ${language === "ar" ? "bg-white/10" : ""}`}
                    >
                      🇸🇦 العربية
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>

              {/* Region Selector */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="hidden md:block"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group"
                      title={`${regionInfo.name} (${regionInfo.currency})`}
                    >
                      <Globe className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                      <span className="sr-only">Select Region</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align={language === "ar" ? "start" : "end"} 
                    className="w-56 bg-black/95 backdrop-blur-xl border border-white/10"
                  >
                    <DropdownMenuItem
                      onClick={detectRegion}
                      className="cursor-pointer border-b border-white/10"
                    >
                      <MapPin className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`} />
                      {language === "ar" ? "اكتشاف المنطقة تلقائياً" : "Auto-detect Region"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRegion("US")}
                      className={`cursor-pointer ${region === "US" ? "bg-white/10" : ""}`}
                    >
                      🇺🇸 United States (USD)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRegion("SA")}
                      className={`cursor-pointer ${region === "SA" ? "bg-white/10" : ""}`}
                    >
                      🇸🇦 Saudi Arabia (SAR)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRegion("AE")}
                      className={`cursor-pointer ${region === "AE" ? "bg-white/10" : ""}`}
                    >
                      🇦🇪 UAE (AED)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRegion("EG")}
                      className={`cursor-pointer ${region === "EG" ? "bg-white/10" : ""}`}
                    >
                      🇪🇬 Egypt (EGP)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRegion("GB")}
                      className={`cursor-pointer ${region === "GB" ? "bg-white/10" : ""}`}
                    >
                      🇬🇧 United Kingdom (GBP)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRegion("EU")}
                      className={`cursor-pointer ${region === "EU" ? "bg-white/10" : ""}`}
                    >
                      🇪🇺 Europe (EUR)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setRegion("PS")}
                      className={`cursor-pointer ${region === "PS" ? "bg-white/10" : ""}`}
                    >
                      🇵🇸 Palestine (ILS)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>

              {/* Search Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="hidden md:block"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  <Search className="h-5 w-5" />
                </Button>
              </motion.div>

              {/* Cart Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <Link href="/cart">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group"
                  >
                    <ShoppingBag className="h-5 w-5 group-hover:scale-110 transition-transform" />
                    {itemCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1"
                      >
                        <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-white text-black text-xs font-bold rounded-full">
                          {itemCount}
                        </Badge>
                      </motion.div>
                    )}
                  </Button>
                </Link>
              </motion.div>

              {/* User Menu */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="hidden md:block"
              >
                {user ? (
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                    
                    {/* Dropdown Menu */}
                    <div className={`absolute ${language === "ar" ? "left-0" : "right-0"} mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300`}>
                      <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/10">
                          <p className="text-sm font-medium text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        <div className="p-2">
                          <Link href="/profile">
                            <button className={`w-full flex items-center ${language === "ar" ? "flex-row-reverse" : ""} gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all`}>
                              <User className="h-4 w-4" />
                              {language === "ar" ? "الملف الشخصي" : "Profile"}
                            </button>
                          </Link>
                          <Link href="/my-designs">
                            <button className={`w-full flex items-center ${language === "ar" ? "flex-row-reverse" : ""} gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all`}>
                              <Sparkles className="h-4 w-4" />
                              {language === "ar" ? "تصاميمي" : "My Designs"}
                            </button>
                          </Link>
                          {user.role === "admin" && (
                            <Link href="/admin">
                              <button className={`w-full flex items-center ${language === "ar" ? "flex-row-reverse" : ""} gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all`}>
                                <Settings className="h-4 w-4" />
                                {language === "ar" ? "لوحة الإدارة" : "Admin Panel"}
                              </button>
                            </Link>
                          )}
                          {user.role === "employee" && (
                            <Link href="/employee">
                              <button className={`w-full flex items-center ${language === "ar" ? "flex-row-reverse" : ""} gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-all`}>
                                <Package className="h-4 w-4" />
                                {language === "ar" ? "لوحة الموظف" : "Employee Panel"}
                              </button>
                            </Link>
                          )}
                        </div>
                        <div className="p-2 border-t border-white/10">
                          <button
                            onClick={() => logout()}
                            className={`w-full flex items-center ${language === "ar" ? "flex-row-reverse" : ""} gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all`}
                          >
                            <LogOut className="h-4 w-4" />
                            {language === "ar" ? "تسجيل الخروج" : "Logout"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link href="/login">
                    <Button className="bg-white text-black hover:bg-gray-200 px-6 py-2.5 rounded-full font-semibold transition-all duration-300 hover:scale-105">
                      {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                    </Button>
                  </Link>
                )}
              </motion.div>

              {/* Mobile Menu Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="lg:hidden"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all duration-300"
                >
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: language === "ar" ? "-100%" : "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: language === "ar" ? "-100%" : "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <div className="relative h-full flex flex-col p-6 pt-24">
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-xl font-medium text-white/80 hover:text-white hover:bg-white/10 px-6 py-6 rounded-2xl transition-all"
                      >
                      {link.icon && <span className={language === "ar" ? "ml-3" : "mr-3"}>{link.icon}</span>}
                      {link.name}
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Mobile Settings */}
              <div className="mt-6 pt-6 border-t border-white/10 space-y-2">
                {/* Theme Toggle Mobile */}
                {mounted && (
                  <Button
                    variant="ghost"
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-full justify-start text-white/80 hover:text-white hover:bg-white/10 px-6 py-6 rounded-2xl"
                  >
                    {theme === "dark" ? (
                      <>
                        <Sun className={`${language === "ar" ? "ml-3" : "mr-3"} h-5 w-5`} />
                        {language === "ar" ? "الوضع الفاتح" : "Light Mode"}
                      </>
                    ) : (
                      <>
                        <Moon className={`${language === "ar" ? "ml-3" : "mr-3"} h-5 w-5`} />
                        {language === "ar" ? "الوضع الداكن" : "Dark Mode"}
                      </>
                    )}
                  </Button>
                )}

                {/* Language Toggle Mobile */}
                <div className="px-6">
                  <p className="text-sm text-gray-400 mb-2">
                    {language === "ar" ? "اللغة" : "Language"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant={language === "en" ? "default" : "ghost"}
                      onClick={() => {
                        setLanguage("en")
                        setMobileMenuOpen(false)
                      }}
                      className="flex-1"
                    >
                      🇺🇸 English
                    </Button>
                    <Button
                      variant={language === "ar" ? "default" : "ghost"}
                      onClick={() => {
                        setLanguage("ar")
                        setMobileMenuOpen(false)
                      }}
                      className="flex-1"
                    >
                      🇸🇦 العربية
                    </Button>
                  </div>
                </div>

                {/* Region Selector Mobile */}
                <div className="px-6">
                  <p className="text-sm text-gray-400 mb-2">
                    {language === "ar" ? "المنطقة" : "Region"}
                  </p>
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      onClick={detectRegion}
                      className={`w-full ${language === "ar" ? "justify-end" : "justify-start"} text-white/80 hover:text-white hover:bg-white/10`}
                    >
                      <MapPin className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4`} />
                      {language === "ar" ? "اكتشاف تلقائي" : "Auto-detect"}
                    </Button>
                    <div className="grid grid-cols-2 gap-1">
                      {(["US", "SA", "AE", "EG", "GB", "EU", "PS"] as Region[]).map((reg) => {
                        const regInfo = {
                          US: { flag: "🇺🇸", name: "US" },
                          SA: { flag: "🇸🇦", name: "SA" },
                          AE: { flag: "🇦🇪", name: "UAE" },
                          EG: { flag: "🇪🇬", name: "EG" },
                          GB: { flag: "🇬🇧", name: "UK" },
                          EU: { flag: "🇪🇺", name: "EU" },
                          PS: { flag: "🇵🇸", name: "PS" },
                        }[reg]
                        return (
                          <Button
                            key={reg}
                            variant={region === reg ? "default" : "ghost"}
                            onClick={() => setRegion(reg)}
                            className="text-xs"
                          >
                            {regInfo.flag} {regInfo.name}
                          </Button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/10">
                {user ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 px-6">
                      {language === "ar" ? "تم تسجيل الدخول كـ" : "Signed in as"}
                    </p>
                    <p className="text-lg font-medium text-white px-6">{user.name}</p>
                    <Button
                      onClick={() => {
                        logout()
                        setMobileMenuOpen(false)
                      }}
                      variant="ghost"
                      className={`w-full ${language === "ar" ? "justify-end" : "justify-start"} text-red-400 hover:text-red-300 hover:bg-red-500/10 px-6 py-6 rounded-2xl`}
                    >
                      <LogOut className={`${language === "ar" ? "ml-3" : "mr-3"} h-5 w-5`} />
                      {language === "ar" ? "تسجيل الخروج" : "Logout"}
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-white text-black hover:bg-gray-200 py-6 rounded-2xl text-lg font-semibold">
                      {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

