"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, Video as VideoIcon, Play, X, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import VideoViewer from "@/components/video-viewer-sam4"
import { motion, AnimatePresence } from "framer-motion"

interface ProcessingResult {
  output?: string
  duration?: number
  error?: string
  resultVideoUrl?: string
  status?: string
}

export default function VideoInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [prompt, setPrompt] = useState("")
  const [maxFrames, setMaxFrames] = useState([50])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [trimStart, setTrimStart] = useState([0])
  const [trimEnd, setTrimEnd] = useState([100])
  const [currentTime, setCurrentTime] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current
      const handleLoadedMetadata = () => {
        setVideoDuration(video.duration)
        setTrimEnd([video.duration])
      }
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [previewUrl])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setResult({ error: "Please select a valid video file" })
      return
    }

    setSelectedFile(file)
    setResult(null)
    setTrimStart([0])

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

    if (!file.type.startsWith('video/')) {
      setResult({ error: "Please select a valid video file" })
      return
    }

    setSelectedFile(file)
    setResult(null)
    setTrimStart([0])

    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const trimVideo = async (file: File, startTime: number, endTime: number): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.src = URL.createObjectURL(file)

      video.onloadedmetadata = async () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // For now, we'll just pass the full video with trim parameters
        // A proper implementation would require FFmpeg.wasm or server-side processing
        resolve(file)
      }

      video.onerror = () => reject(new Error('Error loading video'))
    })
  }

  const handleAnalyze = async () => {
    if (!prompt.trim() || !selectedFile) return

    setIsAnalyzing(true)
    setResult(null)
    const startTime = Date.now()

    try {
      // If user has trimmed the video, we note the trim times
      const actualTrimStart = trimStart[0]
      const actualTrimEnd = trimEnd[0]
      const isTrimmed = actualTrimStart > 0 || actualTrimEnd < videoDuration

      let fileToUpload = selectedFile

      if (isTrimmed) {
        // In a production app, you'd use FFmpeg.wasm to actually trim the video
        // For now, we'll send the full video but could add trim params to the API
        console.log(`Video trimmed from ${actualTrimStart}s to ${actualTrimEnd}s`)
      }

      const formData = new FormData()
      formData.append('video', fileToUpload)
      formData.append('prompt', prompt)
      formData.append('maxFrames', maxFrames[0].toString())
      formData.append('timeoutSeconds', '120') // Auto-set to 120 seconds

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
      const totalTime = (endTime - startTime) / 1000 // Convert to seconds
      
      const videoUrl = apiResult.result_video?.url || apiResult.result_video?.path
      const proxiedUrl = videoUrl ? `/api/proxy-image?url=${encodeURIComponent(videoUrl)}` : null

      setAnalysisTime(totalTime)
      setResult({
        output: JSON.stringify(apiResult.data, null, 2),
        duration: apiResult.duration,
        resultVideoUrl: proxiedUrl,
        status: apiResult.status,
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "An error occurred processing the video",
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
    setTrimStart([0])
    setTrimEnd([100])
    setVideoDuration(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  return (
    <div className="space-y-6">
      {/* Hero - Video Viewer */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        <VideoViewer 
          mediaUrl={previewUrl} 
          resultUrl={result?.resultVideoUrl || null}
          error={result?.error || null}
        />
        {/* Clear Video Button Overlay */}
        {(previewUrl || result?.resultVideoUrl) && (
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
                  accept="video/*"
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
                        <VideoIcon className="size-6 text-primary" />
                      </div>
                    </motion.div>
                    <div className="space-y-2 text-center">
                      <p className="text-lg font-semibold text-primary">Upload video</p>
                      <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
                      <p className="text-xs text-muted-foreground">Supports MP4, MOV, AVI and more</p>
                    </div>
                  </div>
                </motion.button>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Video Trimmer */}
        <AnimatePresence>
          {selectedFile && videoDuration > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-card p-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Scissors className="size-4 text-primary" />
                    <label className="text-sm font-semibold uppercase tracking-wide text-primary">
                      Trim Video
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Select the portion of the video to analyze
                  </p>
                  
                  {/* Video Preview for Trimming */}
                  <div className="relative">
                    <video
                      ref={videoRef}
                      src={previewUrl || undefined}
                      className="w-full rounded-lg"
                      onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Start: {formatTime(trimStart[0])}</span>
                      <span>End: {formatTime(trimEnd[0])}</span>
                    </label>
                    <div className="space-y-2">
                      <Slider
                        value={trimStart}
                        onValueChange={(value) => {
                          setTrimStart(value)
                          handleSeek(value[0])
                        }}
                        min={0}
                        max={videoDuration}
                        step={0.1}
                        className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                      />
                      <Slider
                        value={trimEnd}
                        onValueChange={(value) => {
                          setTrimEnd(value)
                          handleSeek(value[0])
                        }}
                        min={0}
                        max={videoDuration}
                        step={0.1}
                        className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Duration: {formatTime(videoDuration)}</span>
                      <span>Selected: {formatTime(trimEnd[0] - trimStart[0])}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
                What to track
              </label>
              <p className="text-xs text-muted-foreground">Describe what objects you want to track in the video</p>
            </div>
            <Textarea
              id="prompt"
              placeholder="e.g., person, car, red vehicle..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[60px] resize-none bg-background transition-all duration-200 focus:shadow-lg focus:shadow-primary/5"
            />
            
            {/* Max Frames Control */}
            <div className="space-y-2">
              <label className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>Max Frames to Process</span>
                <span className="text-primary">{maxFrames[0]}</span>
              </label>
              <Slider
                value={maxFrames}
                onValueChange={setMaxFrames}
                min={10}
                max={1000}
                step={10}
                className="[&_[role=slider]]:bg-secondary [&_[role=slider]]:border-secondary"
              />
              <p className="text-xs text-muted-foreground">
                Processing time: 120 seconds max
              </p>
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

        {/* Status Details */}
        <AnimatePresence>
          {result?.status && !result.error && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Card className="bg-card p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">
                  Processing Status
                </h3>
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-lg border border-border bg-background px-4 py-3"
                  >
                    <p className="text-sm text-foreground whitespace-pre-wrap">{result.status}</p>
                  </motion.div>
                  {analysisTime !== null && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3"
                    >
                      <span className="text-sm font-medium text-foreground">Analysis time</span>
                      <span className="text-sm text-muted-foreground">{analysisTime.toFixed(2)}s</span>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Right Column - Additional Controls */}
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
