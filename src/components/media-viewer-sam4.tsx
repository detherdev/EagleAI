"use client"

import { Card } from "@/components/ui/card"
import { Eye, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import DetectionBarGraph from "@/components/detection-bar-graph"

interface MediaViewerProps {
  mediaUrl: string | null
  resultUrl: string | null
  error: string | null
  detectionDetails?: string | null
}

export default function MediaViewer({ mediaUrl, resultUrl, error, detectionDetails }: MediaViewerProps) {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="flex aspect-video items-center justify-center bg-destructive/10 p-8">
          <div className="flex flex-col items-center space-y-3 text-center">
            <div className="rounded-lg bg-destructive/10 p-4">
              <AlertCircle className="size-8 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive mb-1">Processing Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (!mediaUrl && !resultUrl) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden bg-card transition-shadow duration-300 hover:shadow-xl">
        <div className="relative max-h-[400px] overflow-hidden flex items-center justify-center bg-muted/30">
          {/* Base image - always visible */}
          {mediaUrl && (
            <img
              src={mediaUrl}
              alt="Original"
              className="w-full h-full object-contain max-h-[400px]"
            />
          )}
          
          {/* Segmentation overlay - blends on top */}
          <AnimatePresence>
            {resultUrl && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <img
                  src={resultUrl}
                  alt="Segmentation overlay"
                  className="w-full h-full object-contain max-h-[400px] mix-blend-normal"
                  crossOrigin="anonymous"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Detection Bar Graph - Show when we have results */}
        {resultUrl && detectionDetails && (
          <div className="border-t border-border">
            <DetectionBarGraph detailsText={detectionDetails} />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

