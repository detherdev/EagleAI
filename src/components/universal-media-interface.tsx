"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, ImageIcon, Video, Play, X, Search, MousePointer, Box, Wand2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import MediaViewer from "@/components/media-viewer-sam4"
import VideoViewer from "@/components/video-viewer-sam4"
import { motion, AnimatePresence } from "framer-motion"
import { isValidImageFile } from "@/lib/huggingface-api"

interface ProcessingResult {
  output?: string
  duration?: number
  error?: string
  resultImageUrl?: string
  resultVideoUrl?: string
  details?: string
  status?: string
}

interface Point {
  x: number
  y: number
}

type MediaType = 'none' | 'image' | 'video'
type Mode = 'text' | 'box' | 'tracker'

export default function UniversalMediaInterface() {
  const [mediaType, setMediaType] = useState<MediaType>('none')
  const [mode, setMode] = useState<Mode>('text')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [prompt, setPrompt] = useState("")
  const [threshold, setThreshold] = useState([0.5])
  const [maskThreshold, setMaskThreshold] = useState([0.5])
  const [maxFrames, setMaxFrames] = useState([50])
  const [videoDuration, setVideoDuration] = useState(0)
  const [trimStart, setTrimStart] = useState([0])
  const [trimEnd, setTrimEnd] = useState([0])
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setResult({ error: "Please select a valid image or video file" })
      setError("Please select a valid image or video file")
      return
    }

    setSelectedFile(file)
    setMediaType(isImage ? 'image' : 'video')
    setResult(null)
    setError(null)
    setResultUrl(null)
    setAnalysisTime(null)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    if (isVideo) {
      const duration = await getVideoDuration(url)
      setVideoDuration(duration)
      setTrimStart([0])
      setTrimEnd([duration])
    }
  }

  const getVideoDuration = (url: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = url

      video.onloadedmetadata = () => {
        resolve(video.duration)
        video.remove()
      }

      video.onerror = () => reject(new Error('Error loading video'))
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files?.[0]
    if (!file) return

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      setResult({ error: "Please select a valid image or video file" })
      setError("Please select a valid image or video file")
      return
    }

    setSelectedFile(file)
    setMediaType(isImage ? 'image' : 'video')
    setResult(null)
    setError(null)
    setResultUrl(null)

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    if (isVideo) {
      const duration = await getVideoDuration(url)
      setVideoDuration(duration)
      setTrimStart([0])
      setTrimEnd([duration])
    }
  }

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setMediaType('none')
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

  const handleImageAnalyze = async () => {
    if (!prompt.trim() || !selectedFile || mediaType !== 'image') return

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

  const handleVideoAnalyze = async () => {
    if (!prompt.trim() || !selectedFile || mediaType !== 'video') return

    setIsAnalyzing(true)
    setIsProcessing(true)
    const startTime = Date.now()

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('prompt', prompt)
      formData.append('maxFrames', maxFrames[0].toString())
      formData.append('timeoutSeconds', '120')

      const response = await fetch('/api/sam4/video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to process video')
      }

      const apiResult = await response.json()
      const endTime = Date.now()
      const totalTime = (endTime - startTime) / 1000
      setAnalysisTime(totalTime)
      
      const videoUrl = apiResult.result_video?.url || apiResult.result_video?.path
      const proxiedUrl = videoUrl ? `/api/proxy-image?url=${encodeURIComponent(videoUrl)}` : null

      setResultUrl(proxiedUrl)
      setResult({
        resultVideoUrl: proxiedUrl,
        status: apiResult.status,
      })
      setError(null)
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "An error occurred processing the video"
      setResult({ error: errorMsg })
      setError(errorMsg)
    } finally {
      setIsAnalyzing(false)
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6 w-full">
      {/* Hero - Media Upload/Display */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
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
                accept="image/*,video/*"
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
                      <ImageIcon className="size-6 text-primary" />
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3 transition-colors hover:bg-primary/20">
                      <Video className="size-6 text-primary" />
                    </div>
                  </motion.div>
                  <div className="space-y-2 text-center">
                    <p className="text-lg font-semibold text-primary">Upload Image or Video</p>
                    <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
                    <p className="text-xs text-muted-foreground">
                      AI-powered object detection and segmentation
                    </p>
                  </div>
                </div>
              </motion.button>
            </Card>
          </motion.div>
        ) : mediaType === 'image' ? (
          <>
            <MediaViewer 
              mediaUrl={previewUrl} 
              resultUrl={resultUrl || result?.resultImageUrl || null}
              error={error || result?.error || null}
              detectionDetails={result?.details || null}
            />
            <div className="absolute right-3 top-3 z-10">
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
            <VideoViewer
              mediaUrl={previewUrl}
              resultUrl={resultUrl || result?.resultVideoUrl || null}
              error={error || result?.error || null}
            />
            <div className="absolute right-3 top-3 z-10">
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
        )}
      </motion.div>

      {/* Controls - Adapt based on media type */}
      {selectedFile && (
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
        >
          <Card className="bg-card p-6">
            <div className="space-y-4">
              {/* Mode selector - only for images */}
              {mediaType === 'image' && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <label className="text-sm font-semibold uppercase tracking-wide text-primary whitespace-nowrap">
                    Detection Mode
                  </label>
                  <div className="grid w-full sm:w-auto sm:min-w-[300px] grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                    <Button
                      variant={mode === 'text' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('text')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Search className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Text</span>
                    </Button>
                    <Button
                      variant={mode === 'box' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('box')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <Box className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Box</span>
                    </Button>
                    <Button
                      variant={mode === 'tracker' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setMode('tracker')}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <MousePointer className="size-3 sm:size-4" />
                      <span className="hidden sm:inline">Click</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Image: Text mode */}
              {mediaType === 'image' && mode === 'text' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="prompt" className="text-sm font-medium text-muted-foreground">
                      What to identify
                    </label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., person, car, dog..."
                      className="min-h-[60px] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Confidence</label>
                        <span className="text-xs text-muted-foreground">{threshold[0].toFixed(2)}</span>
                      </div>
                      <Slider value={threshold} onValueChange={setThreshold} min={0} max={1} step={0.01} />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-muted-foreground">Mask Quality</label>
                        <span className="text-xs text-muted-foreground">{maskThreshold[0].toFixed(2)}</span>
                      </div>
                      <Slider value={maskThreshold} onValueChange={setMaskThreshold} min={0} max={1} step={0.01} />
                    </div>
                  </div>

                  <Button
                    onClick={handleImageAnalyze}
                    disabled={!prompt.trim() || isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 size-4" />
                        Analyze Image
                      </>
                    )}
                  </Button>
                </>
              )}

              {/* Image: Box mode */}
              {mediaType === 'image' && mode === 'box' && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Box className="size-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Bounding Box Segmentation</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Draw a box around objects. Coming soon.
                  </p>
                </div>
              )}

              {/* Image: Interactive mode */}
              {mediaType === 'image' && mode === 'tracker' && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <MousePointer className="size-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Interactive Segmentation</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Click on objects to segment them. Coming soon.
                  </p>
                </div>
              )}

              {/* Video mode */}
              {mediaType === 'video' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="video-prompt" className="text-sm font-medium text-muted-foreground">
                      What to track
                    </label>
                    <Textarea
                      id="video-prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., person, car, dog..."
                      className="min-h-[60px] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-muted-foreground">Max Frames</label>
                      <span className="text-xs text-muted-foreground">{maxFrames[0]}</span>
                    </div>
                    <Slider value={maxFrames} onValueChange={setMaxFrames} min={10} max={1000} step={10} />
                  </div>

                  <Button
                    onClick={handleVideoAnalyze}
                    disabled={!prompt.trim() || isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="mr-2 size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 size-4" />
                        Process Video
                      </>
                    )}
                  </Button>
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
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

