"use client"

import { useEffect, useState } from "react"
import { vendorApi, type VendorProduct } from "@/lib/api/vendor"
import { useAuth } from "@/lib/auth"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"

export default function VendorApprovalsPage() {
  const { user } = useAuth()
  const [products, setProducts] = useState<VendorProduct[]>([])

  const loadProducts = async () => {
    const data = await vendorApi.getProducts({ all: true })
    setProducts(data)
  }

  useEffect(() => {
    loadProducts()
  }, [])

  if (!user || user.role !== "admin") {
    return <div className="p-6">Access restricted.</div>
  }

  const handleApprove = async (id: string) => {
    await vendorApi.approveProduct(id)
    await loadProducts()
  }

  const handleReject = async (id: string) => {
    await vendorApi.rejectProduct(id)
    await loadProducts()
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Product Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor User</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.vendorUser}</TableCell>
                  <TableCell>{item.productData.name}</TableCell>
                  <TableCell>{item.status}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleApprove(item._id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReject(item._id)}>
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
