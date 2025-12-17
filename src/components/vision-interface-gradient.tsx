"use client"

import { useState } from "react"
import { Upload, Loader2, Image as ImageIcon, Sparkles, CheckCircle2, AlertCircle } from "lucide-react"
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
    <div className="grid gap-6 lg:gap-8 lg:grid-cols-2">
      {/* Upload Section */}
      <Card className="glass-effect hover-lift border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <ImageIcon className="w-6 h-6 text-purple-600" />
            Upload Image
          </CardTitle>
          <CardDescription className="text-base">
            Choose an image to segment with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Image Upload */}
          <div className="relative">
            <label
              htmlFor="image-upload"
              className={`flex flex-col items-center justify-center w-full rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
                ${previewUrl 
                  ? 'h-64 sm:h-80 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50' 
                  : 'h-56 sm:h-64 border-gray-300 hover:border-purple-400 bg-gradient-to-br from-gray-50 to-white hover:from-purple-50 hover:to-blue-50'
                }
              `}
            >
              {previewUrl ? (
                <div className="relative w-full h-full group">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="w-8 h-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 px-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-base font-semibold text-gray-700 mb-2">
                    Click or drag to upload
                  </p>
                  <p className="text-sm text-gray-500">
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

          {/* Text Prompt */}
          <div className="space-y-2">
            <label htmlFor="prompt" className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Describe what to segment
            </label>
            <input
              id="prompt"
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'the person', 'all the cars', 'red flowers'"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 bg-white/50 backdrop-blur-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Sliders */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>Confidence</span>
                <span className="text-purple-600 font-semibold">{threshold.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>Mask Quality</span>
                <span className="text-blue-600 font-semibold">{maskThreshold.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={maskThreshold}
                onChange={(e) => setMaskThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-gradient-to-r from-blue-200 to-blue-400 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Process Button */}
          <Button
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Segment Image
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="glass-effect hover-lift border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            {result?.error ? (
              <AlertCircle className="w-6 h-6 text-red-500" />
            ) : result ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
            Results
          </CardTitle>
          <CardDescription className="text-base">
            {result ? "Segmentation complete" : "Results will appear here"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-6">
              {result.error ? (
                <div className="p-6 border-2 border-red-200 bg-red-50/50 backdrop-blur-sm rounded-2xl">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900 mb-1">Processing Error</p>
                      <p className="text-sm text-red-700">{result.error}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Processing Time */}
                  {result.duration && (
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200/50">
                      <span className="text-sm font-medium text-gray-700">Processing Time</span>
                      <span className="text-sm font-bold text-purple-700">
                        {result.duration.toFixed(2)}s
                      </span>
                    </div>
                  )}
                  
                  {/* Segmented Image */}
                  {result.resultImageUrl && (
                    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
                      <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2">
                        <p className="text-sm font-semibold text-white">Segmented Result</p>
                      </div>
                      <div className="relative bg-white p-2">
                        <img
                          src={result.resultImageUrl}
                          alt="Segmentation Result"
                          className="w-full h-auto rounded-lg"
                          crossOrigin="anonymous"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Details */}
                  {result.details && (
                    <div className="p-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-200">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Detection Details</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.details}</p>
                    </div>
                  )}
                  
                  {/* API Response (Collapsible) */}
                  <details className="group">
                    <summary className="cursor-pointer p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                      <span className="text-sm font-semibold text-gray-700">View Full API Response</span>
                    </summary>
                    <div className="mt-2 p-4 bg-gray-900 rounded-xl overflow-auto max-h-64">
                      <pre className="text-xs text-green-400 font-mono">
                        {result.output}
                      </pre>
                    </div>
                  </details>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 sm:h-80 text-gray-400">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-4">
                <ImageIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-base font-medium">No results yet</p>
              <p className="text-sm mt-2 text-center max-w-xs">
                Upload an image and click &quot;Segment Image&quot; to see results
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

