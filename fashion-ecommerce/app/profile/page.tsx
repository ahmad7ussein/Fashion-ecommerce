"use client"

import React, { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingBag, User, Package, Heart, Settings, MapPin, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { authApi } from "@/lib/api/auth"
import { ordersApi, type Order } from "@/lib/api/orders"
import { designsApi, type Design } from "@/lib/api/designs"
import Image from "next/image"
import logger from "@/lib/logger"

// Removed mock data - will use API

export default function ProfilePage() {
  const { user, logout, refreshUser, isLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const hasRedirected = React.useRef(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [designs, setDesigns] = useState<Design[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [loadingDesigns, setLoadingDesigns] = useState(false)

  const [userData, setUserData] = useState({
    firstName: user?.firstName || user?.name?.split(" ")[0] || "",
    lastName: user?.lastName || user?.name?.split(" ")[1] || "",
    email: user?.email || "",
    phone: "+1 (555) 123-4567",
    dateOfBirth: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  })

  // Update userData when user changes
  React.useEffect(() => {
    if (user) {
      setUserData((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }))
    }
  }, [user])

  // Load orders
  React.useEffect(() => {
    if (user && user.role === "customer") {
      setLoadingOrders(true)
      ordersApi
        .getMyOrders()
        .then((data) => {
          setOrders(data)
        })
        .catch((error) => {
          logger.error("Failed to load orders:", error)
          toast({
            title: "Error",
            description: "Failed to load orders",
            variant: "destructive",
          })
        })
        .finally(() => setLoadingOrders(false))
    }
  }, [user])

  // Load designs
  React.useEffect(() => {
    if (user && user.role === "customer") {
      setLoadingDesigns(true)
      designsApi
        .getMyDesigns()
        .then((data) => {
          setDesigns(data)
        })
        .catch((error) => {
          logger.error("Failed to load designs:", error)
        })
        .finally(() => setLoadingDesigns(false))
    }
  }, [user])

  const [shippingAddress, setShippingAddress] = useState({
    street: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA",
  })

  // Redirect if not logged in (only once)
  React.useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected.current) return
    if (isLoading) return

    if (!user) {
      hasRedirected.current = true
      router.push("/login")
    } else if (user.role !== "customer") {
      hasRedirected.current = true
      // Redirect non-customers to their appropriate pages
      if (user.role === "admin") {
        router.push("/admin")
      } else if (user.role === "employee") {
        router.push("/employee")
      } else {
        router.push("/login")
      }
    }
  }, [user, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirecting message if not authorized
  if (!user || user.role !== "customer") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Redirecting...</p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black pt-24">
      <div className="container mx-auto px-6 md:px-12 lg:px-24 py-12">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-12"
          >
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">My Account</h1>
              <p className="text-gray-400 text-xl mt-2">Welcome back, {userData.firstName}!</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="h-12 px-6 bg-white/5 border-white/20 text-white hover:bg-white/10 hover:border-white/30 rounded-full"
            >
              Logout
            </Button>
          </motion.div>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5 bg-white/5 backdrop-blur-sm border border-white/10 p-2 rounded-2xl h-auto">
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl h-12"
              >
                <User className="h-5 w-5 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl h-12"
              >
                <Package className="h-5 w-5 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger
                value="designs"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl h-12"
              >
                <Heart className="h-5 w-5 mr-2" />
                Designs
              </TabsTrigger>
              <TabsTrigger
                value="addresses"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl h-12"
              >
                <MapPin className="h-5 w-5 mr-2" />
                Addresses
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-white data-[state=active]:text-black text-gray-400 rounded-xl h-12"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={userData.firstName}
                        onChange={(e) => setUserData({ ...userData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={userData.lastName}
                        onChange={(e) => setUserData({ ...userData, lastName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={userData.phone}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={async () => {
                        try {
                          await authApi.updateProfile({
                            firstName: userData.firstName,
                            lastName: userData.lastName,
                            phone: userData.phone,
                            address: {
                              street: shippingAddress.street,
                              city: shippingAddress.city,
                              state: shippingAddress.state,
                              zip: shippingAddress.zipCode,
                              country: shippingAddress.country,
                            },
                          })
                          toast({
                            title: "Profile updated",
                            description: "Your profile has been updated successfully",
                          })
                          refreshUser()
                        } catch (error: any) {
                          toast({
                            title: "Error",
                            description: error.message || "Failed to update profile",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUserData({
                          firstName: user?.firstName || "",
                          lastName: user?.lastName || "",
                          email: user?.email || "",
                          phone: "",
                          dateOfBirth: "",
                          address: "",
                          city: "",
                          state: "",
                          zipCode: "",
                          country: "United States",
                        })
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div>
                    <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                    <Input id="confirmNewPassword" type="password" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              {loadingOrders ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2 text-white">No orders yet</h3>
                    <p className="text-gray-400 mb-6">Start shopping to see your orders here</p>
                    <Button asChild>
                      <Link href="/products">Browse Products</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg text-white">{order.orderNumber}</h3>
                            <p className="text-sm text-gray-400">
                              Placed on {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              order.status === "delivered"
                                ? "default"
                                : order.status === "shipped"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex gap-4">
                              <div className="w-16 h-16 rounded bg-muted flex-shrink-0 relative overflow-hidden">
                                <Image
                                  src={item.image || "/placeholder.svg"}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white">{item.name}</p>
                                <p className="text-sm text-gray-400">
                                  Quantity: {item.quantity} • Size: {item.size} • Color: {item.color}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <p className="font-semibold text-white">Total: ${order.total.toFixed(2)}</p>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/orders/${order._id}`}>View Details</Link>
                            </Button>
                            {order.trackingNumber && (
                              <Button variant="outline" size="sm">
                                Track: {order.trackingNumber}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Saved Designs Tab */}
            <TabsContent value="designs">
              {loadingDesigns ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Loading designs...</p>
                </div>
              ) : designs.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Heart className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2 text-white">No designs yet</h3>
                    <p className="text-gray-400 mb-6">Create your first custom design in the studio</p>
                    <Button asChild>
                      <Link href="/studio">Go to Studio</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {designs.map((design) => (
                    <Card key={design._id} className="overflow-hidden bg-white/5 border-white/10">
                      <div className="aspect-square bg-muted relative">
                        <Image
                          src={design.thumbnail || "/placeholder.svg"}
                          alt={design.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-1 text-white">{design.name}</h3>
                        <p className="text-sm text-gray-400 mb-3">
                          {design.baseProduct?.type || "Product"} • Saved {new Date(design.createdAt).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            asChild
                          >
                            <Link href={`/studio?design=${design._id}`}>Edit Design</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (confirm("Are you sure you want to delete this design?")) {
                                try {
                                  await designsApi.deleteDesign(design._id)
                                  setDesigns(designs.filter((d) => d._id !== design._id))
                                  toast({
                                    title: "Design deleted",
                                    description: "Your design has been deleted successfully",
                                  })
                                } catch (error: any) {
                                  logger.error("Failed to delete design:", error)
                                  toast({
                                    title: "Error",
                                    description: "Failed to delete design",
                                    variant: "destructive",
                                  })
                                }
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={shippingAddress.street}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button>Save Address</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Account Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input id="currentPassword" type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input id="newPassword" type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input id="confirmPassword" type="password" placeholder="••••••••" />
                    </div>
                    <Button>Update Password</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Email Notifications</p>
                        <p className="text-sm text-muted-foreground">Receive updates about your orders</p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Marketing Emails</p>
                        <p className="text-sm text-muted-foreground">Receive promotional offers</p>
                      </div>
                      <input type="checkbox" className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    <Button variant="destructive">Delete Account</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
