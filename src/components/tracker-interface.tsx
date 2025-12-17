"use client"

import { useState, useRef } from "react"
import { Upload, MousePointer, X, Wand2, Eraser } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

interface Point {
  x: number
  y: number
}

export default function TrackerInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [points, setPoints] = useState<Point[]>([])
  const [multimask, setMultimask] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [analysisTime, setAnalysisTime] = useState<number | null>(null)
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file")
      return
    }

    setSelectedFile(file)
    setError(null)
    setPoints([])
    setResultUrl(null)

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

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file")
      return
    }

    setSelectedFile(file)
    setError(null)
    setPoints([])
    setResultUrl(null)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect()
      setImageDimensions({ width: rect.width, height: rect.height })
      
      // Initialize canvas
      if (canvasRef.current) {
        canvasRef.current.width = rect.width
        canvasRef.current.height = rect.height
      }
    }
  }

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || resultUrl) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPoints = [...points, { x, y }]
    setPoints(newPoints)
    drawPoints(newPoints)
  }

  const drawPoints = (pointsToDraw: Point[]) => {
    if (!canvasRef.current || !imageRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    pointsToDraw.forEach((point, index) => {
      const x = (point.x / 100) * canvas.width
      const y = (point.y / 100) * canvas.height

      // Draw point
      ctx.fillStyle = "rgb(233, 124, 97)"
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border
      ctx.strokeStyle = "rgb(250, 247, 242)"
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, 2 * Math.PI)
      ctx.stroke()

      // Draw label
      ctx.fillStyle = "rgb(250, 247, 242)"
      ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif"
      ctx.fillText(`${index + 1}`, x + 10, y - 10)
    })
  }

  const handleClearPoints = () => {
    setPoints([])
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
  }

  const handleSegment = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError(null)
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      // Use the text detection API with a generic prompt to detect all objects
      formData.append('prompt', 'all objects')
      formData.append('threshold', '0.3') // Lower threshold for better detection
      formData.append('maskThreshold', '0.5')

      console.log("Sending request to /api/sam4 with prompt: 'all objects'")

      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })

      console.log("Response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Error response:", errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to process image')
      }

      const result = await response.json()
      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000 // Convert to seconds
      
      console.log("Interactive Tracker API result:", result)
      
      const imageUrl = result.segmented_image_url
      console.log("Segmented image URL:", imageUrl)
      
      const proxiedUrl = imageUrl ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` : null
      console.log("Proxied URL:", proxiedUrl)

      if (proxiedUrl) {
        setAnalysisTime(totalTime)
        setResultUrl(proxiedUrl)
      } else {
        console.error("Full API response:", JSON.stringify(result, null, 2))
        throw new Error("No result image returned. Check console for full response.")
      }
    } catch (err) {
      console.error("Interactive Tracker error:", err)
      setError(err instanceof Error ? err.message : "An error occurred processing the image")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setResultUrl(null)
    setPoints([])
    setError(null)
    setAnalysisTime(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleNewSegmentation = () => {
    setResultUrl(null)
    setPoints([])
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
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
        {(previewUrl || resultUrl) && (
          <Card className="overflow-hidden bg-card transition-shadow duration-300 hover:shadow-xl">
            <div className="relative">
              <AnimatePresence mode="wait">
                {resultUrl ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <img
                      src={resultUrl}
                      alt="Segmented result"
                      className="w-full"
                    />
                  </motion.div>
                ) : previewUrl ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <img
                      ref={imageRef}
                      src={previewUrl}
                      alt="Preview"
                      className="w-full"
                      onLoad={handleImageLoad}
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </Card>
        )}
        
        {/* Clear Image Button Overlay */}
        {(previewUrl || resultUrl) && (
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
                        className="flex space-x-2"
                      >
                        <div className="rounded-lg bg-primary/10 p-3 transition-colors hover:bg-primary/20">
                          <MousePointer className="size-6 text-primary" />
                        </div>
                      </motion.div>
                      <div className="space-y-2 text-center">
                        <p className="text-lg font-semibold text-primary">Upload image</p>
                        <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
                        <p className="text-xs text-muted-foreground">Automatic object segmentation</p>
                      </div>
                    </div>
                  </motion.button>
                </Card>
              </motion.div>
            </motion.div>
          )}

          {/* Instructions Card */}
        <AnimatePresence>
          {selectedFile && !resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-card p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="size-4 text-primary" />
                    <label className="text-sm font-semibold uppercase tracking-wide text-primary">
                      Interactive Segmentation
                    </label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect and segment all objects in the image without needing text prompts. Uses a lower detection threshold for comprehensive results.
                  </p>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleSegment}
                      disabled={!selectedFile || isProcessing}
                      className="w-full bg-secondary text-secondary-foreground transition-all duration-300 hover:bg-secondary/90 hover:shadow-lg"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="mr-2 size-4 animate-spin rounded-full border-2 border-secondary-foreground border-t-transparent" />
                          Segmenting...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 size-4" />
                          Segment Object
                        </>
                      )}
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Actions & Analysis Time */}
        <AnimatePresence>
          {resultUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {analysisTime !== null && (
                <Card className="bg-card p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Analysis time</span>
                    <span className="text-sm text-muted-foreground">{analysisTime.toFixed(2)}s</span>
                  </div>
                </Card>
              )}
              
              <Card className="bg-card p-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-primary">
                    Segmentation Complete
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The object has been segmented. Start a new segmentation or upload a different image.
                  </p>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleNewSegmentation}
                      variant="outline"
                      className="w-full"
                    >
                      <MousePointer className="mr-2 size-4" />
                      New Segmentation
                    </Button>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-destructive/10 p-6">
                <p className="text-sm text-destructive">{error}</p>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Column - Additional Space */}
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

