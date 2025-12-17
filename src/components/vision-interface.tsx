"use client"

import { useState } from "react"
import { Upload, Loader2, Image as ImageIcon, Video, Eye, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      {/* Left Column - Upload & Controls */}
      <div className="space-y-6">
        {/* Upload Area */}
        <div className="soft-card p-6 sm:p-8">
          <label
            htmlFor="image-upload"
            className={`flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed transition-all cursor-pointer
              ${previewUrl 
                ? 'h-64 sm:h-80 border-gray-300 bg-gray-50' 
                : 'h-56 sm:h-72 border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50'
              }
            `}
          >
            {previewUrl ? (
              <div className="relative w-full h-full group p-4">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center rounded-xl">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-8 h-8 text-gray-600" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <div className="flex gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                    <Video className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  Upload media
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  Drag and drop or click to select
                </p>
                <p className="text-xs text-gray-500">
                  Supports images and videos
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

        {/* Prompt Input */}
        <div className="soft-card p-6">
          <label className="block mb-3">
            <span className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              What to identify
            </span>
            <p className="text-sm text-gray-600 mt-1 mb-3">
              Describe what objects you want to detect in the media
            </p>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Find all people, cars, and buildings..."
            rows={4}
            className="w-full px-4 py-3 text-sm border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d4b5a0] focus:border-transparent transition-all resize-none placeholder:text-gray-400"
          />
          
          {/* Sliders */}
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
                <span>Confidence</span>
                <span className="text-gray-900 font-semibold">{threshold.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#d4b5a0]"
              />
            </div>
            <div>
              <label className="flex items-center justify-between text-xs font-medium text-gray-700 mb-2">
                <span>Mask Quality</span>
                <span className="text-gray-900 font-semibold">{maskThreshold.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={maskThreshold}
                onChange={(e) => setMaskThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#d4b5a0]"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <Button
            onClick={handleProcess}
            disabled={!selectedFile || isProcessing}
            className="w-full mt-6 h-12 bg-[#d4b5a0] hover:bg-[#c9a890] text-gray-900 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Analyze
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Right Column - Results */}
      <div className="soft-card p-6 sm:p-8">
        {result ? (
          <div className="space-y-6">
            {result.error ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="font-semibold text-gray-900 mb-2">Processing Error</p>
                <p className="text-sm text-gray-600 max-w-md">{result.error}</p>
              </div>
            ) : (
              <>
                {/* Segmented Image */}
                {result.resultImageUrl && (
                  <div>
                    <img
                      src={result.resultImageUrl}
                      alt="Segmentation Result"
                      className="w-full h-auto rounded-xl"
                      crossOrigin="anonymous"
                    />
                  </div>
                )}
                
                {/* Details */}
                {result.details && (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                      Detection Results
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                      {result.details}
                    </p>
                  </div>
                )}

                {/* Processing Time */}
                {result.duration && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-xs font-medium text-gray-600">Processing time</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {result.duration.toFixed(2)}s
                    </span>
                  </div>
                )}
                
                {/* API Response (Collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    View technical details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-900 rounded-lg overflow-auto max-h-48">
                    <pre className="text-xs text-green-400 font-mono">
                      {result.output}
                    </pre>
                  </div>
                </details>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-900 mb-2">
              Upload media to begin analysis
            </p>
            <p className="text-sm text-gray-500 max-w-xs">
              Select an image or video and describe what you want to detect
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

