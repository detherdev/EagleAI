"use client"

import { useState } from "react"
import { Upload, Loader2, Video as VideoIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface ProcessingResult {
  output?: string
  duration?: number
  error?: string
  resultVideoUrl?: string
  status?: string
}

export function VideoInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [prompt, setPrompt] = useState("")
  const [maxFrames, setMaxFrames] = useState(50)
  const [timeoutSeconds, setTimeoutSeconds] = useState<"60" | "120">("60")

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      setResult({ error: "Please select a valid video file" })
      return
    }

    setSelectedFile(file)
    setResult(null)

    // Create preview
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  async function handleProcess() {
    if (!selectedFile) return

    setIsProcessing(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('prompt', prompt)
      formData.append('maxFrames', maxFrames.toString())
      formData.append('timeoutSeconds', timeoutSeconds)

      const response = await fetch('/api/sam4/video', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to process video')
      }

      const apiResult = await response.json()

      setResult({
        output: JSON.stringify(apiResult.data, null, 2),
        duration: apiResult.duration,
        resultVideoUrl: apiResult.result_video?.url || null,
        status: apiResult.status,
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : "An error occurred processing the video",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Upload Video</CardTitle>
          <CardDescription>
            Process videos with SAM4 text prompts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="video-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
            >
              {previewUrl ? (
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP4, AVI, MOV, or other video formats
                  </p>
                </div>
              )}
              <input
                id="video-upload"
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          <div>
            <label htmlFor="video-prompt" className="block text-sm font-medium mb-2">
              Text Prompt
            </label>
            <input
              id="video-prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what to track/segment..."
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div>
            <label htmlFor="maxFrames" className="block text-sm font-medium mb-2">
              Max Frames: {maxFrames}
            </label>
            <input
              id="maxFrames"
              type="range"
              min="10"
              max="200"
              step="10"
              value={maxFrames}
              onChange={(e) => setMaxFrames(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Max Processing Time
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="60"
                  checked={timeoutSeconds === "60"}
                  onChange={(e) => setTimeoutSeconds(e.target.value as "60" | "120")}
                />
                <span className="text-sm">60 seconds</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="120"
                  checked={timeoutSeconds === "120"}
                  onChange={(e) => setTimeoutSeconds(e.target.value as "60" | "120")}
                />
                <span className="text-sm">120 seconds</span>
              </label>
            </div>
          </div>

          <Button
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Video...
              </>
            ) : (
              <>
                <VideoIcon className="mr-2 h-4 w-4" />
                Process Video
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Video processing output
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              {result.error ? (
                <div className="p-4 border border-destructive bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive font-medium">Error</p>
                  <p className="text-sm text-destructive/80 mt-1">{result.error}</p>
                </div>
              ) : (
                <>
                  {result.duration && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium">Processing Time</span>
                      <span className="text-sm text-muted-foreground">
                        {result.duration.toFixed(2)}s
                      </span>
                    </div>
                  )}
                  
                  {result.resultVideoUrl && (
                    <div className="border rounded-lg overflow-hidden">
                      <p className="text-sm font-medium p-2 bg-muted">Result Video</p>
                      <video
                        src={result.resultVideoUrl}
                        controls
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                  
                  {result.status && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Status</p>
                      <p className="text-sm whitespace-pre-wrap">{result.status}</p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Full API Response</p>
                    <pre className="text-xs overflow-auto max-h-64 whitespace-pre-wrap">
                      {result.output}
                    </pre>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <VideoIcon className="w-12 h-12 mb-3" />
              <p className="text-sm">No results yet</p>
              <p className="text-xs mt-1">Upload and process a video to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

