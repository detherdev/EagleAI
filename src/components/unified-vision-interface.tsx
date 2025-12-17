"use client"

import { useState, useRef } from "react"
import { Upload, ImageIcon, Play, X, Search, MousePointer, Box, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import MediaViewer from "@/components/media-viewer-sam4"
import { motion, AnimatePresence } from "framer-motion"
import { isValidImageFile } from "@/lib/huggingface-api"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProcessingResult {
  output?: string
  duration?: number
  error?: string
  resultImageUrl?: string
  details?: string
}

interface UnifiedVisionInterfaceProps {
  mode: 'text' | 'box' | 'tracker'
}

export default function UnifiedVisionInterface({ mode }: UnifiedVisionInterfaceProps) {
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
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

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
                  <TabsList className="grid w-full sm:w-auto sm:min-w-[300px] grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Search className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Text Prompt</span>
                      <span className="sm:hidden">Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="box" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Box className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Bounding Box</span>
                      <span className="sm:hidden">Box</span>
                    </TabsTrigger>
                    <TabsTrigger value="tracker" className="flex items-center gap-2 text-xs sm:text-sm">
                      <MousePointer className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Auto Detect</span>
                      <span className="sm:hidden">Auto</span>
                    </TabsTrigger>
                  </TabsList>
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
                      Auto Detect Objects
                    </label>
                  </div>
                  <TabsList className="grid w-full sm:w-auto sm:min-w-[300px] grid-cols-3">
                    <TabsTrigger value="text" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Search className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Text Prompt</span>
                      <span className="sm:hidden">Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="box" className="flex items-center gap-2 text-xs sm:text-sm">
                      <Box className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Bounding Box</span>
                      <span className="sm:hidden">Box</span>
                    </TabsTrigger>
                    <TabsTrigger value="tracker" className="flex items-center gap-2 text-xs sm:text-sm">
                      <MousePointer className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Auto Detect</span>
                      <span className="sm:hidden">Auto</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically detect and segment all objects in the image without text prompts. Works best with images containing people, animals, vehicles, or common objects.
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
                        Segment Objects
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
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

