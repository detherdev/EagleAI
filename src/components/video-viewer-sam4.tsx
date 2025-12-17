"use client"

import { Card } from "@/components/ui/card"
import { Eye, AlertCircle, Video } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface VideoViewerProps {
  mediaUrl: string | null
  resultUrl: string | null
  error: string | null
}

export default function VideoViewer({ mediaUrl, resultUrl, error }: VideoViewerProps) {
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
          <AnimatePresence mode="wait">
            {resultUrl ? (
              <motion.div
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full"
              >
                <video
                  src={resultUrl}
                  controls
                  className="w-full max-h-[400px]"
                  crossOrigin="anonymous"
                />
              </motion.div>
            ) : mediaUrl ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full"
              >
                <video
                  src={mediaUrl}
                  controls
                  className="w-full max-h-[400px]"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  )
}

