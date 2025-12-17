"use client"

import { useState, useRef } from "react"
import { Upload, ImageIcon, Video, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import MediaViewer from "@/components/media-viewer-sam4"
import { motion, AnimatePresence } from "framer-motion"
import { isValidImageFile } from "@/lib/huggingface-api"

interface ProcessingResult {
  output?: string
  duration?: number
  error?: string
  resultImageUrl?: string
  details?: string
}

interface VisionInterfaceProps {
  tabsList?: React.ReactNode
}

export default function VisionInterface({ tabsList }: VisionInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [prompt, setPrompt] = useState("")
  const [threshold, setThreshold] = useState([0.5])
  const [maskThreshold, setMaskThreshold] = useState([0.5])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [analysisTime, setAnalysisTime] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isValidImageFile(file)) {
      setResult({ error: "Please select a valid image file (JPEG, PNG, GIF, or WebP)" })
      return
    }

    setSelectedFile(file)
    setResult(null)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
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

    if (!isValidImageFile(file)) {
      setResult({ error: "Please select a valid image file" })
      return
    }

    setSelectedFile(file)
    setResult(null)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleAnalyze = async () => {
    if (!prompt.trim() || !selectedFile) return

    setIsAnalyzing(true)
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('prompt', prompt)
      formData.append('threshold', threshold[0].toString())
      formData.append('maskThreshold', maskThreshold[0].toString())

      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to process image')
      }

      const apiResult = await response.json()
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      const imageUrl = apiResult.result_image?.url || apiResult.result_image?.path
      const proxiedUrl = imageUrl ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` : null

      setAnalysisTime(duration)
      setResult({
        output: JSON.stringify(apiResult.data, null, 2),
        duration: apiResult.duration,
        resultImageUrl: proxiedUrl,
        details: apiResult.details,
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "An error occurred processing the image",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setPrompt("")
    setResult(null)
    setAnalysisTime(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero - Image Viewer */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        <MediaViewer 
          mediaUrl={previewUrl} 
          resultUrl={result?.resultImageUrl || null}
          error={result?.error || null}
          detectionDetails={result?.details || null}
        />
        {/* Clear Image Button Overlay */}
        {(previewUrl || result?.resultImageUrl) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 top-3 z-10"
          >
            <motion.div whileHover={{ rotate: 90, scale: 1.1 }} transition={{ duration: 0.2 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="size-8 rounded-full bg-background/80 p-0 backdrop-blur-sm transition-all hover:bg-background"
              >
                <X className="size-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>

      {/* Controls Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Column - Upload & Controls */}
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
            className="space-y-6"
          >
            {/* Upload Card - Only show when no file selected */}
            {!selectedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
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
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <div className="rounded-lg bg-primary/10 p-3 transition-colors hover:bg-primary/20">
                            <ImageIcon className="size-6 text-primary" />
                          </div>
                        </motion.div>
                        <div className="space-y-2 text-center">
                          <p className="text-lg font-semibold text-primary">Upload image</p>
                          <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
                          <p className="text-xs text-muted-foreground">Text-based object detection</p>
                        </div>
                      </div>
                    </motion.button>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Prompt Card */}
            <Card className="bg-card p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <label htmlFor="prompt" className="text-sm font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                    What to identify
                  </label>
                  {tabsList && (
                    <div className="w-full sm:w-auto sm:min-w-[300px]">
                      {tabsList}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Describe what objects you want to detect in the media</p>
                </div>
                <Textarea
                  id="prompt"
                  placeholder="e.g., person, car, dog..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[60px] resize-none bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/5"
                />
                
                {/* Sliders */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Confidence Threshold</span>
                      <span className="text-primary">{threshold[0].toFixed(2)}</span>
                    </label>
                    <Slider
                      value={threshold}
                      onValueChange={setThreshold}
                      max={1}
                      step={0.05}
                      className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Mask Quality</span>
                      <span className="text-primary">{maskThreshold[0].toFixed(2)}</span>
                    </label>
                    <Slider
                      value={maskThreshold}
                      onValueChange={setMaskThreshold}
                      max={1}
                      step={0.05}
                      className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary"
                    />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleAnalyze}
                    disabled={!selectedFile || !prompt.trim() || isAnalyzing}
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

            {/* Analysis Time */}
            <AnimatePresence>
              {analysisTime !== null && !result?.error && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Card className="bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Analysis time</span>
                      <span className="text-sm text-muted-foreground">{analysisTime.toFixed(2)}s</span>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right Column - Details */}
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
            className="space-y-6"
          >
            {/* Additional info can go here in the future */}
          </motion.div>
        </div>
      </div>
  )
}

