"use client"

import { useState, type FC, type RefObject } from "react"
import { Download } from "lucide-react"
import html2canvas from "html2canvas"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface DownloadButtonProps {
  previewRef: RefObject<HTMLDivElement>
}

export const DownloadButton: FC<DownloadButtonProps> = ({ previewRef }) => {
  const { toast } = useToast()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    if (!previewRef.current) {
      toast({
        title: "لم يتم العثور على التصميم",
        variant: "destructive",
      })
      return
    }

    if (isDownloading) return

    setIsDownloading(true)
    const loadingToast = toast({ title: "جاري تحميل التصميم..." })

    try {
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const link = document.createElement("a")
      link.download = `hoodie-design-${Date.now()}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()

      loadingToast.dismiss()
      toast({ title: "تم تحميل التصميم بنجاح!" })
    } catch (error) {
      loadingToast.dismiss()
      toast({
        title: "حدث خطأ أثناء التحميل",
        variant: "destructive",
      })
      console.error("Download error:", error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button variant="outline" size="lg" onClick={handleDownload} className="gap-2" disabled={isDownloading}>
      <Download className="w-4 h-4" />
      تحميل التصميم
    </Button>
  )
}
