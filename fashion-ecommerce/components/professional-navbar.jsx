"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Menu, X, User, Palette, Package, LogOut, Settings, Search, ChevronDown, ChevronRight, Snowflake, Languages, MapPin, Info, ArrowRight, Tag, Star, Phone } from "lucide-react";
import { Logo } from "@/components/logo";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { useRegion } from "@/lib/region";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
const categories = [
    {
        name: "Men",
        nameAr: "رجال",
        href: "/products?gender=Men",
        subcategories: [
            { name: "Summer", nameAr: "الصيف", href: "/products?gender=Men&season=Summer", icon: null },
            { name: "Winter", nameAr: "الشتاء", href: "/products?gender=Men&season=Winter", icon: <Snowflake className="h-4 w-4"/> },
        ]
    },
    {
        name: "Women",
        nameAr: "نساء",
        href: "/products?gender=Women",
        subcategories: [
            { name: "Summer", nameAr: "الصيف", href: "/products?gender=Women&season=Summer", icon: null },
            { name: "Winter", nameAr: "الشتاء", href: "/products?gender=Women&season=Winter", icon: <Snowflake className="h-4 w-4"/> },
        ]
    },
    {
        name: "Kids",
        nameAr: "أطفال",
        href: "/products?gender=Kids",
        subcategories: [
            { name: "Summer", nameAr: "الصيف", href: "/products?gender=Kids&season=Summer", icon: null },
            { name: "Winter", nameAr: "الشتاء", href: "/products?gender=Kids&season=Winter", icon: <Snowflake className="h-4 w-4"/> },
        ]
    },
];
export function ProfessionalNavbar() {
    const { items } = useCart();
    const { user, logout } = useAuth();
    const { language, setLanguage } = useLanguage();
    const { region, regionInfo, setRegion, detectRegion } = useRegion();
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [selectedGender, setSelectedGender] = useState(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
    }, [language]);
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    const navLinks = [
        {
            name: language === "ar" ? "جديد" : "New Arrivals",
            href: "/products?featured=true&sort=newest",
            icon: null,
            highlight: true
        },
        {
            name: language === "ar" ? "تخفيضات" : "Sale",
            href: "/sale",
            icon: <Tag className="h-4 w-4"/>,
            highlight: true,
            badge: language === "ar" ? "خصم" : "Sale"
        },
        {
            name: language === "ar" ? "المجموعات" : "Collections",
            href: "/collections",
            icon: <Star className="h-4 w-4"/>,
            highlight: false
        },
        {
            name: language === "ar" ? "المنتجات" : "Shop",
            href: "/products",
            icon: <ShoppingBag className="h-4 w-4"/>,
            highlight: false
        },
        {
            name: language === "ar" ? "استوديو التصميم" : "Design Studio",
            href: "/studio",
            icon: <Palette className="h-4 w-4"/>,
            highlight: false
        },
    ];
    return (<>
      <motion.header initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[calc(env(safe-area-inset-top)+0.5rem)] ${scrolled
            ? "bg-background/98 backdrop-blur-xl border-b border-border shadow-lg"
            : "bg-background/95 backdrop-blur-md border-b border-border/50 shadow-sm"}`}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-14 sm:min-h-16 md:min-h-20 flex-wrap items-center justify-between gap-2 sm:gap-3 py-2">
            
            <Link href="/" className="flex items-center space-x-3 group flex-shrink-0 ml-2 sm:ml-4 md:ml-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0.2 }}>
                <Logo className="h-10 sm:h-12 md:h-14 lg:h-16 dark:invert dark:brightness-110 dark:drop-shadow-[0_2px_8px_rgba(255,255,255,0.25)]"/>
              </motion.div>
            </Link>

            
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link, index) => (<Link key={link.href} href={link.href}>
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                    <Button variant={link.highlight ? "default" : "ghost"} className={`relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 group ${link.highlight
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "hover:bg-accent hover:text-accent-foreground"} ${language === "ar" ? "flex-row-reverse" : ""}`}>
                      {link.icon && (<span className={`${language === "ar" ? "ml-2" : "mr-2"} group-hover:scale-110 transition-transform duration-200`}>
                          {link.icon}
                        </span>)}
                      <span className="font-semibold">{link.name}</span>
                      {link.badge && (<span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                          {link.badge}
                        </span>)}
                    </Button>
                  </motion.div>
                </Link>))}

              
              <div className="relative" onMouseEnter={() => setOpenDropdown("categories")} onMouseLeave={() => {
            setOpenDropdown(null);
            setSelectedGender(null);
        }}>
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: navLinks.length * 0.1 }}>
                  <Button variant="ghost" className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 hover:bg-accent hover:text-accent-foreground group ${language === "ar" ? "flex-row-reverse" : ""}`}>
                    <span>{language === "ar" ? "الفئات" : "Categories"}</span>
                    <ChevronDown className={`${language === "ar" ? "mr-1" : "ml-1"} h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180`}/>
                  </Button>
                </motion.div>

                
                <AnimatePresence>
                  {openDropdown === "categories" && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute top-full ${language === "ar" ? "right-0" : "left-0"} mt-2 w-56 bg-popover border border-border rounded-lg shadow-lg overflow-visible z-50`}>
                      <div className="p-2">
                        {categories.map((category) => (<div key={category.name} onMouseEnter={() => setSelectedGender(category.name)} onMouseLeave={() => setSelectedGender(null)} className="relative">
                            <Link href={category.href}>
                              <motion.div whileHover={{ x: language === "ar" ? -4 : 4 }} className={`flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:text-primary hover:bg-accent rounded-md transition-all cursor-pointer ${language === "ar" ? "flex-row-reverse" : ""}`}>
                                <span className="font-medium">{language === "ar" ? category.nameAr : category.name}</span>
                                <ChevronRight className={`${language === "ar" ? "mr-2 rotate-180" : "ml-2"} h-3.5 w-3.5 transition-transform duration-200`}/>
                              </motion.div>
                            </Link>

                            
                            {selectedGender === category.name && (<motion.div initial={{ opacity: 0, x: language === "ar" ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: language === "ar" ? 10 : -10 }} transition={{ duration: 0.15 }} className={`absolute top-0 ${language === "ar" ? "right-full mr-2" : "left-full ml-2"} w-56 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50`}>
                                <div className="p-2">
                                  {category.subcategories.map((sub) => (<Link key={sub.href} href={sub.href}>
                                      <motion.div whileHover={{ x: language === "ar" ? -4 : 4 }} className={`flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:text-primary hover:bg-accent rounded-md transition-all cursor-pointer ${language === "ar" ? "flex-row-reverse" : ""}`}>
                                        {sub.icon && <span className="text-muted-foreground">{sub.icon}</span>}
                                        <span className="font-medium">{language === "ar" ? sub.nameAr : sub.name}</span>
                                      </motion.div>
                                    </Link>))}
                                </div>
                              </motion.div>)}
                          </div>))}
                      </div>
                    </motion.div>)}
                </AnimatePresence>
              </div>
            </nav>

            
            <div className="flex flex-wrap items-center gap-2 md:gap-3 flex-shrink-0">
              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="hidden md:block">
                <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)} className="h-9 w-9 rounded-lg hover:bg-accent transition-colors" title={language === "ar" ? "بحث" : "Search"}>
                  <Search className="h-4 w-4"/>
                  <span className="sr-only">Search</span>
                </Button>
              </motion.div>

              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.35 }}>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg hover:bg-accent transition-colors">
                    <ShoppingBag className="h-4 w-4"/>
                    {itemCount > 0 && (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1">
                        <Badge className="h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs font-bold rounded-full border-2 border-background">
                          {itemCount > 99 ? "99+" : itemCount}
                        </Badge>
                      </motion.div>)}
                  </Button>
                </Link>
              </motion.div>

              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
                <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-9 w-9 rounded-lg hover:bg-accent transition-colors text-base" aria-label="Toggle theme">
                  <span aria-hidden="true">{theme === "dark" ? "🌙" : "☀️"}</span>
                </Button>
              </motion.div>

              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.4 }} className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent transition-colors" title={language === "ar" ? "الإعدادات" : "Settings"}>
                      <Settings className="h-4 w-4"/>
                      <span className="sr-only">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={language === "ar" ? "start" : "end"} className="w-64 bg-popover border border-border shadow-lg">
                    
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                      {language === "ar" ? "اللغة" : "Language"}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
            setLanguage("en");
            setMobileMenuOpen(false);
        }} className={`cursor-pointer px-2 py-1.5 ${language === "en" ? "bg-accent text-accent-foreground" : ""}`}>
                      <Languages className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                      🇺🇸 {language === "ar" ? "الإنجليزية" : "English"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
            setLanguage("ar");
            setMobileMenuOpen(false);
        }} className={`cursor-pointer px-2 py-1.5 ${language === "ar" ? "bg-accent text-accent-foreground" : ""}`}>
                      <Languages className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                      🇸🇦 {language === "ar" ? "العربية" : "Arabic"}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />

                    
                    
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                      {language === "ar" ? "المنطقة" : "Region"}
                    </DropdownMenuLabel>
                    <DropdownMenuItem onClick={detectRegion} className="cursor-pointer px-2 py-1.5">
                      <MapPin className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                      {language === "ar" ? "اكتشاف المنطقة تلقائياً" : "Auto-detect Region"}
                    </DropdownMenuItem>
                    <div className="max-h-48 overflow-y-auto">
                      <DropdownMenuItem onClick={() => setRegion("US")} className={`cursor-pointer px-2 py-1.5 ${region === "US" ? "bg-accent text-accent-foreground" : ""}`}>
                        🇺🇸 {language === "ar" ? "الولايات المتحدة" : "United States"} (USD)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRegion("SA")} className={`cursor-pointer px-2 py-1.5 ${region === "SA" ? "bg-accent text-accent-foreground" : ""}`}>
                        🇸🇦 {language === "ar" ? "المملكة العربية السعودية" : "Saudi Arabia"} (SAR)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRegion("AE")} className={`cursor-pointer px-2 py-1.5 ${region === "AE" ? "bg-accent text-accent-foreground" : ""}`}>
                        🇦🇪 {language === "ar" ? "الإمارات العربية المتحدة" : "UAE"} (AED)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRegion("EG")} className={`cursor-pointer px-2 py-1.5 ${region === "EG" ? "bg-accent text-accent-foreground" : ""}`}>
                        🇪🇬 {language === "ar" ? "مصر" : "Egypt"} (EGP)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRegion("GB")} className={`cursor-pointer px-2 py-1.5 ${region === "GB" ? "bg-accent text-accent-foreground" : ""}`}>
                        🇬🇧 {language === "ar" ? "المملكة المتحدة" : "United Kingdom"} (GBP)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRegion("EU")} className={`cursor-pointer px-2 py-1.5 ${region === "EU" ? "bg-accent text-accent-foreground" : ""}`}>
                        🇪🇺 {language === "ar" ? "أوروبا" : "Europe"} (EUR)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setRegion("PS")} className={`cursor-pointer px-2 py-1.5 ${region === "PS" ? "bg-accent text-accent-foreground" : ""}`}>
                        🇵🇸 {language === "ar" ? "فلسطين" : "Palestine"} (ILS)
                      </DropdownMenuItem>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
                      {language === "ar" ? "معلومات" : "Information"}
                    </DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/about" className="cursor-pointer flex items-center px-2 py-1.5" onClick={() => setMobileMenuOpen(false)}>
                        <Info className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                        {language === "ar" ? "حول" : "About"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/contact" className="cursor-pointer flex items-center px-2 py-1.5" onClick={() => setMobileMenuOpen(false)}>
                        <Phone className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                        {language === "ar" ? "اتصل بنا" : "Contact"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/collections" className="cursor-pointer flex items-center px-2 py-1.5" onClick={() => setMobileMenuOpen(false)}>
                        <Star className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                        {language === "ar" ? "المجموعات" : "Collections"}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.div>

              
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.45 }} className="hidden md:block">
                {user ? (<DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent transition-colors" aria-label="Account menu">
                        <User className="h-4 w-4"/>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={language === "ar" ? "start" : "end"} className="w-56 bg-popover border border-border shadow-lg">
                      <DropdownMenuLabel className="px-3 py-2">
                        <p className="text-sm font-semibold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className={`cursor-pointer ${language === "ar" ? "flex-row-reverse" : ""} flex items-center gap-3`}>
                          <User className="h-4 w-4"/>
                          {language === "ar" ? "الملف الشخصي" : "Profile"}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/my-designs" className={`cursor-pointer ${language === "ar" ? "flex-row-reverse" : ""} flex items-center gap-3`}>
                          {language === "ar" ? "تصاميمي" : "My Designs"}
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "admin" && (<DropdownMenuItem asChild>
                          <Link href="/admin" className={`cursor-pointer ${language === "ar" ? "flex-row-reverse" : ""} flex items-center gap-3`}>
                            <Settings className="h-4 w-4"/>
                            {language === "ar" ? "لوحة الادمن" : "Admin Panel"}
                          </Link>
                        </DropdownMenuItem>)}
                      {user.role === "employee" && (<DropdownMenuItem asChild>
                          <Link href="/employee" className={`cursor-pointer ${language === "ar" ? "flex-row-reverse" : ""} flex items-center gap-3`}>
                            <Package className="h-4 w-4"/>
                            {language === "ar" ? "لوحة الموظف" : "Employee Panel"}
                          </Link>
                        </DropdownMenuItem>)}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                        {language === "ar" ? "تسجيل الخروج" : "Logout"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>) : (<Link href="/login">
                    <Button className="h-9 px-4 rounded-lg font-medium transition-all hover:scale-105">
                      {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                    </Button>
                  </Link>)}
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.5 }} className="lg:hidden">
                <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="h-9 w-9 rounded-lg hover:bg-accent transition-colors">
                  {mobileMenuOpen ? <X className="h-5 w-5"/> : <Menu className="h-5 w-5"/>}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.header>

      
      <AnimatePresence>
        {mobileMenuOpen && (<motion.div initial={{ opacity: 0, x: language === "ar" ? "-100%" : "100%" }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: language === "ar" ? "-100%" : "100%" }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl"/>
            <div className="relative h-full flex flex-col p-5 pt-20 sm:pt-24 overflow-y-auto">
              <div className="mb-4">
                <Button variant="outline" className="w-full justify-between" onClick={() => {
            setSearchOpen(true);
            setMobileMenuOpen(false);
        }}>
                  <span>{language === "ar" ? "ابحث عن المنتجات" : "Search products"}</span>
                  <Search className="h-4 w-4"/>
                </Button>
              </div>
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, index) => (<motion.div key={link.href} initial={{ opacity: 0, x: language === "ar" ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: index * 0.1 }}>
                    <Link href={link.href} onClick={() => setMobileMenuOpen(false)}>
                      <Button variant={link.highlight ? "default" : "ghost"} className={`relative w-full justify-${language === "ar" ? "end" : "start"} text-lg font-semibold px-6 py-4 rounded-lg transition-all ${language === "ar" ? "flex-row-reverse" : ""} ${link.highlight ? "bg-primary text-primary-foreground" : ""}`}>
                        {link.icon && <span className={language === "ar" ? "ml-3" : "mr-3"}>{link.icon}</span>}
                        {link.name}
                        {link.badge && (<span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {link.badge}
                          </span>)}
                      </Button>
                    </Link>
                  </motion.div>))}

                
                <div className="space-y-2">
                  <div className="px-6 py-2">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {language === "ar" ? "الفئات" : "Categories"}
                    </p>
                  </div>
                  {categories.map((category) => (<div key={category.name} className="space-y-2">
                      <Link href={category.href} onClick={() => setMobileMenuOpen(false)}>
                        <Button variant="ghost" className={`w-full justify-${language === "ar" ? "end" : "start"} text-lg font-medium px-6 py-4 rounded-lg transition-all ${language === "ar" ? "flex-row-reverse" : ""}`}>
                          {language === "ar" ? category.nameAr : category.name}
                        </Button>
                      </Link>
                      <div className="pl-6 space-y-1">
                        {category.subcategories.map((sub) => (<Link key={sub.href} href={sub.href} onClick={() => setMobileMenuOpen(false)}>
                            <Button variant="ghost" className={`w-full justify-${language === "ar" ? "end" : "start"} text-base text-muted-foreground px-4 py-2 rounded-lg transition-all ${language === "ar" ? "flex-row-reverse" : ""}`}>
                              {sub.icon && <span className={language === "ar" ? "ml-2" : "mr-2"}>{sub.icon}</span>}
                              {language === "ar" ? sub.nameAr : sub.name}
                            </Button>
                          </Link>))}
                      </div>
                    </div>))}
                </div>
              </nav>

              
              <div className="mt-8 pt-6 border-t border-border space-y-4">
                
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                    {language === "ar" ? "اللغة" : "Language"}
                  </p>
                  <div className="flex gap-2">
                    <Button variant={language === "en" ? "default" : "outline"} onClick={() => {
                setLanguage("en");
                setMobileMenuOpen(false);
            }} className="flex-1">
                      🇺🇸 {language === "ar" ? "الإنجليزية" : "English"}
                    </Button>
                    <Button variant={language === "ar" ? "default" : "outline"} onClick={() => {
                setLanguage("ar");
                setMobileMenuOpen(false);
            }} className="flex-1">
                      🇸🇦 {language === "ar" ? "العربية" : "Arabic"}
                    </Button>
                  </div>
                </div>

                
                <div className="space-y-2">
                  <Link href="/collections" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <Star className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4`}/>
                      {language === "ar" ? "المجموعات" : "Collections"}
                    </Button>
                  </Link>
                  <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <Phone className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4`}/>
                      {language === "ar" ? "اتصل بنا" : "Contact"}
                    </Button>
                  </Link>
                  <Link href="/about" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      <Info className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4`}/>
                      {language === "ar" ? "حول" : "About"}
                    </Button>
                  </Link>
                </div>

                
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                    {language === "ar" ? "المنطقة" : "Region"}
                  </p>
                  <div className="space-y-2">
                    <Button variant="outline" onClick={detectRegion} className={`w-full ${language === "ar" ? "justify-end flex-row-reverse" : "justify-start"}`}>
                      <MapPin className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4`}/>
                      {language === "ar" ? "اكتشاف تلقائي" : "Auto-detect"}
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      {["US", "SA", "AE", "EG", "GB", "EU", "PS"].map((reg) => {
                const regInfo = {
                    US: { flag: "🇺🇸", name: language === "ar" ? "الولايات المتحدة" : "US" },
                    SA: { flag: "🇸🇦", name: language === "ar" ? "السعودية" : "SA" },
                    AE: { flag: "🇦🇪", name: language === "ar" ? "الإمارات" : "UAE" },
                    EG: { flag: "🇪🇬", name: language === "ar" ? "مصر" : "EG" },
                    GB: { flag: "🇬🇧", name: language === "ar" ? "بريطانيا" : "UK" },
                    EU: { flag: "🇪🇺", name: language === "ar" ? "أوروبا" : "EU" },
                    PS: { flag: "🇵🇸", name: language === "ar" ? "فلسطين" : "PS" },
                }[reg];
                return (<Button key={reg} variant={region === reg ? "default" : "outline"} onClick={() => setRegion(reg)} className="text-sm">
                            {regInfo.flag} {regInfo.name}
                          </Button>);
            })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-border">
                {user ? (<div className="space-y-3">
                    <div className="px-2">
                      <p className="text-sm text-muted-foreground">
                        {language === "ar" ? "تم تسجيل الدخول كـ" : "Signed in as"}
                      </p>
                      <p className="text-lg font-semibold text-foreground mt-1">{user.name}</p>
                    </div>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full">
                        {language === "ar" ? "الملف الشخصي" : "Profile"}
                      </Button>
                    </Link>
                    <Button onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                }} variant="destructive" className="w-full">
                      <LogOut className={`${language === "ar" ? "ml-2" : "mr-2"} h-4 w-4`}/>
                      {language === "ar" ? "تسجيل الخروج" : "Logout"}
                    </Button>
                  </div>) : (<Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full py-6 text-lg font-semibold">
                      {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                    </Button>
                  </Link>)}
              </div>
            </div>
          </motion.div>)}
      </AnimatePresence>

      
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {language === "ar" ? "بحث عن المنتجات" : "Search Products"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className={`absolute ${language === "ar" ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground`}/>
              <Input type="text" placeholder={language === "ar" ? "ابحث عن منتج..." : "Search for products..."} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) {
                window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
                setSearchOpen(false);
            }
        }} className={`${language === "ar" ? "pr-12" : "pl-12"} h-12 text-base border-2 rounded-lg`} autoFocus/>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => {
            if (searchQuery.trim()) {
                window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
                setSearchOpen(false);
            }
        }} className="flex-1 h-12 rounded-lg font-medium" disabled={!searchQuery.trim()}>
                <Search className={`h-4 w-4 ${language === "ar" ? "ml-2" : "mr-2"}`}/>
                {language === "ar" ? "بحث" : "Search"}
              </Button>
              <Button variant="outline" onClick={() => {
            setSearchQuery("");
            setSearchOpen(false);
        }} className="h-12 rounded-lg">
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
            </div>
            {searchQuery && (<div className="pt-4 border-t">
                <Link href={`/products?search=${encodeURIComponent(searchQuery.trim())}`} onClick={() => setSearchOpen(false)} className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2">
                  {language === "ar" ? "عرض جميع النتائج" : "View all results"}
                  <ArrowRight className={`h-4 w-4 ${language === "ar" ? "rotate-180" : ""}`}/>
                </Link>
              </div>)}
          </div>
        </DialogContent>
      </Dialog>
    </>);
}
