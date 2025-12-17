"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Eye } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface DetectedObject {
  id: string
  label: string
  bbox: { x: number; y: number; width: number; height: number }
}

interface MediaViewerProps {
  mediaUrl: string | null
  mediaType: "image" | "video" | null
  detectedObjects: DetectedObject[]
}

export default function MediaViewer({ mediaUrl, mediaType, detectedObjects }: MediaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mediaRef = useRef<HTMLImageElement | HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!mediaUrl || !mediaRef.current) return

    const updateDimensions = () => {
      if (mediaRef.current) {
        const rect = mediaRef.current.getBoundingClientRect()
        setDimensions({ width: rect.width, height: rect.height })
      }
    }

    if (mediaType === "image") {
      const img = mediaRef.current as HTMLImageElement
      img.onload = updateDimensions
    } else {
      const video = mediaRef.current as HTMLVideoElement
      video.onloadedmetadata = updateDimensions
    }

    window.addEventListener("resize", updateDimensions)
    return () => window.removeEventListener("resize", updateDimensions)
  }, [mediaUrl, mediaType])

  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = dimensions.width
    canvas.height = dimensions.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    detectedObjects.forEach((obj, index) => {
      setTimeout(() => {
        const x = (obj.bbox.x / 100) * dimensions.width
        const y = (obj.bbox.y / 100) * dimensions.height
        const width = (obj.bbox.width / 100) * dimensions.width
        const height = (obj.bbox.height / 100) * dimensions.height

        // Draw bounding box with animation
        ctx.strokeStyle = "rgb(233, 124, 97)"
        ctx.lineWidth = 3
        ctx.shadowColor = "rgba(233, 124, 97, 0.3)"
        ctx.shadowBlur = 8
        ctx.strokeRect(x, y, width, height)

        // Draw label background
        ctx.fillStyle = "rgb(233, 124, 97)"
        const labelPadding = 8
        const labelHeight = 24
        ctx.fillRect(x, y - labelHeight, width, labelHeight)

        // Draw label text
        ctx.fillStyle = "rgb(250, 247, 242)"
        ctx.font = "600 14px ui-sans-serif, system-ui, sans-serif"
        ctx.textBaseline = "middle"
        ctx.fillText(obj.label, x + labelPadding, y - labelHeight / 2)

        ctx.shadowBlur = 0
      }, index * 150)
    })
  }, [detectedObjects, dimensions])

  if (!mediaUrl) {
    return (
      <Card className="flex aspect-video items-center justify-center bg-muted">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center space-y-3 text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            className="rounded-lg bg-primary/10 p-4"
          >
            <Eye className="size-8 text-muted-foreground" />
          </motion.div>
          <p className="text-sm text-muted-foreground">Upload media to begin analysis</p>
        </motion.div>
      </Card>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
      <Card className="overflow-hidden bg-card transition-shadow duration-300 hover:shadow-xl">
        <div ref={containerRef} className="relative">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
            {mediaType === "image" ? (
              <img
                ref={mediaRef as React.RefObject<HTMLImageElement>}
                src={mediaUrl || "/placeholder.svg"}
                alt="Uploaded content"
                className="w-full"
              />
            ) : (
              <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={mediaUrl} controls className="w-full" />
            )}
          </motion.div>
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute left-0 top-0"
            style={{ width: dimensions.width, height: dimensions.height }}
          />
        </div>
        <AnimatePresence>
          {detectedObjects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border-t border-border bg-muted/30 px-4 py-3"
            >
              <p className="text-xs text-muted-foreground">
                {detectedObjects.length} object{detectedObjects.length !== 1 ? "s" : ""} detected
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
