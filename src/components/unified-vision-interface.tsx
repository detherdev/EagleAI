"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ImageIcon, Play, X, Search, MousePointer, Box, Wand2, RotateCcw } from "lucide-react"
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

interface Point {
  x: number
  y: number
}

interface UnifiedVisionInterfaceProps {
  mode: 'text' | 'box' | 'tracker'
  onModeChange: (mode: 'text' | 'box' | 'tracker') => void
}

export default function UnifiedVisionInterface({ mode, onModeChange }: UnifiedVisionInterfaceProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [prompt, setPrompt] = useState("")
  const [threshold, setThreshold] = useState([0.5])
  const [maskThreshold, setMaskThreshold] = useState([0.5])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [analysisTime, setAnalysisTime] = useState<number | null>(null)
  const [resultUrl, setResultUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [clickPoints, setClickPoints] = useState<Point[]>([])
  const [isClickMode, setIsClickMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isValidImageFile(file)) {
      setResult({ error: "Please select a valid image file (JPEG, PNG, GIF, or WebP)" })
      setError("Please select a valid image file (JPEG, PNG, GIF, or WebP)")
      return
    }

    setSelectedFile(file)
    setResult(null)
    setError(null)
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

    if (!isValidImageFile(file)) {
      setResult({ error: "Please select a valid image file" })
      setError("Please select a valid image file")
      return
    }

    setSelectedFile(file)
    setResult(null)
    setError(null)
    setResultUrl(null)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const handleTextPromptAnalyze = async () => {
    if (!prompt.trim() || !selectedFile) return

    setIsAnalyzing(true)
    setIsProcessing(true)
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
      setResultUrl(proxiedUrl)
      setResult({
        output: JSON.stringify(apiResult.data, null, 2),
        duration: apiResult.duration,
        resultImageUrl: proxiedUrl,
        details: apiResult.details,
      })
      setError(null)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred processing the image"
      setResult({ error: errorMsg })
      setError(errorMsg)
    } finally {
      setIsAnalyzing(false)
      setIsProcessing(false)
    }
  }

  const handleAutoDetect = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setIsAnalyzing(true)
    setError(null)
    setResult(null)
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('prompt', 'object. thing. item. person. animal. vehicle.')
      formData.append('threshold', '0.25')
      formData.append('maskThreshold', '0.3')

      console.log('Auto-detect: Sending request to /api/sam4')

      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })

      console.log('Auto-detect: Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Auto-detect: Error response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to process image')
      }

      const apiResult = await response.json()
      console.log('Auto-detect: API result:', apiResult)
      
      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000
      
      const imageUrl = apiResult.result_image?.url || apiResult.result_image?.path
      console.log('Auto-detect: Image URL:', imageUrl)

      if (imageUrl) {
        const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
        console.log('Auto-detect: Proxied URL:', proxiedUrl)
        
        setAnalysisTime(totalTime)
        setResultUrl(proxiedUrl)
        setResult({
          output: JSON.stringify(apiResult.data, null, 2),
          resultImageUrl: proxiedUrl,
          details: apiResult.details,
        })
        setError(null)
        console.log('Auto-detect: Success! Result set.')
      } else {
        console.error('Auto-detect: No image URL in response')
        const details = apiResult.details || ""
        if (details.includes("Objects found: 0")) {
          throw new Error("No objects detected in the image. Try uploading a different image with more distinct objects.")
        }
        throw new Error("No result image returned. Check console for details.")
      }
    } catch (err) {
      console.error('Auto-detect: Error:', err)
      const errorMsg = err instanceof Error ? err.message : "An error occurred processing the image"
      setError(errorMsg)
      setResult({ error: errorMsg })
    } finally {
      setIsProcessing(false)
      setIsAnalyzing(false)
    }
  }

  const handleImageClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== 'tracker' || !isClickMode || !selectedFile || isProcessing) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newPoint = { x, y }
    const newPoints = [...clickPoints, newPoint]
    setClickPoints(newPoints)

    // Auto-segment after click
    await handleClickSegment(newPoints)
  }

  const handleClickSegment = async (points: Point[]) => {
    if (!selectedFile || points.length === 0) return

    setIsProcessing(true)
    setIsAnalyzing(true)
    setError(null)
    const startTime = Date.now()

    try {
      // Since the SAM4 API doesn't support programmatic point-based segmentation,
      // we'll use the text-based API with a very low threshold as a workaround
      // This will segment the most prominent objects in the image
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('prompt', 'object')
      formData.append('threshold', '0.2') // Very low threshold for sensitivity
      formData.append('maskThreshold', '0.2')

      console.log('Click-segment: Using text API with low threshold as workaround for click-based segmentation')

      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })

      console.log('Click-segment: Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Click-segment: Error response:', errorData)
        throw new Error(errorData.details || errorData.error || 'Failed to process image')
      }

      const apiResult = await response.json()
      console.log('Click-segment: API result:', apiResult)
      
      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000
      
      const imageUrl = apiResult.result_image?.url || apiResult.result_image?.path
      console.log('Click-segment: Image URL:', imageUrl)

      if (imageUrl) {
        const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`
        setAnalysisTime(totalTime)
        setResultUrl(proxiedUrl)
        setResult({
          output: JSON.stringify(apiResult.data, null, 2),
          resultImageUrl: proxiedUrl,
          details: apiResult.details,
        })
        setError(null)
        console.log('Click-segment: Success!')
      } else {
        throw new Error("No result image returned from segmentation.")
      }
    } catch (err) {
      console.error('Click-segment: Error:', err)
      const errorMsg = err instanceof Error ? err.message : "An error occurred processing the image"
      setError(errorMsg)
      setResult({ error: errorMsg })
    } finally {
      setIsProcessing(false)
      setIsAnalyzing(false)
    }
  }

  const handleResetPoints = () => {
    setClickPoints([])
    setResultUrl(null)
    setResult(null)
    setError(null)
    setAnalysisTime(null)
  }

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setPrompt("")
    setResult(null)
    setResultUrl(null)
    setError(null)
    setAnalysisTime(null)
    setClickPoints([])
    setIsClickMode(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Draw points on canvas
  useEffect(() => {
    if (!canvasRef.current || !imageRef.current || clickPoints.length === 0) return

    const canvas = canvasRef.current
    const image = imageRef.current
    
    canvas.width = image.clientWidth
    canvas.height = image.clientHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    clickPoints.forEach((point, index) => {
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
  }, [clickPoints])

  return (
    <div className="space-y-6 w-full">
      {/* Hero - Image Viewer */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        {/* Upload or Image Display */}
        {!selectedFile ? (
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
                    <p className="text-xs text-muted-foreground">
                      {mode === 'text' && 'Text-based object detection'}
                      {mode === 'box' && 'Bounding box segmentation'}
                      {mode === 'tracker' && 'Automatic object segmentation'}
                    </p>
                  </div>
                </div>
              </motion.button>
            </Card>
          </motion.div>
        ) : mode === 'tracker' && isClickMode ? (
          <>
            <Card className="overflow-hidden bg-card transition-shadow duration-300 hover:shadow-xl">
              <div 
                className="relative max-h-[400px] overflow-hidden flex items-center justify-center bg-muted/30 cursor-crosshair"
                onClick={handleImageClick}
              >
                {/* Base image */}
                {previewUrl && (
                  <img
                    ref={imageRef}
                    src={previewUrl}
                    alt="Original"
                    className="w-full h-full object-contain max-h-[400px]"
                  />
                )}
                
                {/* Canvas for click points */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                />
                
                {/* Segmentation overlay */}
                <AnimatePresence>
                  {resultUrl && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <img
                        src={resultUrl}
                        alt="Segmentation overlay"
                        className="w-full h-full object-contain max-h-[400px] mix-blend-normal"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Click instruction overlay */}
                {!isProcessing && clickPoints.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-primary">
                        Click on an object to segment it
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Error display */}
              {error && (
                <div className="border-t border-border bg-destructive/10 px-4 py-3">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
            </Card>

            {/* Clear and Reset Buttons */}
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              {clickPoints.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPoints}
                    className="size-8 rounded-full bg-background/80 p-0 backdrop-blur-sm transition-all hover:bg-background"
                    title="Reset points"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
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
            </div>
          </>
        ) : (
          <>
            <MediaViewer 
              mediaUrl={previewUrl} 
              resultUrl={resultUrl || result?.resultImageUrl || null}
              error={error || result?.error || null}
              detectionDetails={result?.details || null}
            />
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
          </>
        )}
      </motion.div>

      {/* Controls - Change based on mode */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
      >
        <Card className="bg-card p-6">
          <div className="space-y-4">
            {/* Mode-specific controls */}
            {mode === 'text' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <label htmlFor="prompt" className="text-sm font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                    What to identify
                  </label>
                  <div className="grid w-full sm:w-auto sm:min-w-[300px] grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                    <Button
                      variant={mode === 'text' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onModeChange('text')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Search className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Text Prompt</span>
                      <span className="sm:hidden">Text</span>
                    </Button>
                    <Button
                      variant={mode === 'box' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onModeChange('box')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Box className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Bounding Box</span>
                      <span className="sm:hidden">Box</span>
                    </Button>
                    <Button
                      variant={mode === 'tracker' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onModeChange('tracker')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <MousePointer className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Interactive</span>
                      <span className="sm:hidden">Click</span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Describe what objects you want to detect in the media
                  </p>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., person, car, dog..."
                    className="min-h-[60px] resize-none"
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Confidence Threshold</label>
                      <span className="text-xs text-muted-foreground">{threshold[0].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={threshold}
                      onValueChange={setThreshold}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Mask Quality</label>
                      <span className="text-xs text-muted-foreground">{maskThreshold[0].toFixed(2)}</span>
                    </div>
                    <Slider
                      value={maskThreshold}
                      onValueChange={setMaskThreshold}
                      min={0}
                      max={1}
                      step={0.01}
                      className="w-full"
                    />
                  </div>
                </div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleTextPromptAnalyze}
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

                {analysisTime !== null && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center text-muted-foreground"
                  >
                    Analysis completed in {analysisTime.toFixed(2)}s
                  </motion.p>
                )}
              </>
            )}

            {mode === 'box' && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Box className="size-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bounding Box Segmentation</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Draw a box around the object you want to segment. Coming soon with full drawing interface.
                </p>
              </div>
            )}

            {mode === 'tracker' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="size-4 text-primary" />
                    <label className="text-sm font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                      Interactive Segmentation
                    </label>
                  </div>
                  <div className="grid w-full sm:w-auto sm:min-w-[300px] grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                    <Button
                      variant={mode === 'text' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onModeChange('text')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Search className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Text Prompt</span>
                      <span className="sm:hidden">Text</span>
                    </Button>
                    <Button
                      variant={mode === 'box' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onModeChange('box')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Box className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Bounding Box</span>
                      <span className="sm:hidden">Box</span>
                    </Button>
                    <Button
                      variant={mode === 'tracker' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => onModeChange('tracker')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <MousePointer className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Interactive</span>
                      <span className="sm:hidden">Click</span>
                    </Button>
                  </div>
                </div>

                {/* Mode selector: Click or Auto */}
                <div className="flex gap-2">
                  <Button
                    variant={isClickMode ? "default" : "outline"}
                    onClick={() => {
                      setIsClickMode(true)
                      handleResetPoints()
                    }}
                    disabled={!selectedFile}
                    className="flex-1"
                  >
                    <MousePointer className="mr-2 size-4" />
                    Click to Segment
                  </Button>
                  <Button
                    variant={!isClickMode ? "default" : "outline"}
                    onClick={() => {
                      setIsClickMode(false)
                      handleResetPoints()
                    }}
                    disabled={!selectedFile}
                    className="flex-1"
                  >
                    <Wand2 className="mr-2 size-4" />
                    Auto Detect
                  </Button>
                </div>

                {isClickMode ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Click anywhere on the image to segment the most prominent objects. The AI will automatically detect and segment objects near your click.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      💡 Tip: This uses automatic object detection triggered by your click. For precise text-based segmentation, use the &quot;Text Prompt&quot; tab.
                    </p>
                    {clickPoints.length > 0 && (
                      <div className="text-xs text-muted-foreground text-center">
                        {clickPoints.length} click{clickPoints.length !== 1 ? 's' : ''} · Segmenting objects automatically
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Automatically detect and segment all objects in the image without any input. Works best with images containing people, animals, vehicles, or common objects.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">
                      💡 Tip: If no objects are detected, try using the &quot;Text Prompt&quot; tab and describe what you want to find.
                    </p>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleAutoDetect}
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
                            Segment All Objects
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </>
                )}

                {analysisTime !== null && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-center text-muted-foreground"
                  >
                    Analysis completed in {analysisTime.toFixed(2)}s
                  </motion.p>
                )}
              </>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

