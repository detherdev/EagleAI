"use client"

import { useState } from "react"
import { Upload, Loader2, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isValidImageFile } from "@/lib/huggingface-api"

interface ProcessingResult {
  output?: string
  duration?: number
  error?: string
  resultImageUrl?: string
  details?: string
}

export function VisionInterface() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [prompt, setPrompt] = useState("")
  const [threshold, setThreshold] = useState(0.5)
  const [maskThreshold, setMaskThreshold] = useState(0.5)

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!isValidImageFile(file)) {
      setResult({ error: "Please select a valid image file (JPEG, PNG, GIF, or WebP)" })
      return
    }

    setSelectedFile(file)
    setResult(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleProcess() {
    if (!selectedFile) return

    setIsProcessing(true)
    setResult(null)

    try {
      // Use the Next.js API route which uses Gradio client
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('prompt', prompt)
      formData.append('threshold', threshold.toString())
      formData.append('maskThreshold', maskThreshold.toString())

      const response = await fetch('/api/sam4', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to process image')
      }

      const apiResult = await response.json()
      
      console.log('API Result:', apiResult)
      console.log('Result Image URL:', apiResult.result_image?.url)

      // Use proxy to avoid CORS issues
      const imageUrl = apiResult.result_image?.url || apiResult.result_image?.path
      const proxiedUrl = imageUrl ? `/api/proxy-image?url=${encodeURIComponent(imageUrl)}` : null

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
      setIsProcessing(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Upload Image</CardTitle>
          <CardDescription>
            Select an image to process with SAM4 vision API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500"
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-12 h-12 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF, or WebP
                  </p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileSelect}
              />
            </label>
          </div>

          <div>
            <label htmlFor="prompt" className="block text-sm font-medium mb-2">
              Text Prompt (optional)
            </label>
            <input
              id="prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what to segment..."
              className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium mb-2">
                Confidence: {threshold.toFixed(2)}
              </label>
              <input
                id="threshold"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="maskThreshold" className="block text-sm font-medium mb-2">
                Mask: {maskThreshold.toFixed(2)}
              </label>
              <input
                id="maskThreshold"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={maskThreshold}
                onChange={(e) => setMaskThreshold(parseFloat(e.target.value))}
                className="w-full"
              />
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
                Processing...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Process Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Output from SAM4 vision API
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
                  
                  {result.resultImageUrl && (
                    <div className="border rounded-lg overflow-hidden">
                      <p className="text-sm font-medium p-2 bg-muted">Segmented Result</p>
                      <div className="relative">
                        <img
                          src={result.resultImageUrl}
                          alt="Segmentation Result"
                          className="w-full h-auto"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Image failed to load:', result.resultImageUrl)
                            console.error('Error:', e)
                          }}
                          onLoad={() => {
                            console.log('Image loaded successfully:', result.resultImageUrl)
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {result.details && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Details</p>
                      <p className="text-sm whitespace-pre-wrap">{result.details}</p>
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
              <ImageIcon className="w-12 h-12 mb-3" />
              <p className="text-sm">No results yet</p>
              <p className="text-xs mt-1">Upload and process an image to see results</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

