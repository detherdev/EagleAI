"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, ImageIcon, Video, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import MediaViewer from "@/components/media-viewer"
import { motion, AnimatePresence } from "framer-motion"

type MediaType = "image" | "video" | null

export default function VisionInterface() {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<MediaType>(null)
  const [prompt, setPrompt] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [detectedObjects, setDetectedObjects] = useState<
    Array<{
      id: string
      label: string
      bbox: { x: number; y: number; width: number; height: number }
    }>
  >([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const type = file.type.startsWith("image/") ? "image" : "video"

    setMediaUrl(url)
    setMediaType(type)
    setDetectedObjects([])
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    const type = file.type.startsWith("image/") ? "image" : "video"

    setMediaUrl(url)
    setMediaType(type)
    setDetectedObjects([])
  }

  const handleAnalyze = async () => {
    if (!prompt.trim() || !mediaUrl) return

    setIsAnalyzing(true)

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock detected objects
    setDetectedObjects([
      {
        id: "1",
        label: "Person",
        bbox: { x: 20, y: 15, width: 35, height: 60 },
      },
      {
        id: "2",
        label: "Car",
        bbox: { x: 60, y: 40, width: 30, height: 25 },
      },
    ])

    setIsAnalyzing(false)
  }

  const handleClear = () => {
    if (mediaUrl) {
      URL.revokeObjectURL(mediaUrl)
    }
    setMediaUrl(null)
    setMediaType(null)
    setPrompt("")
    setDetectedObjects([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="border-b border-border bg-card"
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-sans text-3xl font-bold tracking-tight text-primary">Vision AI</h1>
              <p className="mt-1 text-sm text-muted-foreground">Identify objects in images and videos</p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Upload & Controls */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="space-y-6"
          >
            {/* Upload Card */}
            <motion.div
              animate={{
                scale: isDragging ? 1.02 : 1,
                borderColor: isDragging ? "rgb(233, 124, 97)" : "transparent",
              }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="border-2 border-dashed border-border bg-card p-8 transition-all duration-300"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {!mediaUrl ? (
                    <motion.button
                      key="upload"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                          className="flex space-x-2"
                        >
                          <div className="rounded-lg bg-primary/10 p-3 transition-colors hover:bg-primary/20">
                            <ImageIcon className="size-6 text-primary" />
                          </div>
                          <div className="rounded-lg bg-primary/10 p-3 transition-colors hover:bg-primary/20">
                            <Video className="size-6 text-primary" />
                          </div>
                        </motion.div>
                        <div className="space-y-2 text-center">
                          <p className="text-lg font-semibold text-primary">Upload media</p>
                          <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
                          <p className="text-xs text-muted-foreground">Supports images and videos</p>
                        </div>
                      </div>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="uploaded"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex items-center space-x-2"
                        >
                          {mediaType === "image" ? (
                            <ImageIcon className="size-5 text-primary" />
                          ) : (
                            <Video className="size-5 text-primary" />
                          )}
                          <span className="text-sm font-medium text-foreground">
                            {mediaType === "image" ? "Image uploaded" : "Video uploaded"}
                          </span>
                        </motion.div>
                        <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <X className="size-4" />
                          </Button>
                        </motion.div>
                      </div>
                      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                          <Upload className="mr-2 size-4" />
                          Change file
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>

            {/* Prompt Card */}
            <Card className="bg-card p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label htmlFor="prompt" className="text-sm font-semibold uppercase tracking-wide text-primary">
                    What to identify
                  </label>
                  <p className="text-xs text-muted-foreground">Describe what objects you want to detect in the media</p>
                </div>
                <Textarea
                  id="prompt"
                  placeholder="e.g., Find all people, cars, and buildings..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[120px] resize-none bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/5"
                />
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!mediaUrl || !prompt.trim() || isAnalyzing}
                    className="w-full bg-secondary text-secondary-foreground transition-all duration-300 hover:bg-secondary/90 hover:shadow-lg"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 size-4" />
                        Analyze
                      </>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </Card>

            {/* Detected Objects */}
            <AnimatePresence>
              {detectedObjects.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Card className="bg-card p-6">
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
                      Detected Objects
                    </h3>
                    <div className="space-y-2">
                      {detectedObjects.map((obj, index) => (
                        <motion.div
                          key={obj.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1, duration: 0.3 }}
                          whileHover={{ x: 4, scale: 1.01 }}
                          className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3 transition-shadow hover:shadow-md"
                        >
                          <span className="font-medium text-foreground">{obj.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {obj.bbox.width.toFixed(0)}% × {obj.bbox.height.toFixed(0)}%
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column - Media Viewer */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="lg:sticky lg:top-8 lg:self-start"
          >
            <MediaViewer mediaUrl={mediaUrl} mediaType={mediaType} detectedObjects={detectedObjects} />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
