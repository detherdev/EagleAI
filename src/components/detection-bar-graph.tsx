"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

interface Detection {
  label: string
  confidence: number
}

interface DetectionBarGraphProps {
  detailsText: string
}

export default function DetectionBarGraph({ detailsText }: DetectionBarGraphProps) {
  // Parse the detection details text
  const parseDetections = (text: string): Detection[] => {
    const detections: Detection[] = []
    
    // Match patterns like "person (0.95)" or "car: 0.87"
    const patterns = [
      /(\w+(?:\s+\w+)*)\s*\((\d+\.?\d*)\)/g,  // Matches: "person (0.95)"
      /(\w+(?:\s+\w+)*)\s*:\s*(\d+\.?\d*)/g,   // Matches: "car: 0.87"
    ]
    
    for (const pattern of patterns) {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const label = match[1].trim()
        const confidence = parseFloat(match[2])
        if (confidence >= 0 && confidence <= 1) {
          detections.push({ label, confidence })
        }
      }
    }
    
    // Sort by confidence descending
    return detections.sort((a, b) => b.confidence - a.confidence)
  }

  const detections = parseDetections(detailsText)

  if (detections.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="overflow-hidden bg-card">
        <div className="border-b border-border bg-muted/30 px-4 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Detections ({detections.length})
          </p>
        </div>
        <div className="space-y-2 p-4">
          {detections.map((detection, index) => (
            <motion.div
              key={`${detection.label}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-1"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{detection.label}</span>
                <span className="text-muted-foreground">
                  {(detection.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${detection.confidence * 100}%` }}
                  transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-secondary to-secondary/80"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  )
}

